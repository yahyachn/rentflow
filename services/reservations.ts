import { prisma } from "@/lib/prisma";
import type { Prisma, ReservationStatus } from "@prisma/client";
import {
  notifyReservationCreated,
  notifyReservationStatusChanged,
} from "@/services/notifications";
import { RESERVATION_TRANSITIONS, type ReservationInput } from "@/validators/reservation";

/**
 * Reservation data access: creation (with server-side pricing and
 * double-booking prevention via VehicleAvailability), listing, and the status
 * workflow. Tenant-scoped throughout.
 *
 * Known error strings (translated in actions/reservations.ts):
 *   VEHICLE_NOT_FOUND, VEHICLE_NO_PRICING, CUSTOMER_NOT_FOUND, DATE_CONFLICT,
 *   RESERVATION_NOT_FOUND, INVALID_TRANSITION.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const LIST_INCLUDE = {
  vehicle: { select: { id: true, brand: true, model: true, year: true, type: true } },
  customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
} as const;

export type ReservationRow = Prisma.ReservationGetPayload<{ include: typeof LIST_INCLUDE }>;

export function listReservations(agencyId: string) {
  return prisma.reservation.findMany({
    where: { agencyId, deletedAt: null },
    include: LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/** Vehicles that can be booked (not archived/hidden), with their daily rate,
 * for the New Reservation picker. */
export function listBookableVehicles(agencyId: string) {
  return prisma.vehicle.findMany({
    where: { agencyId, deletedAt: null, status: { not: "HIDDEN" } },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      pricing: { where: { period: "DAILY" }, select: { amount: true } },
    },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
}

export function recentReservations(agencyId: string, take = 5) {
  return prisma.reservation.findMany({
    where: { agencyId, deletedAt: null },
    include: LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

const DETAIL_INCLUDE = {
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      type: true,
      slug: true,
      images: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  },
  customer: true,
  createdBy: { select: { name: true } },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: { changedBy: { select: { name: true } } },
  },
  payments: { orderBy: { createdAt: "desc" as const } },
  invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
} as const;

export type ReservationDetail = Prisma.ReservationGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export function getReservationDetail(agencyId: string, id: string) {
  return prisma.reservation.findFirst({
    where: { id, agencyId, deletedAt: null },
    include: DETAIL_INCLUDE,
  });
}

/** Whole days between two dates, minimum 1 (the validator already guarantees
 * return > pickup). */
export function durationInDays(pickup: Date, ret: Date) {
  return Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / DAY_MS));
}

export async function createReservation(
  agencyId: string,
  userId: string | null,
  input: ReservationInput,
) {
  const pickup = new Date(input.pickupDate);
  const ret = new Date(input.returnDate);

  // Vehicle + daily rate (read outside the transaction; validated for tenant).
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, agencyId, deletedAt: null },
    include: { pricing: { where: { period: "DAILY" } } },
  });
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  const daily = vehicle.pricing[0];
  if (!daily) throw new Error("VEHICLE_NO_PRICING");

  const durationDays = durationInDays(pickup, ret);
  const basePrice = Number(daily.amount) * durationDays;
  const totalPrice = basePrice; // discounts/extras/coupons land in later phases
  const depositAmount = Number(vehicle.depositAmount);

  const reservation = await prisma.$transaction(async (tx) => {
    // Double-booking guard: any BOOKED/BLOCKED/MAINTENANCE window that overlaps
    // [pickup, return) blocks the booking. Checked inside the transaction so the
    // block we create can't race another booking for the same slot.
    const conflict = await tx.vehicleAvailability.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: { in: ["BOOKED", "BLOCKED", "MAINTENANCE"] },
        startDate: { lt: ret },
        endDate: { gt: pickup },
      },
      select: { id: true },
    });
    if (conflict) throw new Error("DATE_CONFLICT");

    // Resolve the customer: an existing one (tenant-checked) or a new inline one.
    let customerId = input.customerId;
    if (customerId) {
      const existing = await tx.customer.findFirst({
        where: { id: customerId, agencyId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) throw new Error("CUSTOMER_NOT_FOUND");
    } else if (input.newCustomer) {
      const created = await tx.customer.create({
        data: {
          agencyId,
          firstName: input.newCustomer.firstName,
          lastName: input.newCustomer.lastName,
          phone: input.newCustomer.phone ?? null,
          whatsapp: input.newCustomer.whatsapp ?? null,
          email: input.newCustomer.email ?? null,
        },
      });
      customerId = created.id;
    } else {
      throw new Error("CUSTOMER_NOT_FOUND");
    }

    // RF-YYYY-NNNNNN. reservationNumber is globally unique; a rare collision
    // surfaces as a generic error the user can retry (fine for this scale).
    const count = await tx.reservation.count();
    const reservationNumber = `RF-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

    const reservation = await tx.reservation.create({
      data: {
        agencyId,
        reservationNumber,
        vehicleId: vehicle.id,
        customerId,
        status: "PENDING",
        source: input.source,
        pickupDate: pickup,
        returnDate: ret,
        pickupTime: input.pickupTime ?? null,
        returnTime: input.returnTime ?? null,
        pickupCity: input.pickupCity ?? null,
        returnCity: input.returnCity ?? null,
        driverAge: input.driverAge ?? null,
        flightNumber: input.flightNumber ?? null,
        licenseCountry: input.licenseCountry ?? null,
        message: input.message ?? null,
        durationDays,
        basePrice,
        totalPrice,
        depositAmount,
        createdById: userId,
      },
    });

    await tx.vehicleAvailability.create({
      data: {
        vehicleId: vehicle.id,
        startDate: pickup,
        endDate: ret,
        status: "BOOKED",
        reason: `Reservation ${reservationNumber}`,
        reservationId: reservation.id,
      },
    });

    await tx.reservationStatusLog.create({
      data: {
        reservationId: reservation.id,
        status: "PENDING",
        changedById: userId,
        note: "Reservation created",
      },
    });

    await tx.customer.update({
      where: { id: customerId },
      data: { totalBookings: { increment: 1 } },
    });

    return reservation;
  });

  // Best-effort — a notification failure must not undo a committed booking.
  await notifyReservationCreated(reservation.id);
  return reservation;
}

export async function updateReservationStatus(
  agencyId: string,
  userId: string | null,
  id: string,
  next: ReservationStatus,
  note?: string,
) {
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id, agencyId, deletedAt: null },
      select: { id: true, status: true, customerId: true, totalPrice: true },
    });
    if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

    const allowed = RESERVATION_TRANSITIONS[reservation.status] ?? [];
    if (!allowed.includes(next)) throw new Error("INVALID_TRANSITION");

    const releases = next === "CANCELLED" || next === "NO_SHOW";

    await tx.reservation.update({
      where: { id },
      data: {
        status: next,
        ...(releases
          ? { cancelledAt: new Date(), cancelledReason: note ?? null }
          : {}),
      },
    });

    // Freeing the vehicle: drop this reservation's availability block(s) so the
    // dates open back up for other bookings.
    if (releases) {
      await tx.vehicleAvailability.deleteMany({ where: { reservationId: id } });
    }

    // Recognise revenue when the rental completes.
    if (next === "COMPLETED") {
      await tx.customer.update({
        where: { id: reservation.customerId },
        data: { totalRevenue: { increment: Number(reservation.totalPrice) } },
      });
    }

    await tx.reservationStatusLog.create({
      data: { reservationId: id, status: next, changedById: userId, note: note ?? null },
    });
  });

  await notifyReservationStatusChanged(id, next);
}
