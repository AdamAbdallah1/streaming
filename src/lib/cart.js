import { useSyncExternalStore } from "react";
import { findPlan } from "./catalog";
import { STORAGE_KEYS } from "./config";

/**
 * Cart lines only store *references* plus quantity. Prices and stock are
 * resolved from the live Firestore catalog at render time, so an edit in
 * the admin panel can never leave a stale total on screen.
 */
const MAX_QUANTITY = 20;

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line) =>
          line &&
          typeof line.serviceId === "string" &&
          typeof line.planKey === "string"
      )
      .map((line) => ({
        serviceId: line.serviceId,
        planKey: line.planKey,
        quantity: clampQuantity(line.quantity),
      }));
  } catch {
    return [];
  }
}

function clampQuantity(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, n));
}

let cart = readStoredCart();
const listeners = new Set();

function commit(next) {
  cart = next;
  try {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  } catch {
    /* storage unavailable — cart still works for this session */
  }
  listeners.forEach((listener) => listener());
}

export const cartStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return cart;
  },
  add(service, plan, quantity = 1) {
    const existing = cart.find(
      (line) => line.serviceId === service.id && line.planKey === plan.key
    );
    if (existing) {
      commit(
        cart.map((line) =>
          line === existing
            ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
            : line
        )
      );
      return existing.quantity + quantity;
    }
    commit([
      ...cart,
      { serviceId: service.id, planKey: plan.key, quantity: clampQuantity(quantity) },
    ]);
    return clampQuantity(quantity);
  },
  setQuantity(serviceId, planKey, quantity) {
    const next = clampQuantity(quantity);
    commit(
      cart.map((line) =>
        line.serviceId === serviceId && line.planKey === planKey
          ? { ...line, quantity: next }
          : line
      )
    );
  },
  remove(serviceId, planKey) {
    commit(
      cart.filter(
        (line) => !(line.serviceId === serviceId && line.planKey === planKey)
      )
    );
  },
  clear() {
    commit([]);
  },
};

export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, () => []);
}

export const MAX_CART_QUANTITY = MAX_QUANTITY;

/**
 * A resolved cart line, ready for display. Produced by `resolveCart`:
 *   { serviceId, serviceName, serviceCategory, planKey, label, type,
 *     duration, unitPrice, wasPrice, quantity, lineTotal, inStock,
 *     unavailable }
 */

/**
 * Turn stored references into displayable, priced line items.
 * Unavailable lines are kept (flagged) so the customer can see and remove
 * them instead of silently losing what they chose.
 *
 * While the catalogue is still loading we deliberately return no lines at
 * all — resolving them against an empty catalogue would wrongly mark every
 * item as "no longer available".
 */
export function resolveCart(items, services, { loading = false } = {}) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return {
      lines: [],
      purchasableLines: [],
      count,
      subtotal: 0,
      hasUnavailable: false,
      loading: true,
    };
  }

  const byId = new Map(services.map((service) => [service.id, service]));

  const lines = [];
  for (const item of items) {
    const service = byId.get(item.serviceId);
    const plan = service ? findPlan(service, item.planKey) : null;

    lines.push({
      serviceId: item.serviceId,
      serviceName: service?.name ?? "Unavailable item",
      serviceCategory: service?.category ?? "",
      planKey: item.planKey,
      label: plan?.label ?? "Plan no longer available",
      type: plan?.type ?? "",
      duration: plan?.duration ?? "",
      unitPrice: plan?.price ?? 0,
      wasPrice: plan?.wasPrice ?? null,
      quantity: item.quantity,
      lineTotal: (plan?.price ?? 0) * item.quantity,
      inStock: plan ? plan.inStock : false,
      unavailable: !service || !plan,
    });
  }

  const available = lines.filter((line) => line.inStock);
  return {
    lines,
    purchasableLines: available,
    count,
    subtotal: available.reduce((sum, line) => sum + line.lineTotal, 0),
    hasUnavailable: lines.some((line) => line.unavailable || !line.inStock),
    loading: false,
  };
}

export function cartCount(items, services) {
  return resolveCart(items, services).count;
}
