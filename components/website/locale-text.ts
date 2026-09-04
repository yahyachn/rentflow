import type { Locale } from "@/i18n/config";
import type { LocalizedText, LocalizedRichText } from "@/validators/website-blocks";

/** Resolve a block's per-locale copy for the current locale, falling back to
 * French (the site's default locale) then English so a partially-translated
 * block never renders blank. */
export function pickText(text: LocalizedText | LocalizedRichText | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] || text.fr || text.en || text.ar || "";
}
