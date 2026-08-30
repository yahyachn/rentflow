import { z } from "zod";

export const COUPON_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed amount" },
] as const;

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(1).optional(),
);
const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

export const couponSchema = z
  .object({
    code: z
      .string()
      .min(2, "Required")
      .max(30)
      .transform((s) => s.trim().toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce.number().positive("Must be greater than 0"),
    maxUses: optionalInt,
    minRentalDays: optionalInt,
    startsAt: optionalDate,
    expiresAt: optionalDate,
    isActive: z.boolean(),
  })
  .refine((d) => d.type !== "PERCENTAGE" || d.value <= 100, {
    message: "A percentage can't exceed 100",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponSchema>;
