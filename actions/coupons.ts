"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser, userHasPermission } from "@/lib/tenant";
import * as coupons from "@/services/coupons";
import { couponSchema, type CouponInput } from "@/validators/coupon";

export type ActionResult =
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

function messageFor(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return "A coupon with that code already exists.";
  }
  const code = err instanceof Error ? err.message : "";
  if (code === "COUPON_NOT_FOUND") return "That coupon no longer exists.";
  return "Something went wrong. Please try again.";
}

async function requireManage() {
  const user = await requireUser();
  if (!(await userHasPermission("reservations.manage"))) throw new Error("FORBIDDEN");
  return user;
}

function forbiddenOr(err: unknown): ActionResult {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return { ok: false, error: "You don't have permission to manage coupons." };
  }
  return { ok: false, error: messageFor(err) };
}

export async function createCouponAction(input: CouponInput): Promise<ActionResult> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const user = await requireManage();
    await coupons.createCoupon(user.agencyId, parsed.data);
    revalidatePath("/dashboard/reservations");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function updateCouponAction(id: string, input: CouponInput): Promise<ActionResult> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const user = await requireManage();
    await coupons.updateCoupon(user.agencyId, id, parsed.data);
    revalidatePath("/dashboard/reservations");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireManage();
    await coupons.deleteCoupon(user.agencyId, id);
    revalidatePath("/dashboard/reservations");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}
