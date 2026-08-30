import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BarChart3, CalendarClock, CalendarDays, Car, PlusCircle, Users } from "lucide-react";

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
  const t = await getTranslations("dash");
  const firstName = user?.name.split(" ")[0] ?? "there";
  const permissionKeys = user?.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canManageFleet = user?.role == null || permissionKeys.includes("fleet.manage");
  const recent = user ? await recentReservations(user.agencyId) : [];

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

  const quickActions = [
    { href: "/dashboard/fleet", icon: Car, label: t("qaFleet") },
    { href: "/dashboard/reservations", icon: CalendarDays, label: t("qaReservations") },
    { href: "/dashboard/customers", icon: Users, label: t("qaCustomers") },
    { href: "/dashboard/analytics", icon: BarChart3, label: t("qaAnalytics") },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="pointer-events-none absolute -top-16 end-[-3rem] size-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {t("welcome", { name: firstName })}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("welcomeSub", { agency: user?.agency.name ?? "" })}
            </p>
          </div>
          {canManageFleet && (
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95"
            >
              <Link href="/dashboard/fleet">
                <PlusCircle /> {t("addVehicle")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        {user && <DashboardStats agencyId={user.agencyId} />}
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>{t("recent")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={t("noReservations")}
                description={t("noReservationsDesc")}
              />
            ) : (
              <ul className="divide-y">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/reservations/${r.id}`}
                      className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
                    >
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
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group border-border hover:border-primary/40 hover:bg-primary/5 flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="text-primary-foreground flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--gold)] transition-transform duration-200 group-hover:scale-110">
                  <a.icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium">{a.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
