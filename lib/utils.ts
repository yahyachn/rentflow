import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely, resolving conflicting utility classes
 * (e.g. "p-2 p-4" -> "p-4"). Used by every component in components/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency. Defaults to Moroccan Dirham since RentFlow's
 * flagship market is Morocco (rentflow.ma), but the currency is configurable
 * per agency via Settings in a later phase. */
export function formatCurrency(
  amount: number,
  currency: string = "MAD",
  locale: string = "en-US",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Locale-pinned number formatting (thousands separators, e.g. mileage) —
 * `.toLocaleString()` without an explicit locale uses the runtime's default,
 * which differs between server (Node) and browser and causes a hydration
 * mismatch for anything rendered as (or inside) a Client Component. */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(d);
}

/** Build a `wa.me` deep link from an agency's configured WhatsApp number
 * (any format — spaces/dashes/parens are stripped), or `null` if unset. */
export function whatsappLink(number: string | null | undefined, message?: string) {
  const digits = number?.replace(/[^\d]/g, "");
  if (!digits) return null;
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
