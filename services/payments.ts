import { prisma } from "@/lib/prisma";
import type { PaymentInput } from "@/validators/payment";

/**
 * Payments = the money received against a reservation. Recording one recomputes
 * the reservation's paymentStatus (UNPAID → PARTIALLY_PAID → PAID) and, if an
 * invoice exists, flips it to PAID once the balance is cleared.
 *
 * Known error strings (translated by callers): RESERVATION_NOT_FOUND.
 */

/** Total SUCCEEDED payments per reservation, for showing balances in lists. */
export async function paidAmountByReservation(agencyId: string) {
  const rows = await prisma.payment.groupBy({
    by: ["reservationId"],
    where: { agencyId, status: "SUCCEEDED" },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.reservationId, Number(r._sum.amount ?? 0)]));
}

export async function recordPayment(agencyId: string, input: PaymentInput) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id: input.reservationId, agencyId, deletedAt: null },
      select: {
        id: true,
        totalPrice: true,
        invoice: { select: { id: true, totalAmount: true } },
      },
    });
    if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

    await tx.payment.create({
      data: {
        agencyId,
        reservationId: reservation.id,
        invoiceId: reservation.invoice?.id ?? null,
        amount: input.amount,
        method: input.method,
        status: "SUCCEEDED",
        paidAt: new Date(),
        transactionRef: input.transactionRef ?? null,
        notes: input.notes ?? null,
      },
    });

    const agg = await tx.payment.aggregate({
      where: { reservationId: reservation.id, status: "SUCCEEDED" },
      _sum: { amount: true },
    });
    const paid = Number(agg._sum.amount ?? 0);
    const total = Number(reservation.totalPrice);
    const paymentStatus = paid >= total ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID";

    await tx.reservation.update({
      where: { id: reservation.id },
      data: { paymentStatus },
    });

    if (reservation.invoice) {
      const fullyPaid = paid >= Number(reservation.invoice.totalAmount);
      await tx.invoice.update({
        where: { id: reservation.invoice.id },
        data: { status: fullyPaid ? "PAID" : "SENT", paidAt: fullyPaid ? new Date() : null },
      });
    }

    return { paid, paymentStatus };
  });
}
