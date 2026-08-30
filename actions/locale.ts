"use server";

import { cookies } from "next/headers";

import { isLocale } from "@/i18n/config";

/**
 * Persist the visitor's language choice in the NEXT_LOCALE cookie. The client
 * calls this then refreshes the router so the whole tree re-renders (including
 * <html lang/dir>) in the new locale.
 */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
