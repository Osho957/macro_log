"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";

export function WaterTracker({
  userId,
  timezone,
  goalMl,
  initialAmountMl,
}: {
  userId: string;
  timezone: string;
  goalMl: number;
  initialAmountMl: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmountMl);
  const [saving, setSaving] = useState(false);

  const ratio = goalMl ? Math.min(Math.max(amount / goalMl, 0), 1) : 0;

  async function adjust(delta: number) {
    const next = Math.max(0, amount + delta);
    setAmount(next);
    setSaving(true);

    const supabase = createClient();
    await supabase.from("water_logs").upsert(
      {
        user_id: userId,
        logged_date: todayInTimezone(timezone),
        amount_ml: next,
      },
      { onConflict: "user_id,logged_date" },
    );

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-water/20 bg-water/10 text-water">
          💧
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-ink-primary">
              Hydration
            </span>
            <span className="text-[11px] font-semibold text-water">
              {amount.toLocaleString()} / {goalMl.toLocaleString()} ml
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-accent-track">
            <div
              className="h-full rounded-full bg-water transition-[width] duration-300"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => adjust(250)}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-page text-sm font-bold text-water transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          +
        </button>
        <button
          onClick={() => adjust(-250)}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-page text-sm font-bold text-ink-muted transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          −
        </button>
      </div>
    </div>
  );
}
