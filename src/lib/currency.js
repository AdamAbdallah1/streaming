import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "./config";

const SUPPORTED = ["USD", "LBP"];

function readStored() {
  const stored = localStorage.getItem(STORAGE_KEYS.currency);
  return SUPPORTED.includes(stored) ? stored : "USD";
}

let current = readStored();
const listeners = new Set();

function setCurrency(code) {
  if (!SUPPORTED.includes(code)) return;
  current = code;
  localStorage.setItem(STORAGE_KEYS.currency, code);
  listeners.forEach((listener) => listener());
}

export const currencyStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
};

export function useCurrency() {
  const currency = useSyncExternalStore(
    currencyStore.subscribe,
    currencyStore.getSnapshot,
    () => "USD"
  );
  return { currency, setCurrency };
}
