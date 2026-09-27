"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TZ_COOKIE = "tz";

export function TimezoneSync() {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;

    // Set immediately (client-side, no network round trip) so the next
    // server render can read "today" straight from the cookie instead of
    // first waiting on a Supabase query just to learn the timezone.
    const cookieMatch = document.cookie.match(
      new RegExp(`(?:^|; )${TZ_COOKIE}=([^;]*)`),
    );
    if (cookieMatch?.[1] !== encodeURIComponent(detected)) {
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(detected)}; path=/; max-age=31536000; samesite=lax`;
    }

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from("user_settings")
        .select("timezone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings && settings.timezone !== detected) {
        await supabase
          .from("user_settings")
          .update({ timezone: detected })
          .eq("user_id", user.id);
      }
    })();
  }, []);

  return null;
}
