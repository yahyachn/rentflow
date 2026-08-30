import { Banknote, CalendarClock, Car, Users } from "lucide-react";

import { getDashboardStats } from "@/services/analytics";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";

export async function DashboardStats({ agencyId }: { agencyId: string }) {
  const stats = await getDashboardStats(agencyId);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Revenue"
        value={formatCurrency(stats.revenue)}
        icon={Banknote}
        accent="accent"
      />
      <StatCard
        label="Reservations"
        value={String(stats.reservationsTotal)}
        icon={CalendarClock}
        accent="primary"
        trendLabel={`${stats.reservationsPending} pending`}
      />
      <StatCard
        label="Available vehicles"
        value={`${stats.vehicleAvailable} / ${stats.vehicleTotal}`}
        icon={Car}
        accent="primary"
      />
      <StatCard label="Customers" value={String(stats.customerTotal)} icon={Users} accent="accent" />
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}
