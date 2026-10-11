import { LBP_RATE } from "./config";

/** Round to 2 decimal places without float surprises. */
export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Coerce Firestore strings/numbers to a finite number. */
export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatUsd(amount) {
  return `$${round2(amount).toFixed(2)}`;
}

export function formatLbp(amount) {
  return `${Math.round(amount).toLocaleString("en-US")} L.L.`;
}

export function formatMoney(amountUsd, currency = "USD") {
  return currency === "LBP"
    ? formatLbp(amountUsd * LBP_RATE)
    : formatUsd(amountUsd);
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDate(date) {
  return DATE_FORMAT.format(date);
}

export function formatDateTime(date) {
  return `${DATE_FORMAT.format(date)} · ${TIME_FORMAT.format(date)}`;
}

/** "1 month" -> "1 month", null -> "" */
export function label(value) {
  return typeof value === "string" ? value.trim() : "";
}
