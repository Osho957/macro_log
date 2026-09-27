import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component; ignore because
            // middleware refreshes the session on every request instead.
          }
        },
      },
      global: {
        // Supabase reads are dynamic per-request data, never a static
        // asset; without this Next's fetch layer can cache a GET to
        // PostgREST and keep serving it after the underlying row changes.
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );
}

/**
 * Cached per-request so multiple server components/layouts on the same
 * request (layout, page, AppHeader, etc.) share one auth check instead of
 * each making its own round trip to Supabase Auth.
 *
 * middleware.ts already validates the session for every request and
 * forwards the result via x-user-id/x-user-email headers, so the common
 * case here is just reading those - no second network call to Supabase
 * for information middleware already confirmed moments earlier. Only
 * falls back to a real getUser() call if those headers are missing (e.g.
 * a request that somehow bypassed middleware).
 */
export const getAuthUser = cache(async (): Promise<{
  data: { user: Pick<User, "id" | "email"> | null };
}> => {
  const headerList = await headers();
  const userId = headerList.get("x-user-id");

  if (userId) {
    return {
      data: {
        user: {
          id: userId,
          email: headerList.get("x-user-email") ?? undefined,
        },
      },
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { data: { user: data.user } };
});
