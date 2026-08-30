import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, FileText } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { getReservationDetail } from "@/services/reservations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordPaymentButton } from "@/features/reservations/record-payment-button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservation" };

const STATUS_VARIANT: Record<
  string,
  "warning" | "default" | "accent" | "success" | "destructive" | "secondary"
> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ONGOING: "accent",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};
const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  CMI: "CMI",
  BANK_TRANSFER: "Bank transfer",
};
const PAY_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  UNPAID: "secondary",
  REFUNDED: "destructive",
};

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const isOwner = user.role == null;
  const canView = isOwner || permissionKeys.includes("reservations.view");
  const canManage =
    isOwner ||
    permissionKeys.includes("reservations.manage") ||
    permissionKeys.includes("reservations.approve");
  const canBill = isOwner || permissionKeys.includes("billing.manage");

  if (!canView) notFound();

  const r = await getReservationDetail(user.agencyId, id);
  if (!r) notFound();

  const amountPaid = r.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(r.totalPrice);
  const balance = Math.max(0, total - amountPaid);

  const reservationDTO = {
    id: r.id,
    reservationNumber: r.reservationNumber,
    status: r.status,
    source: r.source,
    vehicleId: r.vehicle.id,
    vehicleLabel: `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.year})`,
    customerId: r.customer.id,
    customerName: `${r.customer.firstName} ${r.customer.lastName}`,
    pickupDate: r.pickupDate.toISOString(),
    returnDate: r.returnDate.toISOString(),
    durationDays: r.durationDays,
    totalPrice: total,
    paymentStatus: r.paymentStatus,
    amountPaid,
  };

  const cover = r.vehicle.images[0]?.url ?? null;
  const discount = Number(r.discountAmount);
  const extras = Number(r.extrasAmount);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link
          href="/dashboard/reservations"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Reservations
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">{r.reservationNumber}</h1>
            <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {canManage && balance > 0 && <RecordPaymentButton reservation={reservationDTO} />}
            {canBill && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/invoice/${r.id}`} target="_blank" rel="noopener noreferrer">
                  <FileText /> Invoice
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Field label="Pickup" value={`${formatDate(r.pickupDate)}${r.pickupTime ? ` · ${r.pickupTime}` : ""}`} />
                <Field label="Return" value={`${formatDate(r.returnDate)}${r.returnTime ? ` · ${r.returnTime}` : ""}`} />
                <Field label="Duration" value={`${r.durationDays} ${r.durationDays === 1 ? "day" : "days"}`} />
                <Field label="Pickup city" value={r.pickupCity ?? "—"} />
                <Field label="Return city" value={r.returnCity ?? "—"} />
                <Field label="Source" value={r.source} />
                {r.driverAge != null && <Field label="Driver age" value={String(r.driverAge)} />}
                {r.flightNumber && <Field label="Flight" value={r.flightNumber} />}
                {r.licenseCountry && <Field label="License country" value={r.licenseCountry} />}
              </dl>
              {r.message && (
                <p className="text-muted-foreground mt-4 border-t pt-3 text-sm">
                  <span className="text-foreground font-medium">Note:</span> {r.message}
                </p>
              )}
              {r.cancelledReason && (
                <p className="text-destructive mt-4 border-t pt-3 text-sm">
                  Cancelled: {r.cancelledReason}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Base price" value={formatCurrency(Number(r.basePrice))} />
                {discount > 0 && <Row label="Discount" value={`−${formatCurrency(discount)}`} />}
                {extras > 0 && <Row label="Extras" value={formatCurrency(extras)} />}
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(total)}</dd>
                </div>
                <Row label="Paid" value={formatCurrency(amountPaid)} />
                <Row label="Balance" value={formatCurrency(balance)} strong />
                <div className="flex items-center justify-between pt-1">
                  <dt className="text-muted-foreground">Payment status</dt>
                  <dd>
                    <Badge variant={PAY_STATUS_VARIANT[r.paymentStatus] ?? "secondary"}>
                      {r.paymentStatus.replace("_", " ").toLowerCase()}
                    </Badge>
                  </dd>
                </div>
                {Number(r.depositAmount) > 0 && (
                  <Row label="Refundable deposit" value={formatCurrency(Number(r.depositAmount))} muted />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {r.payments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payments recorded"
                  description="Record a cash, card, or transfer payment against this booking."
                />
              ) : (
                <ul className="divide-y">
                  {r.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium">
                          {METHOD_LABEL[p.method] ?? p.method}
                          {p.transactionRef ? ` · ${p.transactionRef}` : ""}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(p.paidAt ?? p.createdAt)} · {p.status.toLowerCase()}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">{formatCurrency(Number(p.amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link
                href="/dashboard/customers"
                className="font-medium hover:underline"
              >
                {r.customer.firstName} {r.customer.lastName}
              </Link>
              {r.customer.email && <p className="text-muted-foreground">{r.customer.email}</p>}
              {r.customer.phone && <p className="text-muted-foreground">{r.customer.phone}</p>}
              {[r.customer.city, r.customer.country].filter(Boolean).length > 0 && (
                <p className="text-muted-foreground">
                  {[r.customer.city, r.customer.country].filter(Boolean).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">
                    {r.vehicle.brand} {r.vehicle.model}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {r.vehicle.year} · {r.vehicle.type === "CAR" ? "Car" : "Motorcycle"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-4">
                {r.statusHistory.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="bg-primary absolute top-1.5 -left-[1.32rem] size-2 rounded-full ring-4 ring-[var(--card)]" />
                    <p className="text-sm font-medium">{STATUS_LABEL[log.status] ?? log.status}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(log.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {log.changedBy?.name ? ` · ${log.changedBy.name}` : ""}
                    </p>
                    {log.note && <p className="text-muted-foreground mt-0.5 text-xs">{log.note}</p>}
                  </li>
                ))}
              </ol>
              {r.createdBy?.name && (
                <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
                  Created by {r.createdBy.name}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-primary font-semibold" : muted ? "text-muted-foreground" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
