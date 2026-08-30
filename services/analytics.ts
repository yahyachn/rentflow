import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

// Statuses that count as (booked) revenue vs. that hold a vehicle's dates.
const REVENUE_STATUSES = ["CONFIRMED", "ONGOING", "COMPLETED"];
const OCCUPYING_STATUSES = ["PENDING", "CONFIRMED", "ONGOING", "COMPLETED"];

const SOURCE_LABEL: Record<string, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  PHONE: "Phone",
  WALK_IN: "Walk-in",
  OTHER: "Other",
};

const STATUS_ORDER = ["PENDING", "CONFIRMED", "ONGOING", "COMPLETED", "CANCELLED", "NO_SHOW"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export interface AgencyAnalytics {
  kpis: {
    totalRevenue: number;
    totalBookings: number;
    avgBookingValue: number;
    occupancyRate: number;
  };
  revenueByMonth: { label: string; revenue: number }[];
  bySource: { label: string; count: number }[];
  byStatus: { label: string; count: number }[];
  topVehicles: { label: string; revenue: number; bookings: number }[];
}

/**
 * Aggregate analytics for one agency, computed from live reservation data
 * (nothing is fabricated — sparse data yields sparse charts). Revenue counts
 * confirmed/ongoing/completed bookings; occupancy is the next 30 days.
 */
export async function getAgencyAnalytics(agencyId: string): Promise<AgencyAnalytics> {
  const [reservations, vehicleCount] = await Promise.all([
    prisma.reservation.findMany({
      where: { agencyId, deletedAt: null },
      select: {
        status: true,
        source: true,
        totalPrice: true,
        pickupDate: true,
        returnDate: true,
        vehicle: { select: { brand: true, model: true } },
      },
    }),
    prisma.vehicle.count({ where: { agencyId, deletedAt: null } }),
  ]);

  const revenueRes = reservations.filter((r) => REVENUE_STATUSES.includes(r.status));
  const totalRevenue = revenueRes.reduce((sum, r) => sum + Number(r.totalPrice), 0);
  const avgBookingValue = revenueRes.length ? totalRevenue / revenueRes.length : 0;

  // Occupancy over the next 30 days: booked vehicle-days / (vehicles × 30).
  const today = startOfDay(new Date());
  const windowEnd = new Date(today.getTime() + 30 * DAY_MS);
  let bookedDays = 0;
  for (const r of reservations) {
    if (!OCCUPYING_STATUSES.includes(r.status)) continue;
    const s = Math.max(startOfDay(r.pickupDate).getTime(), today.getTime());
    const e = Math.min(startOfDay(r.returnDate).getTime(), windowEnd.getTime());
    const d = Math.round((e - s) / DAY_MS);
    if (d > 0) bookedDays += d;
  }
  const occupancyRate =
    vehicleCount > 0 ? Math.round((bookedDays / (vehicleCount * 30)) * 100) : 0;

  // Booked revenue by rental month, over a 6-month window (2 back → 3 ahead)
  // so upcoming confirmed bookings are visible for this forward-booking business.
  const months: { key: string; label: string; revenue: number }[] = [];
  const base = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
    });
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  for (const r of revenueRes) {
    const d = new Date(r.pickupDate);
    const idx = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) months[idx].revenue += Number(r.totalPrice);
  }

  // Bookings by source (only sources with data), desc.
  const sourceCounts = new Map<string, number>();
  for (const r of reservations) sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1);
  const bySource = [...sourceCounts.entries()]
    .map(([source, count]) => ({ label: SOURCE_LABEL[source] ?? source, count }))
    .sort((a, b) => b.count - a.count);

  // Bookings by status, in the workflow's natural order.
  const statusCounts = new Map<string, number>();
  for (const r of reservations) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  const byStatus = STATUS_ORDER.filter((s) => statusCounts.has(s)).map((s) => ({
    label: STATUS_LABEL[s],
    count: statusCounts.get(s) ?? 0,
  }));

  // Top vehicles by booked revenue.
  const vehicleAgg = new Map<string, { revenue: number; bookings: number }>();
  for (const r of revenueRes) {
    const label = `${r.vehicle.brand} ${r.vehicle.model}`;
    const cur = vehicleAgg.get(label) ?? { revenue: 0, bookings: 0 };
    cur.revenue += Number(r.totalPrice);
    cur.bookings += 1;
    vehicleAgg.set(label, cur);
  }
  const topVehicles = [...vehicleAgg.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    kpis: {
      totalRevenue,
      totalBookings: reservations.length,
      avgBookingValue: Math.round(avgBookingValue),
      occupancyRate,
    },
    revenueByMonth: months.map((m) => ({ label: m.label, revenue: m.revenue })),
    bySource,
    byStatus,
    topVehicles,
  };
}

/**
 * Dashboard home summary. Every query here is scoped by `agencyId` — this
 * is the pattern every future service function must follow for tenant
 * isolation. Reservation-derived numbers are all 0 until Phase 3 wires up
 * the booking flow; the vehicle/fleet numbers are already live.
 */
export async function getDashboardStats(agencyId: string) {
  const [vehicleTotal, vehicleAvailable, reservationsByStatus, customerTotal] =
    await Promise.all([
      prisma.vehicle.count({ where: { agencyId, deletedAt: null } }),
      prisma.vehicle.count({ where: { agencyId, deletedAt: null, status: "AVAILABLE" } }),
      prisma.reservation.groupBy({
        by: ["status"],
        where: { agencyId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.customer.count({ where: { agencyId, deletedAt: null } }),
    ]);

  const countFor = (status: string) =>
    reservationsByStatus.find((r) => r.status === status)?._count._all ?? 0;

  const revenueAgg = await prisma.reservation.aggregate({
    where: { agencyId, deletedAt: null, status: { in: ["COMPLETED", "ONGOING", "CONFIRMED"] } },
    _sum: { totalPrice: true },
  });

  return {
    vehicleTotal,
    vehicleAvailable,
    occupancyRate:
      vehicleTotal > 0 ? Math.round(((vehicleTotal - vehicleAvailable) / vehicleTotal) * 100) : 0,
    customerTotal,
    reservationsPending: countFor("PENDING"),
    reservationsCompleted: countFor("COMPLETED"),
    reservationsCancelled: countFor("CANCELLED"),
    reservationsTotal: reservationsByStatus.reduce((sum, r) => sum + r._count._all, 0),
    revenue: Number(revenueAgg._sum.totalPrice ?? 0),
  };
}
