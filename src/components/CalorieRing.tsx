const SIZE = 168;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number | null;
}) {
  const ratio = goal ? consumed / goal : 0;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const dash = clamped * CIRCUMFERENCE;

  const color = !goal
    ? "var(--accent)"
    : ratio <= 0.9
      ? "var(--accent)"
      : ratio <= 1.1
        ? "var(--status-warning)"
        : "var(--status-critical)";

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={
        goal
          ? `${Math.round(consumed)} of ${goal} calories logged today`
          : `${Math.round(consumed)} calories logged today`
      }
    >
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
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-ink-primary">
          {Math.round(consumed)}
        </span>
        <span className="text-xs text-ink-muted">
          {goal ? `of ${goal} kcal` : "kcal today"}
        </span>
      </div>
    </div>
  );
}
