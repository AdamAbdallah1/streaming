import { cn } from "./cn";

/** Shared control styling so inputs, selects and textareas look identical. */
export function inputClasses(hasError, extra) {
  return cn(
    "h-11 w-full rounded-[var(--radius-md)] border bg-surface px-3.5 text-[15px] text-ink",
    "transition-colors duration-150 placeholder:text-ink-tertiary",
    "hover:border-line-strong",
    "focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
    hasError ? "border-danger" : "border-line",
    extra
  );
}

export function textareaClasses(hasError, extra) {
  return inputClasses(hasError, cn("h-auto resize-none py-2.5 leading-6", extra));
}
