import { useId } from "react";
import { cn } from "../../lib/cn";

export default function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}) {
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-ink-secondary">
          {label}
          {required && <span className="ml-1 text-brand">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[12px] leading-5 text-ink-tertiary">{hint}</p>
      )}
      {error && (
        <p
          key={error}
          role="alert"
          className="anim-rise flex items-center gap-1.5 text-[12px] leading-5 text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
