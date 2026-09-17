const COLORS: Record<string, string> = {
  OPEN: "bg-primary-light text-primary",
  CLOSED: "bg-gray-200 text-gray-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export function Badge({ tone = "OPEN", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${COLORS[tone] ?? COLORS.OPEN}`}>{children}</span>
  );
}
