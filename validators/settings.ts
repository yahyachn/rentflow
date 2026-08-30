import { z } from "zod";

const optional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const CURRENCY_OPTIONS = ["MAD", "EUR", "USD", "GBP"] as const;

export const agencyProfileSchema = z.object({
  name: z.string().min(2, "Required").max(80),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email("Enter a valid email").optional(),
  ),
  phone: optional(40),
  whatsapp: optional(40),
  address: optional(160),
  city: optional(80),
  country: z.string().min(1, "Required").max(80),
  currency: z.enum(CURRENCY_OPTIONS),
  timezone: z.string().min(1, "Required").max(60),
});

export type AgencyProfileInput = z.infer<typeof agencyProfileSchema>;
