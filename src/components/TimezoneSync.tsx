"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function TimezoneSync() {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;

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
