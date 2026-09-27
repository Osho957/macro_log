import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

// How long a validated session is trusted before we re-check it with
// Supabase over the network. Session cookies still carry their own real
// expiry (checked below) - this only controls how often we re-confirm a
// still-unexpired session hasn't been revoked early. 60s is a deliberate
// trade-off for a personal app: a revoked session could keep working for
// up to a minute, in exchange for skipping a ~450-500ms network round
// trip on most navigations.
const TRUST_WINDOW_MS = 60_000;
const TRUST_COOKIE = "mw-auth-ts";

interface CachedUser {
  id: string;
  email?: string;
}

function findAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .find((c) => /^sb-.*-auth-token$/.test(c.name));
}

/** Supabase's own session cookie already contains the user + expiry;
 * decoding it locally avoids a network call entirely when we choose to
 * trust it. Returns null on anything unexpected so callers always have a
 * safe "fall back to a real check" path. */
function decodeSessionCookie(
  cookieValue: string,
): { user: CachedUser; expiresAtMs: number } | null {
  if (!cookieValue.startsWith("base64-")) return null;
  try {
    const binary = atob(cookieValue.slice(7));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed?.user?.id || !parsed?.expires_at) return null;
    return {
      user: { id: parsed.user.id, email: parsed.user.email ?? undefined },
      expiresAtMs: parsed.expires_at * 1000,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("code");
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  const trustTs = Number(request.cookies.get(TRUST_COOKIE)?.value ?? 0);
  const withinTrustWindow =
    trustTs > 0 && Date.now() - trustTs < TRUST_WINDOW_MS;

  const authCookie = findAuthCookie(request);
  const decoded = authCookie ? decodeSessionCookie(authCookie.value) : null;
  const cookieSessionValid = decoded != null && decoded.expiresAtMs > Date.now();

  let user: CachedUser | null = null;
  let refreshTrustCookie = false;

  if (withinTrustWindow && cookieSessionValid) {
    // Fast path: no network call. The session cookie's own expiry is real
    // (Supabase issued it), we're just skipping the revocation re-check.
    user = decoded!.user;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user
      ? { id: data.user.id, email: data.user.email ?? undefined }
      : null;
    refreshTrustCookie = user != null;
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Forward the already-validated user to Server Components via a request
  // header, so a page's own auth check (getAuthUser()) can read it instead
  // of independently calling Supabase again for the same information.
  const forwardedHeaders = new Headers(request.headers);
  if (user) {
    forwardedHeaders.set("x-user-id", user.id);
    if (user.email) forwardedHeaders.set("x-user-email", user.email);
  } else {
    forwardedHeaders.delete("x-user-id");
    forwardedHeaders.delete("x-user-email");
  }

  const finalResponse = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });
  if (refreshTrustCookie) {
    finalResponse.cookies.set(TRUST_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60,
      path: "/",
    });
  }

  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
