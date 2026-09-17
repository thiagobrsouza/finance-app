import { formatCurrency } from "../lib/format";
import type { AccountBalanceSnapshot } from "../lib/types";

const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 12;

export function BalanceChart({ snapshots }: { snapshots: AccountBalanceSnapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="h-[220px] rounded-md border border-dashed border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-muted)]">
        Sem histórico ainda
      </div>
    );
  }

  const values = snapshots.map((s) => Number(s.balance));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = snapshots.map((s, i) => {
    const x = snapshots.length === 1 ? WIDTH / 2 : PADDING + (i / (snapshots.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((Number(s.balance) - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[180px]">
        <path d={path} fill="none" stroke="#319085" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#319085" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}
