"use server";

import { revalidatePath } from "next/cache";
import type { ReservationStatus } from "@prisma/client";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { logActivity } from "@/services/activity";
import * as reservations from "@/services/reservations";
import { reservationSchema, type ReservationInput } from "@/validators/reservation";

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
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "UNAUTHENTICATED":
      return "Your session has expired — please sign in again.";
    case "VEHICLE_NOT_FOUND":
      return "That vehicle no longer exists.";
    case "VEHICLE_NO_PRICING":
      return "Set a daily price for this vehicle before booking it.";
    case "CUSTOMER_NOT_FOUND":
      return "That customer no longer exists.";
    case "DATE_CONFLICT":
      return "Those dates overlap an existing booking or block for this vehicle.";
    case "RESERVATION_NOT_FOUND":
      return "That reservation no longer exists.";
    case "INVALID_TRANSITION":
      return "That status change isn't allowed from the current status.";
    case "COUPON_INVALID":
      return "That coupon code isn't valid.";
    case "COUPON_EXPIRED":
      return "That coupon has expired.";
    case "COUPON_NOT_STARTED":
      return "That coupon isn't active yet.";
    case "COUPON_MAX_USES":
      return "That coupon has reached its usage limit.";
    case "COUPON_MIN_DAYS":
      return "This booking is too short for that coupon.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Passes when the signed-in user holds any of the given permission keys. */
async function requireAnyPermission(...keys: string[]) {
  const user = await requireUser();
  const checks = await Promise.all(keys.map((k) => userHasPermission(k)));
  if (!checks.some(Boolean)) throw new Error("FORBIDDEN");
  return user;
}

function revalidateReservations() {
  revalidatePath("/dashboard/reservations");
  revalidatePath("/dashboard");
}

export async function createReservationAction(input: ReservationInput): Promise<ActionResult> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireAnyPermission("reservations.manage");
    const reservation = await reservations.createReservation(user.agencyId, user.id, parsed.data);
    await logActivity(
      user.agencyId,
      user.id,
      "reservation.created",
      "Reservation",
      reservation.id,
      reservation.reservationNumber,
    );
    revalidateReservations();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to create reservations." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

const CANCEL_STATES = new Set(["CANCELLED", "NO_SHOW"]);

export async function updateReservationStatusAction(
  id: string,
  next: string,
  note?: string,
): Promise<ActionResult> {
  try {
    // Cancelling/no-show is part of "manage"; confirming and advancing status
    // is the "approve" permission (see lib/permissions.ts).
    const user = CANCEL_STATES.has(next)
      ? await requireAnyPermission("reservations.manage", "reservations.approve")
      : await requireAnyPermission("reservations.approve");

    await reservations.updateReservationStatus(
      user.agencyId,
      user.id,
      id,
      next as ReservationStatus,
      note,
    );
    await logActivity(user.agencyId, user.id, "reservation.status", "Reservation", id, next);
    revalidateReservations();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to change reservation status." };
    }
    return { ok: false, error: messageFor(err) };
  }
}
