"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getMarketingAgency } from "@/lib/public-agency";
import { rateLimit } from "@/lib/rate-limit";
import { createReservation } from "@/services/reservations";
import { reservationSchema, type ReservationInput } from "@/validators/reservation";

/**
 * Public (unauthenticated) reservation request from the marketing site's
 * Reserve dialog. Unlike the dashboard action there is no session or
 * permission check — the request is scoped to the agency the marketing site
 * currently resolves to (lib/public-agency.ts), the source is forced to
 * WEBSITE, and it lands as a PENDING booking for the agency to confirm.
 *
 * It goes through the same createReservation path as the dashboard, so
 * server-side pricing and double-booking prevention apply here too.
 *
 * NOTE (future hardening): a public write endpoint like this wants rate
 * limiting / a CAPTCHA before production to prevent booking spam.
 */

export type PublicReservationResult =
  | { ok: true; reservationNumber: string }
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
    case "VEHICLE_NOT_FOUND":
      return "This vehicle is no longer available.";
    case "VEHICLE_NO_PRICING":
      return "This vehicle can't be booked online yet — please contact us.";
    case "DATE_CONFLICT":
      return "Those dates are already booked for this vehicle. Please try different dates.";
    default:
      return "Something went wrong sending your request. Please try again.";
  }
}

export async function createPublicReservationAction(
  input: ReservationInput,
): Promise<PublicReservationResult> {
  // Rate limit by client IP — this is a public, unauthenticated write.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  const limited = rateLimit(`public-reservation:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false, error: "Too many booking requests. Please try again in a few minutes." };
  }

  // Force the source server-side; never trust a client-supplied value here.
  const parsed = reservationSchema.safeParse({ ...input, source: "WEBSITE" });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const agency = await getMarketingAgency();
    if (!agency) {
      return { ok: false, error: "This site isn't accepting online bookings right now." };
    }

    const reservation = await createReservation(agency.id, null, parsed.data);
    // Surface the new booking on the agency's dashboard.
    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard");
    return { ok: true, reservationNumber: reservation.reservationNumber };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}
