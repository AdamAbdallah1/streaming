import { BUSINESS, ORDER } from "./config";
import { formatMoney } from "./format";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/**
 * Human-readable invoice reference, e.g. CT-261011-7KQ4.
 * Readable out loud on a WhatsApp call and unique enough for a small
 * single-store catalogue.
 */
export function createReference(date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${ORDER.prefix}-${yy}${mm}${dd}-${randomBlock(4)}`;
}

/** WhatsApp accepts digits only. */
export function whatsappLink(message) {
  const number = BUSINESS.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Group the transfer number so it can be read aloud accurately. */
export function formatWhishNumber(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 8) return String(value);
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function buildOrderSummary(order) {
  const currency = order.currency || "USD";
  const lines = (order.lines || []).map(
    (line, index) =>
      `${index + 1}. ${line.serviceName} — ${line.label}` +
      `${line.type ? ` (${line.type})` : ""}` +
      `${line.duration ? ` · ${line.duration}` : ""}\n` +
      `   ${line.quantity} × ${formatMoney(line.unitPrice, currency)} = ${formatMoney(
        line.lineTotal,
        currency
      )}`
  );

  const total = formatMoney(order.total, currency);
  const method = order.payment?.method || BUSINESS.whish.label;
  const number = order.payment?.number || BUSINESS.whish.number;

  return [
    `*${BUSINESS.name} — New order*`,
    "",
    `Invoice: ${order.reference}`,
    `Date: ${order.placedAtLabel || ""}`.trim(),
    "",
    "*Items*",
    ...(lines.length ? lines : ["No items recorded"]),
    "",
    `Subtotal: ${formatMoney(order.subtotal, currency)}`,
    `*Total: ${total}*`,
    "",
    "*Payment method*",
    `${method} — ${number}`,
    `Adding "${order.reference}" as the transfer note.`,
    "",
    "*Customer*",
    `Name: ${order.customer?.name || ""}`,
    `WhatsApp: ${order.customer?.phone || ""}`,
    order.customer?.notes ? `Notes: ${order.customer.notes}` : null,
    "",
    "Thank you!",
  ]
    .filter((part) => part !== null && part !== "")
    .join("\n");
}
