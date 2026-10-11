import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/config";
import { formatMoney } from "../../lib/format";
import { serviceMinPrice, serviceStockCount } from "../../lib/catalog";
import { getServiceBrand } from "../../lib/serviceBrand";
import { cn } from "../../lib/cn";
import { ServiceLogoMark } from "./ServiceLogo";

/** True when the OS asks for reduced motion. */
function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ProductCard({ service, currency, index = 0 }) {
  const minPrice = serviceMinPrice(service);
  const stockCount = serviceStockCount(service);
  const planCount = service.plans.length;
  const inStock = stockCount > 0;
  const brand = getServiceBrand(service);
  const plateColor = brand?.wash;

  const ref = useRef(null);
  const frame = useRef(0);

  // Pointer-tracked highlight on the identity plate only. Throttled to one
  // rAF, writing two custom properties, and skipped for touch input.
  useEffect(() => {
    const node = ref.current;
    if (!node || !plateColor) return;

    const onMove = (event) => {
      if (prefersReducedMotion()) return;
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        node.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame.current);
      node.style.removeProperty("--mx");
      node.style.removeProperty("--my");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame.current);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [plateColor]);

  return (
    <Link
      to={ROUTES.product(service.slug)}
      style={{ "--plate-color": plateColor, "--i": index }}
      className={cn(
        "group flex overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface",
        "lift hover:border-line-strong hover:shadow-raised",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
        // Horizontal row on phones, stacked card from small screens up.
        "flex-row sm:flex-col",
        !inStock && "opacity-75"
      )}
    >
      {/* Identity plate — the service's own brand mark */}
      <div
        ref={ref}
        className={cn(
          "plate-tint relative flex shrink-0 items-center justify-center overflow-hidden",
          "h-[92px] w-[92px] border-b-0 border-r border-hairline px-3",
          "sm:h-[112px] sm:w-full sm:border-b sm:border-r-0 sm:px-8",
          !inStock && "saturate-[0.35]"
        )}
        style={
          plateColor
            ? { backgroundColor: `color-mix(in srgb, ${plateColor} 7%, #ffffff)` }
            : undefined
        }
      >
        {/* Pointer-tracked highlight sits above the wash, below the mark. */}
        <span aria-hidden="true" className="pointer-glow absolute inset-0" />

        <span className="logo-respond relative flex items-center justify-center">
          <ServiceLogoMark service={service} className="h-9 sm:h-11" />
        </span>

        {!inStock && (
          <span className="absolute left-2 top-2 rounded-[var(--radius-pill)] border border-line bg-surface/95 px-1.5 py-0.5 text-[10px] font-medium text-ink-tertiary sm:left-3 sm:top-3 sm:text-[11px]">
            Out of stock
          </span>
        )}
      </div>

      {/* Facts */}
      <div className="flex min-w-0 flex-1 flex-col justify-center p-3.5 sm:p-4">
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink">
          {service.name}
        </h3>

        <p className="mt-1 text-[12px] text-ink-tertiary tnum">
          {planCount} {planCount === 1 ? "option" : "options"}
          {inStock && stockCount < planCount && ` · ${stockCount} available`}
        </p>

        <div className="mt-2.5 flex items-baseline gap-1.5 sm:mt-4">
          {inStock ? (
            <>
              <span className="text-[12px] text-ink-tertiary">from</span>
              <span className="display-price text-[19px] text-ink sm:text-[20px]">
                {formatMoney(minPrice, currency)}
              </span>
            </>
          ) : (
            <span className="text-[13px] font-medium text-ink-tertiary">
              Not currently available
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
