import { formatCurrency } from "../lib/format";

interface Point {
  month: string;
  income: number;
  expense: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = 28;

export function EvolutionChart({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const groupWidth = (WIDTH - PADDING * 2) / data.length;
  const barWidth = Math.min(22, groupWidth / 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Despesas
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[220px]">
        {data.map((d, i) => {
          const groupX = PADDING + i * groupWidth;
          const incomeHeight = (d.income / max) * (HEIGHT - PADDING * 2);
          const expenseHeight = (d.expense / max) * (HEIGHT - PADDING * 2);
          const baseline = HEIGHT - PADDING;

          return (
            <g key={d.month}>
              <rect
                x={groupX + groupWidth / 2 - barWidth - 2}
                y={baseline - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                fill="#22c55e"
                rx={2}
              />
              <rect
                x={groupX + groupWidth / 2 + 2}
                y={baseline - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                fill="#ef4444"
                rx={2}
              />
              <text x={groupX + groupWidth / 2} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                {d.month.slice(5)}/{d.month.slice(2, 4)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>Escala máxima: {formatCurrency(max)}</span>
      </div>
    </div>
  );
}
