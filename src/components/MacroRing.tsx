const SIZE = 56;
const STROKE = 4.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const COLOR_VARS = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
} as const;

export function MacroRing({
  label,
  color,
  value,
  goal,
}: {
  label: string;
  color: keyof typeof COLOR_VARS;
  value: number;
  goal?: number | null;
}) {
  const ratio = goal ? value / goal : 0;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const dash = clamped * CIRCUMFERENCE;
  const pct = goal ? Math.round(clamped * 100) : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-border bg-surface p-3 text-center">
      <span
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: COLOR_VARS[color] }}
      >
        {label}
      </span>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--accent-track)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={COLOR_VARS[color]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            className="transition-[stroke-dasharray] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink-primary">
          {pct != null ? `${pct}%` : "-"}
        </div>
      </div>
      <p className="text-[11px] font-semibold text-ink-primary">
        {Math.round(value)}
        <span className="font-normal text-ink-muted">
          {goal ? `/${goal}g` : "g"}
        </span>
      </p>
    </div>
  );
}
