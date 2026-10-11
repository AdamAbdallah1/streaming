import { FiMinus, FiPlus } from "react-icons/fi";
import { cn } from "../../lib/cn";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled,
  label = "Quantity",
  size = "md",
  className,
}) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const dimensions =
    size === "sm" ? "h-8 [&_button]:size-8 [&_span]:min-w-7 [&_span]:text-[13px]"
                  : "h-10 [&_button]:size-10 [&_span]:min-w-9 [&_span]:text-[14px]";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-md)] border border-line bg-surface",
        disabled && "opacity-45",
        dimensions,
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="grid place-items-center rounded-l-[var(--radius-md)] text-ink-secondary transition-colors duration-150 hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-35"
      >
        <FiMinus size={15} />
      </button>
      <span className="text-center font-medium tnum" aria-live="polite">
        <span key={value} className="anim-num inline-block">
          {value}
        </span>
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="grid place-items-center rounded-r-[var(--radius-md)] text-ink-secondary transition-colors duration-150 hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-35"
      >
        <FiPlus size={15} />
      </button>
    </div>
  );
}
