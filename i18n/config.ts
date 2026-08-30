/**
 * Supported locales for the public site + dashboard.
 *
 * We use next-intl WITHOUT locale path segments — the active locale is stored
 * in a cookie (NEXT_LOCALE) instead of the URL. That keeps the existing routes
 * and the multi-tenant subdomain routing untouched, while still giving us full
 * FR / AR / EN translation and RTL support.
 */
export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

/** Short label shown in the compact switcher. */
export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  ar: "ع",
  en: "EN",
};

export const rtlLocales: readonly Locale[] = ["ar"];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
