import { getTranslations } from "next-intl/server";
import { Banknote, CalendarClock, Car, Users } from "lucide-react";

import { getDashboardStats } from "@/services/analytics";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";

export async function DashboardStats({ agencyId }: { agencyId: string }) {
  const [stats, t] = await Promise.all([getDashboardStats(agencyId), getTranslations("dash")]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t("statRevenue")}
        value={formatCurrency(stats.revenue)}
        icon={Banknote}
        accent="accent"
      />
      <StatCard
        label={t("statReservations")}
        value={String(stats.reservationsTotal)}
        icon={CalendarClock}
        accent="primary"
        trendLabel={t("statPending", { count: stats.reservationsPending })}
      />
      <StatCard
        label={t("statAvailable")}
        value={`${stats.vehicleAvailable} / ${stats.vehicleTotal}`}
        icon={Car}
        accent="primary"
      />
      <StatCard
        label={t("statCustomers")}
        value={String(stats.customerTotal)}
        icon={Users}
        accent="accent"
      />
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
