import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { getOrCreateInvoice } from "@/services/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintInvoiceButton } from "@/features/invoices/print-button";

export const metadata: Metadata = { title: "Invoice" };

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  SENT: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canBill = user.role == null || permissionKeys.includes("billing.manage");
  if (!canBill) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-lg font-semibold">Not authorized</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          You need the “Manage billing” permission to view invoices.
        </p>
        <Link href="/dashboard/reservations" className="text-primary mt-4 inline-block text-sm">
          Back to reservations
        </Link>
      </div>
    );
  }

  let invoice: Awaited<ReturnType<typeof getOrCreateInvoice>>;
  try {
    invoice = await getOrCreateInvoice(user.agencyId, reservationId);
  } catch {
    notFound();
  }

  const { agency, customer, reservation } = invoice;
  const currency = agency.currency;
  const money = (n: number) => formatCurrency(n, currency);

  const subtotal = Number(invoice.subtotal);
  const discount = Number(invoice.discountAmount);
  const tax = Number(invoice.taxAmount);
  const total = Number(invoice.totalAmount);
  const deposit = Number(reservation.depositAmount);
  const days = reservation.durationDays;
  const unit = days > 0 ? subtotal / days : subtotal;

  return (
    <div className="min-h-svh bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Toolbar (screen only) */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <Link
          href="/dashboard/reservations"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to reservations
        </Link>
        <PrintInvoiceButton />
      </div>

      {/* Invoice sheet — fixed light palette so the PDF is always a white document */}
      <div className="mx-auto max-w-3xl bg-white p-8 text-slate-900 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xl font-semibold">{agency.name}</p>
            <div className="mt-1 space-y-0.5 text-sm text-slate-500">
              {[agency.address, agency.city].filter(Boolean).length > 0 && (
                <p>{[agency.address, agency.city].filter(Boolean).join(", ")}</p>
              )}
              {agency.email && <p>{agency.email}</p>}
              {agency.phone && <p>{agency.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="mt-1 text-sm text-slate-500">{invoice.invoiceNumber}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_STYLE[invoice.status] ?? STATUS_STYLE.DRAFT
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Bill to</p>
            <p className="mt-1 font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <div className="space-y-0.5 text-sm text-slate-500">
              {customer.email && <p>{customer.email}</p>}
              {customer.phone && <p>{customer.phone}</p>}
              {[customer.city, customer.country].filter(Boolean).length > 0 && (
                <p>{[customer.city, customer.country].filter(Boolean).join(", ")}</p>
              )}
            </div>
          </div>
          <div className="text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Issued</span>
              <span>{invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Due</span>
              <span>{invoice.dueAt ? formatDate(invoice.dueAt) : "—"}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Reservation</span>
              <span>{reservation.reservationNumber}</span>
            </div>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Days</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3">
                <p className="font-medium">
                  {reservation.vehicle.brand} {reservation.vehicle.model} ({reservation.vehicle.year}) rental
                </p>
                <p className="text-slate-500">
                  {formatDate(reservation.pickupDate)} – {formatDate(reservation.returnDate)}
                </p>
              </td>
              <td className="py-3 text-right tabular-nums">{days}</td>
              <td className="py-3 text-right tabular-nums">{money(unit)}</td>
              <td className="py-3 text-right tabular-nums">{money(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="tabular-nums">{money(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="tabular-nums">−{money(discount)}</dd>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax</dt>
                <dd className="tabular-nums">{money(tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(total)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
          {deposit > 0 && (
            <p className="mb-2">
              A refundable security deposit of <span className="font-medium">{money(deposit)}</span>{" "}
              applies and is not included in the total above.
            </p>
          )}
          <p>Thank you for choosing {agency.name}. Payment is due by the date shown above.</p>
        </footer>
      </div>
    </div>
  );
}
