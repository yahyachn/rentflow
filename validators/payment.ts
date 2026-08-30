import { z } from "zod";

/**
 * Manual payment recording — logging money the agency received in person
 * (cash, card terminal, bank transfer). Online gateways (Stripe/PayPal/CMI)
 * are a separate integration and are not part of this schema.
 */
export const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card (terminal)" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const paymentSchema = z.object({
  reservationId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER"]),
  transactionRef: optionalText(60),
  notes: optionalText(500),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
