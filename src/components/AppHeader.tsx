import Link from "next/link";
import { Flame, Settings as SettingsIcon } from "lucide-react";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { WaterQuickAdd } from "@/components/WaterQuickAdd";

export async function AppHeader({ title }: { title: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) return null;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone, water_goal_ml")
    .eq("user_id", user.id)
    .maybeSingle();

  const today = todayInTimezone(settings?.timezone ?? "UTC");

  const { data: waterLog } = await supabase
    .from("water_logs")
    .select("amount_ml")
    .eq("logged_date", today)
    .maybeSingle();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-page/90 px-5 py-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-accent-2 shadow-lg shadow-accent/20">
          <Flame className="h-4 w-4 stroke-[2.5] text-page" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-accent">
            MacroLog
          </span>
          <h1 className="text-sm font-bold leading-tight tracking-tight text-ink-primary">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <WaterQuickAdd
          userId={user.id}
          timezone={settings?.timezone ?? "UTC"}
          amountMl={waterLog?.amount_ml ?? 0}
        />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-ink-muted transition-colors hover:text-ink-primary"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
