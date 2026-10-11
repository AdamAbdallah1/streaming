import { db } from "../../firebase.js";
import { collection, onSnapshot } from "firebase/firestore";
import { label as clean, round2, toNumber } from "./format";

/**
 * Pricing intentionally preserves the arithmetic already used by the
 * storefront: final price = sellPrice - discount, treating missing or
 * non-numeric values as 0.
 */
export function planDiscount(plan) {
  return Math.max(0, toNumber(plan?.discount));
}

export function planPrice(plan) {
  return round2(Math.max(0, toNumber(plan?.sellPrice) - planDiscount(plan)));
}

/** Original price to strike through, or null when there is no discount. */
export function planWasPrice(plan) {
  const sell = toNumber(plan?.sellPrice);
  return planDiscount(plan) > 0 && sell > 0 ? round2(sell) : null;
}

export function planSaving(plan) {
  return round2(Math.max(0, planDiscount(plan)));
}

/** Missing `inStock` means "in stock" (matches previous behaviour). */
export function planInStock(plan) {
  return plan?.inStock !== false;
}

export function planKey(service, index, plan) {
  const parts = [clean(plan?.label), clean(plan?.type)]
    .filter(Boolean)
    .map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return `${service.id}:${parts.join("--") || `plan-${index}`}`;
}

export function planTypes(service) {
  const types = (service.plans || [])
    .map((plan) => clean(plan.type))
    .filter(Boolean);
  return [...new Set(types)];
}

export function serviceMinPrice(service) {
  const prices = (service.plans || [])
    .filter(planInStock)
    .map(planPrice)
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function serviceStockCount(service) {
  return (service.plans || []).filter(planInStock).length;
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeService(id, data) {
  const plans = Array.isArray(data.plans) ? data.plans : [];
  return {
    id,
    name: String(data.name || "Untitled"),
    slug: slugify(data.name || id),
    category: String(data.category || "Other").trim() || "Other",
    note: String(data.serviceNote || "").trim(),
    icon: String(data.icon || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    plans: plans.map((plan, index) => ({
      ...plan,
      index,
      key: planKey({ id }, index, plan),
      label: clean(plan.label) || "Plan",
      type: clean(plan.type),
      duration: clean(plan.duration),
      price: planPrice(plan),
      wasPrice: planWasPrice(plan),
      saving: planSaving(plan),
      inStock: planInStock(plan),
    })),
  };
}

/** Subscribe to the live catalog and receive normalized services. */
export function subscribeServices(onData, onError) {
  return onSnapshot(
    collection(db, "services"),
    (snapshot) => {
      const services = snapshot.docs.map((doc) =>
        normalizeService(doc.id, doc.data())
      );
      services.sort((a, b) => a.name.localeCompare(b.name));
      onData(services);
    },
    (error) => onError?.(error)
  );
}

/* ------------------------------------------------------------------ *
 * One live catalog subscription, shared by the whole storefront.
 * ------------------------------------------------------------------ */

let catalogState = { services: [], loading: true, error: null };
const catalogListeners = new Set();
let started = false;

function setCatalogState(next) {
  catalogState = next;
  catalogListeners.forEach((listener) => listener());
}

function startCatalog() {
  if (started) return;
  started = true;
  subscribeServices(
    (services) => setCatalogState({ services, loading: false, error: null }),
    (error) =>
      setCatalogState({ services: catalogState.services, loading: false, error })
  );
}

export const catalogStore = {
  subscribe(listener) {
    startCatalog();
    catalogListeners.add(listener);
    return () => catalogListeners.delete(listener);
  },
  getSnapshot() {
    return catalogState;
  },
};

export function findService(services, identifier) {
  if (!identifier) return null;
  return (
    services.find((service) => service.id === identifier) ||
    services.find((service) => service.slug === slugify(identifier)) ||
    null
  );
}

export function findPlan(service, identifier) {
  if (!service || !identifier) return null;
  return (
    service.plans.find((plan) => plan.key === identifier) ||
    service.plans.find((plan) => plan.index === Number(identifier)) ||
    null
  );
}
