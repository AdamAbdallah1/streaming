import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { getServiceBrand, SERVICE_BRANDS } from "../../lib/serviceBrand";
import { ROUTES } from "../../lib/config";
import { ServiceLogoMark } from "./ServiceLogo";

/**
 * Opening composition: a compact mosaic of the catalogue's genuine brand
 * marks. It doubles as fast navigation into each service, so it earns its
 * place instead of being decoration.
 *
 * Motion: staggered entrance, a restrained pointer-tracked highlight that
 * uses each service's own sampled colour, and a small lift per tile.
 */
export default function BrandMosaic({ services, className }) {
  const entries = useMemoEntries(services);

  if (entries.length === 0) return null;

  return (
    <div className={cn("stagger", className)}>
      <ul className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {entries.map((entry, index) => (
          <li key={entry.service.id} style={{ "--i": index }}>
            <BrandTile entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function useMemoEntries(services) {
  // Map real catalogue services to their brand assets, preserving the
  // catalogue order. Services without a legitimate asset are skipped —
  // never substituted.
  return services
    .map((service) => ({ service, brand: getServiceBrand(service) }))
    .filter((entry) => entry.brand)
    .slice(0, SERVICE_BRANDS.length);
}

function BrandTile({ entry }) {
  const { service, brand } = entry;
  const ref = useRef(null);
  const frame = useRef(0);

  // Pointer-tracked highlight, rAF-throttled and only ever writing two
  // custom properties, so it costs nothing on low-end devices.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onMove = (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(hover: none)").matches) return;
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
  }, []);

  return (
    <Link
      ref={ref}
      to={ROUTES.product(service.slug)}
      style={{ "--plate-color": brand.wash }}
      className={cn(
        "group relative flex h-14 items-center justify-center overflow-hidden",
        "rounded-[var(--radius-md)] border border-line bg-surface",
        "lift hover:border-line-strong hover:shadow-raised"
      )}
      aria-label={`${service.name} — view plans`}
    >
      {/* Brand wash, derived from the service's own logo */}
      <span
        aria-hidden="true"
        className="plate-tint absolute inset-0"
        style={{ backgroundColor: `color-mix(in srgb, ${brand.wash} 7%, #ffffff)` }}
      />
      {/* Pointer-tracked glow */}
      <span aria-hidden="true" className="pointer-glow absolute inset-0" />
      {/* The genuine mark */}
      <span className="logo-respond relative flex max-w-[78%] items-center justify-center">
        <ServiceLogoMark service={service} className="h-6" />
      </span>
    </Link>
  );
}
