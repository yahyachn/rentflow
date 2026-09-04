import { z } from "zod";

const optional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const CURRENCY_OPTIONS = ["MAD", "EUR", "USD", "GBP"] as const;

/** International format: a leading "+", country code, then digits (spaces/
 * dashes allowed for readability, e.g. "+212 6 12 34 56 78"). This is what
 * every WhatsApp deep link on the site is built from — see
 * lib/utils.ts#whatsappLink — so an invalid number here would silently break
 * every "WhatsApp us" button on the public site. */
const whatsappNumber = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .regex(/^\+[1-9]\d{0,3}[\d\s-]{6,14}$/, "Use international format, e.g. +212 6 12 34 56 78")
    .optional(),
);

export const agencyProfileSchema = z.object({
  name: z.string().min(2, "Required").max(80),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email("Enter a valid email").optional(),
  ),
  phone: optional(40),
  whatsapp: whatsappNumber,
  address: optional(160),
  city: optional(80),
  country: z.string().min(1, "Required").max(80),
  currency: z.enum(CURRENCY_OPTIONS),
  timezone: z.string().min(1, "Required").max(60),
});

export type AgencyProfileInput = z.infer<typeof agencyProfileSchema>;
