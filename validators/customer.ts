import { z } from "zod";

export const CUSTOMER_STATUS_OPTIONS = [
  { value: "REGULAR", label: "Regular" },
  { value: "VIP", label: "VIP" },
  { value: "BLACKLISTED", label: "Blacklisted" },
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email("Enter a valid email").optional(),
);

export const customerSchema = z.object({
  firstName: z.string().min(1, "Required").max(80),
  lastName: z.string().min(1, "Required").max(80),
  email: optionalEmail,
  phone: optionalText(40),
  whatsapp: optionalText(40),
  city: optionalText(80),
  country: optionalText(80),
  licenseNumber: optionalText(60),
  licenseCountry: optionalText(80),
  status: z.enum(["REGULAR", "VIP", "BLACKLISTED"]),
  notes: optionalText(2000),
});

export type CustomerInput = z.infer<typeof customerSchema>;
