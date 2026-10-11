import { cn } from "../../lib/cn";

const BASE =
  "inline-flex items-center justify-center gap-2 border font-medium " +
  "whitespace-nowrap select-none press transition-colors duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] " +
  "disabled:opacity-45 disabled:pointer-events-none";

const VARIANTS = {
  primary:
    "bg-ink text-canvas border-transparent hover:bg-[color-mix(in_srgb,var(--ink)_88%,white)] active:bg-[color-mix(in_srgb,var(--ink)_80%,white)]",
  brand:
    "bg-brand text-white border-transparent hover:bg-brand-strong active:bg-brand-press",
  secondary:
    "bg-surface text-ink border-line hover:border-line-strong hover:bg-sunken",
  quiet: "bg-transparent text-ink-secondary border-transparent hover:bg-muted hover:text-ink",
  danger: "bg-surface text-danger border-line hover:border-danger-line hover:bg-danger-soft",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-[14px] rounded-[var(--radius-md)]",
  lg: "h-12 px-5 text-[15px] rounded-[var(--radius-lg)]",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  block,
  className,
  type,
  children,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      type={isButton ? type || "button" : undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Square icon-only control. */
export function IconButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)]",
        "text-ink-tertiary transition-colors duration-150",
        "hover:bg-muted hover:text-ink",
        "disabled:opacity-40 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
