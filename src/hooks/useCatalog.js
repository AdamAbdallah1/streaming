import { useSyncExternalStore } from "react";
import { catalogStore } from "../lib/catalog";

/**
 * Live, normalized catalogue from Firestore. A single subscription is
 * shared by every storefront page.
 */
export function useCatalog() {
  return useSyncExternalStore(
    catalogStore.subscribe,
    catalogStore.getSnapshot,
    () => ({ services: [], loading: true, error: null })
  );
}
