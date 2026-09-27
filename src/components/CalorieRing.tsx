const SIZE = 112;
const STROKE = 9;
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

  const overGoal = Boolean(goal) && ratio > 1.1;
  const nearGoal = Boolean(goal) && ratio > 0.9 && ratio <= 1.1;
  const stroke = overGoal
    ? "var(--status-critical)"
    : nearGoal
      ? "var(--status-warning)"
      : "url(#calorieRingGradient)";

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={
        goal
          ? `${Math.round(consumed)} of ${goal} calories logged today`
          : `${Math.round(consumed)} calories logged today`
      }
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <defs>
          <linearGradient
            id="calorieRingGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
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
          stroke={stroke}
          strokeWidth={STROKE + 0.5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-tight text-ink-primary">
          {Math.round(consumed)}
        </span>
        <span className="text-[9px] font-medium uppercase text-ink-muted">
          Eaten
        </span>
      </div>
    </div>
  );
}
