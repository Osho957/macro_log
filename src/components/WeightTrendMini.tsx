export function WeightTrendMini({
  days,
}: {
  days: { label: string; weight: number | null }[];
}) {
  const values = days.map((d) => d.weight).filter((w): w is number => w != null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const range = max - min || 1;

  return (
    <div className="grid grid-cols-7 items-end gap-1.5 border-t border-border pt-2 h-16">
      {days.map((day, i) => {
        const heightPct = day.weight != null ? 0.35 + ((day.weight - min) / range) * 0.65 : 0.15;
        const isLast = i === days.length - 1;
        return (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
            <div
              className={`w-full rounded-t ${isLast ? "bg-accent shadow-sm shadow-accent/50" : "bg-accent-track"}`}
              style={{ height: `${heightPct * 100}%` }}
            />
            <span
              className={`text-[9px] ${isLast ? "font-bold text-accent" : "text-ink-muted"}`}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
