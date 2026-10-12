import { useState } from "react";
import { cn } from "../../lib/cn";
import { brandWash, getServiceBrand } from "../../lib/serviceBrand";

/** Monogram used whenever no legitimate brand asset exists. */
function Monogram({ name, className }) {
  const letter = String(name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid place-items-center border border-line bg-surface font-semibold text-ink",
        className
      )}
    >
      <span className="text-[0.42em] leading-none">{letter}</span>
    </div>
  );
}

/** Tracks whether a service's brand asset is present and loads correctly. */
function useLogoState(service) {
  const [failed, setFailed] = useState(false);
  const brand = getServiceBrand(service);
  const missing = !brand || failed;
  return { brand, failed: missing, onError: () => setFailed(true) };
}

/**
 * The brand mark on its own, sized by the parent. Use inside a plate.
 *
 * Sizing uses a definite height (never max-height alone) so SVGs without
 * intrinsic width/height still resolve a width from their aspect ratio
 * instead of collapsing to zero.
 */
export function ServiceLogoMark({ service, className }) {
  const { brand, failed, onError } = useLogoState(service);

  if (failed) {
    return <Monogram name={service?.name} className={cn("size-full", className)} />;
  }

  return (
    <img
      src={brand.logo}
      alt={`${brand.label} logo`}
      loading="lazy"
      decoding="async"
      onError={onError}
      className={cn("h-6 w-auto max-w-full object-contain", className)}
    />
  );
}

/**
 * Square identity plate with the mark inside. Used in dense lists.
 */
export default function ServiceLogo({
  service,
  size = "md",
  className,
  plate = true,
}) {
  const { brand, failed } = useLogoState(service);

  const box = {
    xs: "size-8 rounded-[var(--radius-sm)] p-1",
    sm: "size-10 rounded-[var(--radius-md)] p-1.5",
    md: "size-12 rounded-[var(--radius-lg)] p-2",
    lg: "size-16 rounded-[var(--radius-xl)] p-2.5",
  }[size];

  const mark = {
    xs: "h-[18px]",
    sm: "h-[22px]",
    md: "h-7",
    lg: "h-9",
  }[size];

  if (failed) {
    return <Monogram name={service?.name} className={cn(box, "shrink-0", className)} />;
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center border border-line",
        box,
        className
      )}
      style={plate ? { backgroundColor: brandWash(brand) } : undefined}
    >
      <ServiceLogoMark service={service} className={mark} />
    </div>
  );
}

/**
 * Large plate used as the product-page hero.
 */
export function ServiceLogoHero({ service, className }) {
  const { brand, failed } = useLogoState(service);

  if (failed) {
    return (
      <Monogram
        name={service?.name}
        className={cn(
          "size-24 shrink-0 rounded-[var(--radius-xl)] text-[30px]",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-24 shrink-0 place-items-center rounded-[var(--radius-xl)] border border-line p-4",
        className
      )}
      style={{ backgroundColor: brandWash(brand) }}
    >
      <ServiceLogoMark service={service} className="h-full" />
    </div>
  );
}
