import { cn } from "../../lib/cn";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "anim-fade flex flex-col items-center justify-center rounded-[var(--radius-xl)]",
        "border border-dashed border-line bg-inset px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="anim-scale-in mb-5 grid size-11 place-items-center rounded-[var(--radius-lg)] border border-line bg-surface text-ink-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-[14px] leading-6 text-ink-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Full-page centred state, used for errors and empty carts. */
export function PageState({ icon, title, description, action }) {
  return (
    <div className="anim-fade mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      {icon && (
        <div className="anim-scale-in mb-5 grid size-12 place-items-center rounded-[var(--radius-lg)] border border-line bg-surface text-ink-tertiary">
          {icon}
        </div>
      )}
      <h1 className="text-[20px] font-semibold text-ink">{title}</h1>
      {description && (
        <p className="mt-2.5 text-[14px] leading-6 text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
