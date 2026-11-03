import { getServiceBrand } from "../../lib/serviceBrand";
import { cn } from "../../lib/cn";
import ServiceLogoMark from "./ServiceLogo";

/**
 * High-impact floating service-logo composition for the hero.
 * Features individual rotations, custom brand color washes, depth layering,
 * and smooth floating animations.
 */
const LAYOUT = [
  // Desktop rich composition: [top%, left%, size, rotation, delay, duration]
  { t: 8,  l: 52, size: "md", rot: -14, d: 0,   dur: 6.0 },
  { t: 14, l: 70, size: "lg", rot: 10,  d: 0.3, dur: 7.2 },
  { t: 26, l: 86, size: "sm", rot: 16,  d: 0.7, dur: 5.5 },
  { t: 54, l: 56, size: "lg", rot: -8,  d: 1.1, dur: 7.8 },
  { t: 66, l: 74, size: "md", rot: 14,  d: 0.5, dur: 6.4 },
  { t: 78, l: 90, size: "sm", rot: -18, d: 1.5, dur: 5.2 },
  { t: 34, l: 92, size: "md", rot: 7,   d: 1.9, dur: 6.8 },
  { t: 48, l: 84, size: "sm", rot: -11, d: 1.3, dur: 5.0 },
  { t: 38, l: 62, size: "sm", rot: 20,  d: 0.2, dur: 7.0 },
  { t: 44, l: 72, size: "md", rot: -16, d: 0.9, dur: 6.2 },
];

// Mobile streamlined composition (right side, compact, non-obstructive)
const MOBILE_LAYOUT = [
  { t: 10, l: 65, size: "sm", rot: -10, d: 0,   dur: 5.8 },
  { t: 28, l: 80, size: "sm", rot: 12,  d: 0.4, dur: 5.4 },
  { t: 62, l: 70, size: "sm", rot: -8,  d: 0.8, dur: 6.0 },
  { t: 82, l: 85, size: "sm", rot: 15,  d: 0.2, dur: 5.2 },
];

const SIZE_CLASSES = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

const MARK_CLASSES = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9",
};

// Target brand identifiers across your catalog
const TARGET_BRANDS = [
  "netflix", "chatgpt", "disney", "amazon", "spotify", "anghami", 
  "canva", "capcut", "gemini", "youtube", "duolingo", "autodesk", 
  "shahid", "osn", "surfshark", "udemy"
];

export default function FloatingLogos({ services, className }) {
  const allBrands = services
    .map((service) => ({ service, brand: getServiceBrand(service) }))
    .filter((entry) => entry.brand);

  if (allBrands.length === 0) return null;

  // Prioritize requested subscription brands
  const prioritized = allBrands.filter(entry => {
    const name = (entry.service.name || "").toLowerCase();
    return TARGET_BRANDS.some(b => name.includes(b));
  });

  const brands = prioritized.length >= 4 ? prioritized : allBrands;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden select-none", className)}
    >
      {/* Desktop Composition */}
      <div className="hidden sm:block">
        {LAYOUT.map((pos, index) => {
          const entry = brands[index % brands.length];
          return (
            <FloatingTile
              key={`desktop-logo-${index}`}
              entry={entry}
              pos={pos}
              mobile={false}
            />
          );
        })}
      </div>

      {/* Mobile Composition */}
      <div className="sm:hidden">
        {MOBILE_LAYOUT.map((pos, index) => {
          const entry = brands[index % brands.length];
          return (
            <FloatingTile
              key={`mobile-logo-${index}`}
              entry={entry}
              pos={pos}
              mobile={true}
            />
          );
        })}
      </div>
    </div>
  );
}

function FloatingTile({ entry, pos, mobile }) {
  const { service, brand } = entry;
  const size = mobile ? "sm" : pos.size;

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center rounded-[20px] border border-white/40 shadow-lg backdrop-blur-md",
        "transition-transform duration-500 ease-out hover:scale-105",
        SIZE_CLASSES[size]
      )}
      style={{
        top: `${pos.t}%`,
        left: `${pos.l}%`,
        transform: `rotate(${pos.rot}deg)`,
        animation: `floatAnimation ${pos.dur}s ease-in-out infinite`,
        animationDelay: `${pos.d}s`,
        backgroundColor: brand?.wash 
          ? `color-mix(in srgb, ${brand.wash} 22%, rgba(255,255,255,0.85))` 
          : "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
      }}
    >
      <div className="flex items-center justify-center p-2">
        <ServiceLogoMark service={service} className={cn("object-contain drop-shadow-sm", MARK_CLASSES[size])} />
      </div>
    </div>
  );
}