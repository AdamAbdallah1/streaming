import Netflix from "../assets/logos/netflix.svg";
import DisneyPlus from "../assets/logos/disney-plus.svg";
import AmazonPrime from "../assets/logos/amazon-prime.svg";
import OsnPlus from "../assets/logos/osn-plus.svg";
import Shahid from "../assets/logos/shahid.svg";
import Anghami from "../assets/logos/anghami.png";

/**
 * Service identity for the streaming catalogue.
 *
 * Logos are genuine brand marks sourced from Wikimedia Commons (see
 * `src/assets/logos/CREDITS.json` for the file, author and licence of each).
 * `wash` and `accent` are sampled directly from the logo's own pixels, so a
 * service's identity colour always matches the artwork we are allowed to show.
 *
 * Only services that exist in the real catalogue are mapped. Anything without
 * a legitimate asset falls back to a typographic mark — never to a substitute
 * or invented logo.
 */
export const SERVICE_BRANDS = [
  {
    slug: "netflix",
    label: "Netflix",
    tokens: ["netflix"],
    logo: Netflix,
    wash: "#A72931",
    accent: "#66161B",
  },
  {
    slug: "disney-plus",
    label: "Disney+",
    tokens: ["disney"],
    logo: DisneyPlus,
    wash: "#031697",
    accent: "#161B66",
  },
  {
    slug: "amazon-prime",
    label: "Amazon Prime Video",
    tokens: ["amazon", "prime"],
    logo: AmazonPrime,
    wash: "#139AFF",
    accent: "#164466",
  },
  {
    slug: "osn-plus",
    label: "OSN+",
    tokens: ["osn"],
    logo: OsnPlus,
    wash: "#FFC0F4",
    accent: "#661658",
  },
  {
    slug: "shahid",
    label: "Shahid",
    tokens: ["shahid"],
    logo: Shahid,
    wash: "#1E3C44",
    accent: "#164666",
  },
  {
    slug: "anghami",
    label: "Anghami",
    tokens: ["anghami"],
    logo: Anghami,
    wash: "#67855F",
    accent: "#5F6616",
  },
];

/** Find the brand identity for a catalogue service, or null. */
export function getServiceBrand(service) {
  if (!service) return null;
  const name = String(service.name || "").toLowerCase();
  const slug = String(service.slug || "").toLowerCase();

  return (
    SERVICE_BRANDS.find(
      (brand) =>
        brand.tokens.some((token) => name.includes(token)) ||
        brand.slug === slug
    ) ?? null
  );
}

/**
 * A very light brand wash for identity plates. Derived from the logo pixels
 * and mixed into white so it never competes with the mark itself.
 */
export function brandWash(brand) {
  return brand ? `color-mix(in srgb, ${brand.wash} 7%, #ffffff)` : null;
}
