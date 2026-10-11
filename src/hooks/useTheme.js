import { useCallback, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "../lib/config";

function readStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  // Legacy format was JSON true/false where true meant dark.
  if (stored === "true" || stored === '"true"') return "dark";
  if (stored === "false" || stored === '"false"') return "light";
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

let current = readStoredTheme();
applyTheme(current);

const listeners = new Set();

function setTheme(theme) {
  current = theme;
  applyTheme(theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  listeners.forEach((listener) => listener());
}

export const themeStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current === "dark";
  },
};

export function useTheme() {
  const isDark = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    () => false
  );

  const toggle = useCallback(
    () => setTheme(current === "dark" ? "light" : "dark"),
    []
  );

  return { isDark, toggle, set: setTheme };
}
