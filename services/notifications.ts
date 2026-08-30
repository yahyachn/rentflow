import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Notifications = a durable outbox + an in-app feed (see the Notification model).
 *
 *  - SYSTEM notifications are the agency's in-app feed (the topbar bell). They're
 *    "delivered" the moment they're created (status SENT) and become READ when a
 *    staff member opens them.
 *  - EMAIL / SMS / WHATSAPP notifications are outbound to customers. Real senders
 *    (SMTP/Resend, Twilio, WhatsApp Business API) plug in at `deliverOutbound`
 *    below; until one is configured they're recorded as PENDING — a real queued
 *    outbox, honest about not having been sent yet.
 */

// --- in-app feed (SYSTEM) ---------------------------------------------------

export function listSystemNotifications(agencyId: string, take = 15) {
  return prisma.notification.findMany({
    where: { agencyId, channel: "SYSTEM" },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function countUnread(agencyId: string) {
  return prisma.notification.count({
    where: { agencyId, channel: "SYSTEM", readAt: null },
  });
}

export async function markNotificationRead(agencyId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, agencyId, channel: "SYSTEM", readAt: null },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function markAllNotificationsRead(agencyId: string) {
  await prisma.notification.updateMany({
    where: { agencyId, channel: "SYSTEM", readAt: null },
    data: { status: "READ", readAt: new Date() },
  });
}

// --- creation ---------------------------------------------------------------

async function createSystem(
  agencyId: string,
  data: { title: string; body: string; reservationId?: string },
) {
  await prisma.notification.create({
    data: {
      agencyId,
      channel: "SYSTEM",
      status: "SENT",
      sentAt: new Date(),
      title: data.title,
      body: data.body,
      relatedReservationId: data.reservationId ?? null,
    },
  });
}

async function queueOutbound(
  agencyId: string,
  data: {
    channel: "EMAIL" | "SMS" | "WHATSAPP";
    title: string;
    body: string;
    reservationId?: string;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
  },
) {
  await prisma.notification.create({
    data: {
      agencyId,
      channel: data.channel,
      status: "PENDING",
      title: data.title,
      body: data.body,
      relatedReservationId: data.reservationId ?? null,
      recipientEmail: data.recipientEmail ?? null,
      recipientPhone: data.recipientPhone ?? null,
    },
  });
  // Delivery seam: no email/SMS/WhatsApp provider is configured yet, so the
  // record stays PENDING in the outbox. Wiring a real provider (and flipping
  // status to SENT/FAILED) plugs in here.
}

// --- reservation events -----------------------------------------------------

const CUSTOMER_STATUS_COPY: Record<string, { title: string; body: (ctx: EventCtx) => string }> = {
  CONFIRMED: {
    title: "Your reservation is confirmed",
    body: (c) => `Your booking ${c.number} for the ${c.vehicle} (${c.dates}) is confirmed.`,
  },
  CANCELLED: {
    title: "Your reservation was cancelled",
    body: (c) => `Your booking ${c.number} for the ${c.vehicle} has been cancelled.`,
  },
  COMPLETED: {
    title: "Thanks for renting with us",
    body: (c) => `Your rental ${c.number} (${c.vehicle}) is complete. We hope to see you again!`,
  },
};

const STAFF_STATUS_TITLE: Record<string, string> = {
  CONFIRMED: "Reservation confirmed",
  ONGOING: "Rental started",
  COMPLETED: "Rental completed",
  CANCELLED: "Reservation cancelled",
  NO_SHOW: "Reservation no-show",
  PENDING: "Reservation pending",
};

interface EventCtx {
  number: string;
  vehicle: string;
  customer: string;
  dates: string;
  total: string;
}

async function loadContext(reservationId: string) {
  const r = await prisma.reservation.findFirst({
    where: { id: reservationId },
    select: {
      id: true,
      agencyId: true,
      reservationNumber: true,
      totalPrice: true,
      pickupDate: true,
      returnDate: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
      vehicle: { select: { brand: true, model: true } },
    },
  });
  if (!r) return null;
  const ctx: EventCtx = {
    number: r.reservationNumber,
    vehicle: `${r.vehicle.brand} ${r.vehicle.model}`,
    customer: `${r.customer.firstName} ${r.customer.lastName}`,
    dates: `${formatDate(r.pickupDate)} → ${formatDate(r.returnDate)}`,
    total: formatCurrency(Number(r.totalPrice)),
  };
  return { r, ctx };
}

/** Fire on a new booking: a staff feed alert + a customer email in the outbox.
 * Best-effort — never throws, so it can't break the booking it describes. */
export async function notifyReservationCreated(reservationId: string) {
  try {
    const loaded = await loadContext(reservationId);
    if (!loaded) return;
    const { r, ctx } = loaded;

    await createSystem(r.agencyId, {
      title: "New reservation",
      body: `${ctx.customer} booked the ${ctx.vehicle} (${ctx.dates}) — ${ctx.total}. Ref ${ctx.number}.`,
      reservationId: r.id,
    });

    if (r.customer.email) {
      await queueOutbound(r.agencyId, {
        channel: "EMAIL",
        title: "We received your reservation request",
        body: `Thanks! Your request ${ctx.number} for the ${ctx.vehicle} (${ctx.dates}) is in — we'll confirm shortly.`,
        reservationId: r.id,
        recipientEmail: r.customer.email,
      });
    }
  } catch (err) {
    console.error("notifyReservationCreated failed", err);
  }
}

/** Fire on a status change: a staff feed alert + (for the customer-relevant
 * statuses) a customer email in the outbox. Best-effort. */
export async function notifyReservationStatusChanged(reservationId: string, status: string) {
  try {
    const loaded = await loadContext(reservationId);
    if (!loaded) return;
    const { r, ctx } = loaded;

    await createSystem(r.agencyId, {
      title: STAFF_STATUS_TITLE[status] ?? "Reservation updated",
      body: `${ctx.number} · ${ctx.customer} · ${ctx.vehicle}.`,
      reservationId: r.id,
    });

    const customerCopy = CUSTOMER_STATUS_COPY[status];
    if (customerCopy && r.customer.email) {
      await queueOutbound(r.agencyId, {
        channel: "EMAIL",
        title: customerCopy.title,
        body: customerCopy.body(ctx),
        reservationId: r.id,
        recipientEmail: r.customer.email,
      });
    }
  } catch (err) {
    console.error("notifyReservationStatusChanged failed", err);
  }
}
