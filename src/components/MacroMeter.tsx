export function MacroMeter({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal?: number | null;
}) {
  const ratio = goal ? Math.min(Math.max(value / goal, 0), 1) : 0;

  return (
    <div className="flex-1 rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-primary">
        {Math.round(value)}g
        {goal ? (
          <span className="font-normal text-ink-muted"> / {goal}g</span>
        ) : null}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-accent-track">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
