const SIZE = 128;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MacroDonutChart({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const total = protein + carbs + fat || 1;
  const proteinPct = protein / total;
  const carbsPct = carbs / total;
  const fatPct = fat / total;

  const proteinLen = proteinPct * CIRCUMFERENCE;
  const carbsLen = carbsPct * CIRCUMFERENCE;
  const fatLen = fatPct * CIRCUMFERENCE;

  const proteinOffset = 0;
  const carbsOffset = -proteinLen;
  const fatOffset = -(proteinLen + carbsLen);

  return (
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
          stroke="var(--protein)"
          strokeWidth={STROKE}
          strokeDasharray={`${proteinLen} ${CIRCUMFERENCE}`}
          strokeDashoffset={proteinOffset}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--carbs)"
          strokeWidth={STROKE}
          strokeDasharray={`${carbsLen} ${CIRCUMFERENCE}`}
          strokeDashoffset={carbsOffset}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--fat)"
          strokeWidth={STROKE}
          strokeDasharray={`${fatLen} ${CIRCUMFERENCE}`}
          strokeDashoffset={fatOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-medium uppercase text-ink-muted">
          Protein
        </span>
        <span className="text-sm font-bold text-protein">
          {Math.round(proteinPct * 100)}%
        </span>
      </div>
    </div>
  );
}
