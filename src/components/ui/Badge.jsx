import { cn } from "../../lib/cn";

const TONES = {
  neutral: "bg-muted text-ink-secondary border-line",
  brand: "bg-brand-soft text-brand-strong border-brand-line",
  positive: "bg-positive-soft text-positive border-positive-line",
  warning: "bg-warning-soft text-warning border-warning-line",
  danger: "bg-danger-soft text-danger border-danger-line",
  outline: "bg-surface text-ink-tertiary border-line",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-[12px]",
};

export default function Badge({
  tone = "neutral",
  size = "md",
  icon,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border font-medium leading-5",
        TONES[tone],
        SIZES[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
