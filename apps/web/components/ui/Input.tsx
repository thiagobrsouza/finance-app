import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`h-10 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-primary ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
Input.displayName = "Input";
