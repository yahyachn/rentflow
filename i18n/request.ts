import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { defaultLocale, isLocale } from "./config";

/**
 * Resolves the active locale per request from the NEXT_LOCALE cookie and loads
 * the matching message bundle. Falls back to the default locale (FR) when the
 * cookie is missing or invalid.
 */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
