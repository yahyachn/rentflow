import { prisma } from "@/lib/prisma";

/**
 * Invoicing. One invoice per reservation (the schema enforces it via a unique
 * reservationId). Amounts are copied from the reservation at issue time so the
 * invoice is a stable financial record even if the booking changes later.
 *
 * Known error strings (translated by callers): RESERVATION_NOT_FOUND.
 */

const INVOICE_INCLUDE = {
  customer: true,
  reservation: {
    include: { vehicle: { select: { brand: true, model: true, year: true } } },
  },
  agency: {
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      slug: true,
      currency: true,
    },
  },
} as const;

export type InvoiceWithRelations = Awaited<ReturnType<typeof loadInvoice>>;

function loadInvoice(id: string) {
  return prisma.invoice.findUniqueOrThrow({ where: { id }, include: INVOICE_INCLUDE });
}

/**
 * Return the reservation's invoice, creating it (issued) on first request.
 * Idempotent: a second call returns the existing invoice untouched.
 */
export async function getOrCreateInvoice(agencyId: string, reservationId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, agencyId, deletedAt: null },
    select: {
      id: true,
      customerId: true,
      basePrice: true,
      discountAmount: true,
      totalPrice: true,
      paymentStatus: true,
      invoice: { select: { id: true } },
    },
  });
  if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

  if (reservation.invoice) {
    return loadInvoice(reservation.invoice.id);
  }

  const paid = reservation.paymentStatus === "PAID";
  const now = new Date();
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${now.getFullYear()}-${String(count + 1).padStart(6, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      agencyId,
      reservationId: reservation.id,
      customerId: reservation.customerId,
      invoiceNumber,
      status: paid ? "PAID" : "SENT",
      subtotal: reservation.basePrice,
      discountAmount: reservation.discountAmount,
      taxAmount: 0,
      totalAmount: reservation.totalPrice,
      issuedAt: now,
      dueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      paidAt: paid ? now : null,
    },
  });

  return loadInvoice(invoice.id);
}
