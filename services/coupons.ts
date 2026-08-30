import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CouponInput } from "@/validators/coupon";

/**
 * Discount coupons. Management CRUD plus `validateCoupon`, used by
 * createReservation to price a booking.
 *
 * Known error strings: COUPON_NOT_FOUND, COUPON_INVALID, COUPON_EXPIRED,
 * COUPON_NOT_STARTED, COUPON_MAX_USES, COUPON_MIN_DAYS.
 */

type Tx = PrismaClient | Prisma.TransactionClient;

export function listCoupons(agencyId: string) {
  return prisma.coupon.findMany({ where: { agencyId }, orderBy: { createdAt: "desc" } });
}

function toDate(v: string | undefined) {
  return v ? new Date(v) : null;
}

function couponData(input: CouponInput) {
  return {
    code: input.code,
    type: input.type,
    value: input.value,
    maxUses: input.maxUses ?? null,
    minRentalDays: input.minRentalDays ?? null,
    startsAt: toDate(input.startsAt),
    expiresAt: toDate(input.expiresAt),
    isActive: input.isActive,
  };
}

export function createCoupon(agencyId: string, input: CouponInput) {
  return prisma.coupon.create({ data: { agencyId, ...couponData(input) } });
}

export async function updateCoupon(agencyId: string, id: string, input: CouponInput) {
  const existing = await prisma.coupon.findFirst({ where: { id, agencyId }, select: { id: true } });
  if (!existing) throw new Error("COUPON_NOT_FOUND");
  return prisma.coupon.update({ where: { id }, data: couponData(input) });
}

export async function deleteCoupon(agencyId: string, id: string) {
  // Reservations keep their couponId (onDelete: SetNull), so history is safe.
  const res = await prisma.coupon.deleteMany({ where: { id, agencyId } });
  if (res.count === 0) throw new Error("COUPON_NOT_FOUND");
}

/**
 * Validate a code against the current booking and return the discount to apply.
 * Throws a known reason string on any failure.
 */
export async function validateCoupon(
  agencyId: string,
  code: string,
  ctx: { durationDays: number; subtotal: number },
): Promise<{ couponId: string; discountAmount: number }> {
  const coupon = await prisma.coupon.findFirst({
    where: { agencyId, code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.isActive) throw new Error("COUPON_INVALID");

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new Error("COUPON_NOT_STARTED");
  if (coupon.expiresAt && now > coupon.expiresAt) throw new Error("COUPON_EXPIRED");
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) throw new Error("COUPON_MAX_USES");
  if (coupon.minRentalDays != null && ctx.durationDays < coupon.minRentalDays)
    throw new Error("COUPON_MIN_DAYS");

  const raw =
    coupon.type === "PERCENTAGE"
      ? (ctx.subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);
  const discountAmount = Math.min(Math.round(raw * 100) / 100, ctx.subtotal);
  return { couponId: coupon.id, discountAmount };
}

/** Increment a coupon's usage (called inside the reservation transaction). */
export function incrementCouponUsage(tx: Tx, couponId: string) {
  return tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
}
