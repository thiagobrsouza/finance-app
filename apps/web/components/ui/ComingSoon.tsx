export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-[var(--text-muted)]">Esta tela ainda está em construção.</p>
    </div>
  );
}
