import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
