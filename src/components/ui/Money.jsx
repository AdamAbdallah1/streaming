import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/cn";

/**
 * Price display. Optional `was` renders the pre-discount figure struck
 * through; `emphasis` scales the current figure up.
 */
export default function Money({
  amount,
  currency = "USD",
  wasAmount,
  emphasis,
  className,
  ...props
}) {
  return (
    <span
      className={cn("inline-flex items-baseline gap-1.5 tnum", className)}
      {...props}
    >
      {wasAmount != null && (
        <span
          className={cn(
            "text-ink-tertiary line-through decoration-1",
            emphasis ? "text-[0.62em]" : "text-[13px]"
          )}
        >
          {formatMoney(wasAmount, currency)}
        </span>
      )}
      <span
        className={emphasis ? "font-semibold tracking-[-0.02em]" : "font-medium"}
      >
        {formatMoney(amount, currency)}
      </span>
    </span>
  );
}

/** Planned reference used inside tables and dense rows. */
export function MoneyCell({ amount, currency = "USD", className }) {
  return (
    <span className={cn("tnum text-[14px] font-medium text-ink", className)}>
      {formatMoney(amount, currency)}
    </span>
  );
}
