import { formatCurrency } from "../lib/format";

const COLORS = ["#319085", "#21665c", "#7fb8ae", "#a9d6cf", "#0f4a42", "#c3e4de", "#5f9089", "#dbeeeb"];

interface Slice {
  categoryName: string;
  total: number;
}

export function CategoryPieChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-[220px] rounded-md border border-dashed border-[var(--border)] flex items-center justify-center text-sm text-[var(--text-muted)]">
        Sem dados no período
      </div>
    );
  }

  const radius = 80;
  const cx = 90;
  const cy = 90;
  let angleStart = -90;

  const slices = data.map((d, i) => {
    const fraction = d.total / total;
    const angleEnd = angleStart + fraction * 360;
    const path = describeArc(cx, cy, radius, angleStart, angleEnd);
    const color = COLORS[i % COLORS.length];
    const slice = { ...d, path, color, fraction };
    angleStart = angleEnd;
    return slice;
  });

  return (
    <div className="flex gap-6 items-center flex-wrap">
      <svg viewBox="0 0 180 180" className="w-[200px] h-[200px] flex-shrink-0">
        {slices.map((s) => (
          <path key={s.categoryName} d={s.path} fill={s.color} />
        ))}
      </svg>

      <div className="flex-1 min-w-[200px] flex flex-col gap-2">
        {slices.map((s) => (
          <div key={s.categoryName} className="flex items-center gap-2.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="flex-1">{s.categoryName}</span>
            <span className="text-[var(--text-muted)]">{formatCurrency(s.total)}</span>
            <span className="text-xs text-[var(--text-muted)] w-[42px] text-right">{(s.fraction * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const clampedEnd = Math.min(endAngle, startAngle + 359.99);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, clampedEnd);
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${start.x.toFixed(2)},${start.y.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${end.x.toFixed(2)},${end.y.toFixed(2)} Z`;
}
