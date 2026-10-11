import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { cn } from "../../lib/cn";

export default function CopyButton({ value, label = "Copy", className }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label}: ${value}`}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5",
        "text-[12px] font-medium transition-colors duration-150",
        copied
          ? "border-positive-line bg-positive-soft text-positive"
          : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink",
        className
      )}
    >
      {copied ? (
        <FiCheck key="tick" size={13} className="anim-tick" />
      ) : (
        <FiCopy key="copy" size={13} />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
