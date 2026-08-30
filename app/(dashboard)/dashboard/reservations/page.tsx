import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
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

  if (!canView) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Lock}
          title="You don't have access to reservations"
          description="Ask an owner or manager to grant you the “View reservations” permission."
        />
      </div>
    );
  }

  const [reservationRows, vehicleRows, customerRows, paidMap] = await Promise.all([
    listReservations(user.agencyId),
    listBookableVehicles(user.agencyId),
    listCustomerOptions(user.agencyId),
    paidAmountByReservation(user.agencyId),
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

  return (
    <div className="space-y-6">
      <Header />
      <ReservationsView
        reservations={reservations}
        vehicles={vehicles}
        customers={customers}
        canManage={canManage}
        canApprove={canApprove}
        canInvoice={canInvoice}
      />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Reservations</h1>
      <p className="text-muted-foreground text-sm">
        Bookings, pricing, and status — with automatic double-booking prevention.
      </p>
    </div>
  );
}
