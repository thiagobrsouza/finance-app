import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, className = "", id, children, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = "Select";
