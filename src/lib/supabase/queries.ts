import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached per-request: AppHeader and a page both need user_settings on
 * almost every route, and without this they'd each make their own
 * separate round trip for the identical row.
 */
export const getUserSettings = cache(async (userId: string) => {
  const supabase = await createClient();
  return supabase
    .from("user_settings")
    .select(
      "timezone, weight_unit, age, height_cm, sex, activity_level, goal_type, water_goal_ml",
    )
    .eq("user_id", userId)
    .maybeSingle();
});

/** Cached per-request for the same reason: the Dashboard's water widget
 * and the header's quick-add pill both need today's water total. */
export const getWaterLog = cache(async (userId: string, loggedDate: string) => {
  const supabase = await createClient();
  return supabase
    .from("water_logs")
    .select("amount_ml")
    .eq("user_id", userId)
    .eq("logged_date", loggedDate)
    .maybeSingle();
});
