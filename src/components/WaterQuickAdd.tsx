"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";

export function WaterQuickAdd({
  userId,
  timezone,
  amountMl,
}: {
  userId: string;
  timezone: string;
  amountMl: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function addWater() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("water_logs").upsert(
      {
        user_id: userId,
        logged_date: todayInTimezone(timezone),
        amount_ml: amountMl + 250,
      },
      { onConflict: "user_id,logged_date" },
    );
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={addWater}
      disabled={saving}
      className="flex items-center gap-1 rounded-xl border border-water/20 bg-water/10 px-2.5 py-1.5 text-xs font-medium text-water transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <Droplet className="h-3.5 w-3.5 fill-water/20" />
      <span>+250ml</span>
    </button>
  );
}
