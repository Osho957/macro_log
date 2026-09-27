"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SettingsForm({
  userId,
  timezone,
  weightUnit,
}: {
  userId: string;
  timezone: string;
  weightUnit: string;
}) {
  const router = useRouter();
  const [unit, setUnit] = useState(weightUnit);
  const [saving, setSaving] = useState(false);

  async function handleUnitChange(value: string) {
    setUnit(value);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("user_settings")
      .update({ weight_unit: value })
      .eq("user_id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
        Preferences
      </h3>
      <div className="space-y-1">
        <label className="text-sm">Weight unit</label>
        <select
          value={unit}
          disabled={saving}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>
      <p className="text-xs text-ink-muted">
        Timezone: {timezone} (auto-detected from your device)
      </p>
    </div>
  );
}
