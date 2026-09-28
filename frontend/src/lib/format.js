import { UNIT_LABEL } from "../config.js";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN");

const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
// Whole rupees print without ".00"; paise still show when present (₹24.50).
export const money = (n) => {
  if (n === undefined || n === null || n === "" || isNaN(n)) return "—";
  const v = Number(n);
  return (Number.isInteger(v) ? inrWhole : inr).format(v);
};
export const count = (n) => num.format(Number(n) || 0);
export const unit = (u) => UNIT_LABEL[u] || (u || "").toLowerCase();
export const perUnit = (price, u) => `${money(price)} / ${unit(u)}`;

export const date = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
export const time = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
export const ago = (d) => {
  if (!d) return "";
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return date(d);
};

export const shortId = (id = "") => `#${String(id).slice(-6).toUpperCase()}`;
export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";