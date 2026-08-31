import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Banknote, CalendarClock, Lock, Percent, TrendingUp } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { getAgencyAnalytics } from "@/services/analytics";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  BookingSourceChart,
  RevenueTrendChart,
  StatusBarChart,
  TopVehiclesChart,
} from "@/features/analytics/analytics-charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canView = user.role == null || permissionKeys.includes("analytics.view");
  const t = await getTranslations("ana");

  if (!canView) {
    return (
      <div className="space-y-6">
        <Header title={t("title")} subtitle={t("subtitle")} />
        <EmptyState icon={Lock} title={t("noAccessTitle")} description={t("noAccessDesc")} />
      </div>
    );
  }

  const data = await getAgencyAnalytics(user.agencyId);

  return (
    <div className="space-y-6">
      <Header title={t("title")} subtitle={t("subtitle")} />

      {data.kpis.totalBookings === 0 ? (
        <EmptyState icon={TrendingUp} title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("kpiRevenue")}
              value={formatCurrency(data.kpis.totalRevenue)}
              icon={Banknote}
              accent="accent"
            />
            <StatCard
              label={t("kpiBookings")}
              value={String(data.kpis.totalBookings)}
              icon={CalendarClock}
              accent="primary"
            />
            <StatCard
              label={t("kpiAvg")}
              value={formatCurrency(data.kpis.avgBookingValue)}
              icon={TrendingUp}
              accent="primary"
            />
            <StatCard
              label={t("kpiOccupancy")}
              value={`${data.kpis.occupancyRate}%`}
              icon={Percent}
              accent="warning"
            />
          </div>

          <ChartCard title={t("revenueTitle")} description={t("revenueDesc")}>
            <RevenueTrendChart data={data.revenueByMonth} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title={t("sourceTitle")} description={t("sourceDesc")}>
              <BookingSourceChart data={data.bySource} />
            </ChartCard>
            <ChartCard title={t("statusTitle")} description={t("statusDesc")}>
              <StatusBarChart data={data.byStatus} />
            </ChartCard>
          </div>

          {data.topVehicles.length > 0 && (
            <ChartCard title={t("topTitle")} description={t("topDesc")}>
              <TopVehiclesChart data={data.topVehicles} />
            </ChartCard>
          )}
        </>
      )}
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

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
