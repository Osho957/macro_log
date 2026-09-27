export function WeeklyCalorieChart({
  days,
  goal,
}: {
  days: { label: string; calories: number }[];
  goal: number | null;
}) {
  const max = Math.max(goal ?? 0, ...days.map((d) => d.calories), 1) * 1.15;
  const width = 320;
  const height = 140;
  const barGap = 10;
  const barWidth = (width - barGap * (days.length - 1)) / days.length;
  const goalY = goal ? height - (goal / max) * height : null;

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
      {goalY != null && (
        <line
          x1={0}
          x2={width}
          y1={goalY}
          y2={goalY}
          stroke="var(--ink-muted)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
      {days.map((day, i) => {
        const barHeight = Math.max(2, (day.calories / max) * height);
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        const over = goal ? day.calories > goal : false;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={over ? "var(--status-warning)" : "var(--accent)"}
            />
            <text
              x={x + barWidth / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--ink-muted)"
            >
              {day.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
