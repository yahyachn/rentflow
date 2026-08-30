"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { recordPayment } from "@/services/payments";
import { paymentSchema, type PaymentInput } from "@/validators/payment";

export type PaymentActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFrom(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

export async function recordPaymentAction(input: PaymentInput): Promise<PaymentActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireUser();
    if (!(await userHasPermission("billing.manage"))) {
      return { ok: false, error: "You don't have permission to record payments." };
    }
    await recordPayment(user.agencyId, parsed.data);
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "RESERVATION_NOT_FOUND") {
      return { ok: false, error: "That reservation no longer exists." };
    }
    return { ok: false, error: "Something went wrong recording the payment." };
  }
}
