export function StatCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex-1 p-[18px] rounded-lg border bg-[var(--surface)] ${
        danger ? "border-red-300" : "border-[var(--border)]"
      }`}
    >
      <div className={`text-xs ${danger ? "text-red-600" : "text-[var(--text-muted)]"}`}>{label}</div>
      <div className={`text-2xl font-bold mt-1.5 ${danger ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}
