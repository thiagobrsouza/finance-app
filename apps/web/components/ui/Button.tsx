import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "h-10 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-dark"
      : "bg-transparent border border-[var(--border)] text-[var(--text)] hover:bg-black/5";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
