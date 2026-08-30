import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, PlusCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { recentReservations } from "@/services/reservations";
import {
  DashboardStats,
  DashboardStatsSkeleton,
} from "@/features/analytics/dashboard-stats";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const permissionKeys = user?.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canManageFleet = user?.role == null || permissionKeys.includes("fleet.manage");
  const recent = user ? await recentReservations(user.agencyId) : [];

  const STATUS_VARIANT: Record<string, "warning" | "default" | "accent" | "success" | "destructive" | "secondary"> = {
    PENDING: "warning",
    CONFIRMED: "default",
    ONGOING: "accent",
    COMPLETED: "success",
    CANCELLED: "destructive",
    NO_SHOW: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening with {user?.agency.name} today.
          </p>
        </div>
        {canManageFleet && (
          <Button asChild>
            <Link href="/dashboard/fleet">
              <PlusCircle /> Add vehicle
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        {user && <DashboardStats agencyId={user.agencyId} />}
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Recent reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No reservations yet"
                description="Create a booking from the Reservations tab — it'll show up here."
              />
            ) : (
              <ul className="divide-y">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.customer.firstName} {r.customer.lastName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {r.reservationNumber} · {r.vehicle.brand} {r.vehicle.model} ·{" "}
                        {formatDate(r.pickupDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(Number(r.totalPrice))}
                      </span>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase().replace("_", "-")}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s next</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              <span className="text-foreground font-medium">Phase 2</span> — Fleet CRUD, vehicle
              images, categories, and pricing.
            </p>
            <p>
              <span className="text-foreground font-medium">Phase 3</span> — Reservation system,
              booking calendar, customer management.
            </p>
            <p>
              <span className="text-foreground font-medium">Phase 4</span> — Full analytics
              dashboard and charts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
