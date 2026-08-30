import type { Metadata } from "next";
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

  if (!canView) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={Lock}
          title="You don't have access to analytics"
          description="Ask an owner or manager to grant you the “View analytics” permission."
        />
      </div>
    );
  }

  const data = await getAgencyAnalytics(user.agencyId);

  return (
    <div className="space-y-6">
      <Header />

      {data.kpis.totalBookings === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No data to analyze yet"
          description="Once you have reservations, revenue trends, booking sources, and utilization will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Booked revenue"
              value={formatCurrency(data.kpis.totalRevenue)}
              icon={Banknote}
              accent="accent"
            />
            <StatCard
              label="Total bookings"
              value={String(data.kpis.totalBookings)}
              icon={CalendarClock}
              accent="primary"
            />
            <StatCard
              label="Avg booking value"
              value={formatCurrency(data.kpis.avgBookingValue)}
              icon={TrendingUp}
              accent="primary"
            />
            <StatCard
              label="Occupancy (next 30d)"
              value={`${data.kpis.occupancyRate}%`}
              icon={Percent}
              accent="warning"
            />
          </div>

          <ChartCard
            title="Booked revenue by month"
            description="Confirmed, ongoing, and completed bookings by rental month."
          >
            <RevenueTrendChart data={data.revenueByMonth} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Bookings by source" description="Where your reservations come from.">
              <BookingSourceChart data={data.bySource} />
            </ChartCard>
            <ChartCard title="Bookings by status" description="The reservation pipeline.">
              <StatusBarChart data={data.byStatus} />
            </ChartCard>
          </div>

          {data.topVehicles.length > 0 && (
            <ChartCard
              title="Top vehicles by revenue"
              description="Your best earners across confirmed bookings."
            >
              <TopVehiclesChart data={data.topVehicles} />
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Analytics</h1>
      <p className="text-muted-foreground text-sm">
        Revenue, booking sources, and fleet utilization at a glance.
      </p>
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
