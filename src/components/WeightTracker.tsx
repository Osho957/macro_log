"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone, formatDisplayDate } from "@/lib/dates";

interface WeightLog {
  id: string;
  logged_date: string;
  weight: number;
  unit: string;
}

export function WeightTracker({
  userId,
  timezone,
  unit,
  recentLogs,
}: {
  userId: string;
  timezone: string;
  unit: string;
  recentLogs: WeightLog[];
}) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("weight_logs").upsert(
      {
        user_id: userId,
        logged_date: todayInTimezone(timezone),
        weight: Number(weight),
        unit,
      },
      { onConflict: "user_id,logged_date" },
    );

    setSaving(false);

    if (error) {
      setError("Couldn't save. Please try again.");
      return;
    }

    setWeight("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Weight</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          min={0}
          step="0.1"
          placeholder={`Today's weight (${unit})`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="flex-1 rounded-lg border border-border px-3 py-2 bg-page"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-ink-primary px-3 py-2 text-sm font-medium text-page disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {saving ? "..." : "Log"}
        </button>
      </form>

      {error && <p className="text-sm text-status-critical">{error}</p>}

      {recentLogs.length > 0 && (
        <ul className="divide-y divide-border text-sm">
          {recentLogs.map((log) => (
            <li key={log.id} className="flex justify-between py-1.5">
              <span className="text-ink-muted">
                {formatDisplayDate(log.logged_date)}
              </span>
              <span>
                {log.weight} {log.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
