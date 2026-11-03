import Netflix from "../assets/logos/netflix.svg";
import DisneyPlus from "../assets/logos/disney-plus.svg";
import AmazonPrime from "../assets/logos/amazon-prime.svg";
import OsnPlus from "../assets/logos/osn-plus.svg";
import Shahid from "../assets/logos/shahid.svg";
import Anghami from "../assets/logos/anghami.png";
import Autodesk from "../assets/logos/auto-desk.svg";
import Canva from "../assets/logos/canva-plus.svg";
import CapCut from "../assets/logos/capcut.png";
import ChatGPT from "../assets/logos/chatgpt-plus.svg";
import Duolingo from "../assets/logos/duolingo.svg";
import Gemini from "../assets/logos/google-gemini.svg";
import Surfshark from "../assets/logos/surf-shark.svg";
import Udemy from "../assets/logos/udemy.svg";
import YouTube from "../assets/logos/youtube-premium.svg";

/**
 * Service identity for the streaming catalogue.
 *
 * Logos are genuine brand marks (see `src/assets/logos/CREDITS.json` for the
 * file, author and licence of each). `wash` and `accent` are sampled directly
 * from the logo's own pixels where possible, so a service's identity colour
 * always matches the artwork we are allowed to show.
 *
 * Only services that exist in the real catalogue are mapped. Apple TV has no
 * legitimate bundled asset, so it is intentionally absent and falls back to a
 * typographic monogram — never to a substitute or invented logo.
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
  {
    slug: "autodesk",
    label: "Autodesk",
    tokens: ["autodesk"],
    logo: Autodesk,
    wash: "#000000",
    accent: "#662828",
  },
  {
    slug: "canva-plus",
    label: "Canva Pro",
    tokens: ["canva"],
    logo: Canva,
    wash: "#04BCCE",
    accent: "#0F6166",
  },
  {
    slug: "capcut",
    label: "CapCut Pro",
    tokens: ["capcut"],
    logo: CapCut,
    wash: "#000000",
    accent: "#662828",
  },
  {
    slug: "chatgpt-plus",
    label: "ChatGPT Plus",
    tokens: ["chatgpt", "openai"],
    logo: ChatGPT,
    wash: "#000000",
    accent: "#666666",
  },
  {
    slug: "duolingo",
    label: "Duolingo Super",
    tokens: ["duolingo"],
    logo: Duolingo,
    wash: "#58CC02",
    accent: "#34660F",
  },
  {
    slug: "google-gemini",
    label: "Google Gemini",
    tokens: ["gemini", "google"],
    logo: Gemini,
    wash: "#3186FF",
    accent: "#164466",
  },
  {
    slug: "surf-shark",
    label: "Surfshark",
    tokens: ["surfshark", "surf"],
    logo: Surfshark,
    wash: "#2A5F6E",
    accent: "#0F5966",
  },
  {
    slug: "udemy",
    label: "Udemy",
    tokens: ["udemy"],
    logo: Udemy,
    wash: "#0B0310",
    accent: "#451666",
  },
  {
    slug: "youtube-premium",
    label: "YouTube Premium",
    tokens: ["youtube"],
    logo: YouTube,
    wash: "#8E272A",
    accent: "#660F12",
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
