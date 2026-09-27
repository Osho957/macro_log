import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";

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

/**
 * Fast path for "today": reads the timezone TimezoneSync already stashed
 * in a cookie client-side, so pages don't have to await a Supabase query
 * just to learn the timezone before they can even start fetching their
 * actual (date-filtered) data. Falls back to a full DB round trip only on
 * a user's very first request, before that cookie has ever been set.
 */
export async function getTodayFast(userId: string): Promise<string> {
  const cookieStore = await cookies();
  const cookieTz = cookieStore.get("tz")?.value;

  if (cookieTz) {
    try {
      return todayInTimezone(decodeURIComponent(cookieTz));
    } catch {
      // fall through to the DB-backed lookup below
    }
  }

  const { data: settings } = await getUserSettings(userId);
  return todayInTimezone(settings?.timezone ?? "UTC");
}
