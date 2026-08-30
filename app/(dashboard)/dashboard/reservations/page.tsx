import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { listCoupons } from "@/services/coupons";
import { listReviews } from "@/services/reviews";
import { listCustomerOptions } from "@/services/customers";
import { paidAmountByReservation } from "@/services/payments";
import {
  listBookableVehicles,
  listReservations,
  type ReservationRow,
} from "@/services/reservations";
import { EmptyState } from "@/components/shared/empty-state";
import { ReservationsView } from "@/features/reservations/reservations-view";
import type {
  CustomerOption,
  ReservationDTO,
  VehicleOption,
} from "@/features/reservations/types";
import type { CouponDTO } from "@/features/coupons/types";
import type { ReviewDTO } from "@/features/reviews/types";

export const metadata: Metadata = { title: "Reservations" };

function toReservationDTO(r: ReservationRow, amountPaid: number): ReservationDTO {
  return {
    amountPaid,
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
    totalPrice: Number(r.totalPrice),
    paymentStatus: r.paymentStatus,
  };
}

export default async function ReservationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const isOwnerNoRole = user.role == null;
  const canView = isOwnerNoRole || permissionKeys.includes("reservations.view");
  const canManage = isOwnerNoRole || permissionKeys.includes("reservations.manage");
  const canApprove = isOwnerNoRole || permissionKeys.includes("reservations.approve");
  const canInvoice = isOwnerNoRole || permissionKeys.includes("billing.manage");

  const t = await getTranslations("res");

  if (!canView) {
    return (
      <div className="space-y-6">
        <Header title={t("title")} subtitle={t("subtitle")} />
        <EmptyState icon={Lock} title={t("noAccessTitle")} description={t("noAccessDesc")} />
      </div>
    );
  }

  const [reservationRows, vehicleRows, customerRows, paidMap, couponRows, reviewRows] =
    await Promise.all([
      listReservations(user.agencyId),
      listBookableVehicles(user.agencyId),
      listCustomerOptions(user.agencyId),
      paidAmountByReservation(user.agencyId),
      canManage ? listCoupons(user.agencyId) : Promise.resolve([]),
      canManage ? listReviews(user.agencyId) : Promise.resolve([]),
    ]);

  const reservations = reservationRows.map((r) => toReservationDTO(r, paidMap.get(r.id) ?? 0));
  const vehicles: VehicleOption[] = vehicleRows.map((v) => ({
    id: v.id,
    label: `${v.brand} ${v.model} (${v.year})`,
    dailyPrice: v.pricing[0] ? Number(v.pricing[0].amount) : null,
  }));
  const customers: CustomerOption[] = customerRows.map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName}${c.phone ? ` · ${c.phone}` : ""}`,
  }));
  const coupons: CouponDTO[] = couponRows.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    minRentalDays: c.minRentalDays,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
  }));
  const reviews: ReviewDTO[] = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    isPublished: r.isPublished,
    createdAt: r.createdAt.toISOString(),
    vehicleLabel: `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.year})`,
    customerName: `${r.customer.firstName} ${r.customer.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <Header title={t("title")} subtitle={t("subtitle")} />
      <ReservationsView
        reservations={reservations}
        vehicles={vehicles}
        customers={customers}
        coupons={coupons}
        reviews={reviews}
        canManage={canManage}
        canApprove={canApprove}
        canInvoice={canInvoice}
      />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}
