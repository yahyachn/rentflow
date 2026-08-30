"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ReservationDTO, ReservationStatusValue, VehicleOption } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_W = 150;
const DAY_W = 40;

// Statuses that occupy the vehicle (cancelled/no-show freed their dates).
const ACTIVE_STATUSES = new Set<ReservationStatusValue>([
  "PENDING",
  "CONFIRMED",
  "ONGOING",
  "COMPLETED",
]);

// success and accent share the same emerald token, so COMPLETED uses slate to
// stay distinct from ONGOING.
const BAR_CLASS: Record<string, string> = {
  PENDING: "bg-warning text-warning-foreground",
  CONFIRMED: "bg-primary text-primary-foreground",
  ONGOING: "bg-accent text-accent-foreground",
  COMPLETED: "bg-secondary text-secondary-foreground",
};

const LEGEND: { status: ReservationStatusValue; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "ONGOING", label: "Ongoing" },
  { status: "COMPLETED", label: "Completed" },
];

function startOfDay(d: Date | string) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function BookingTimeline({
  reservations,
  vehicles,
}: {
  reservations: ReservationDTO[];
  vehicles: VehicleOption[];
}) {
  const [windowDays, setWindowDays] = useState(21);
  const [start, setStart] = useState(() => startOfDay(new Date()));

  const days = useMemo(
    () => Array.from({ length: windowDays }, (_, i) => addDays(start, i)),
    [start, windowDays],
  );
  const todayOffset = daysBetween(start, new Date());
  const windowEnd = addDays(start, windowDays);

  // Only bookings that occupy a vehicle and intersect the visible window.
  const barsByVehicle = useMemo(() => {
    const map = new Map<string, ReservationDTO[]>();
    for (const r of reservations) {
      if (!ACTIVE_STATUSES.has(r.status)) continue;
      const s = startOfDay(r.pickupDate);
      const e = startOfDay(r.returnDate);
      if (e <= start || s >= windowEnd) continue;
      const list = map.get(r.vehicleId) ?? [];
      list.push(r);
      map.set(r.vehicleId, list);
    }
    return map;
  }, [reservations, start, windowEnd]);

  const rangeLabel = `${formatDate(start, { month: "short", day: "numeric" })} – ${formatDate(
    addDays(start, windowDays - 1),
    { month: "short", day: "numeric", year: "numeric" },
  )}`;

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="No vehicles to schedule"
        description="Add a vehicle to your fleet to see its booking timeline here."
      />
    );
  }

  const trackWidth = windowDays * DAY_W;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => setStart(addDays(start, -windowDays))} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStart(startOfDay(new Date()))}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => setStart(addDays(start, windowDays))} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-muted-foreground ml-1 text-sm">{rangeLabel}</span>
        </div>
        <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
          <SelectTrigger className="w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="14">2 weeks</SelectItem>
            <SelectItem value="21">3 weeks</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline grid */}
      <div className="overflow-x-auto rounded-lg border">
        <div style={{ width: LABEL_W + trackWidth, minWidth: "100%" }}>
          {/* Header */}
          <div className="bg-muted/40 flex border-b">
            <div
              className="bg-muted/40 sticky left-0 z-20 shrink-0 border-r px-3 py-2 text-xs font-medium"
              style={{ width: LABEL_W }}
            >
              Vehicle
            </div>
            <div className="flex" style={{ width: trackWidth }}>
              {days.map((d, i) => {
                const weekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = i === todayOffset;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex shrink-0 flex-col items-center justify-center border-r py-1 text-[10px] leading-tight",
                      weekend && "bg-muted/50",
                      isToday && "bg-primary/10",
                    )}
                    style={{ width: DAY_W }}
                  >
                    <span className="text-muted-foreground uppercase">
                      {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                    </span>
                    <span className={cn("font-medium", isToday && "text-primary")}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {vehicles.map((v) => {
            const bars = barsByVehicle.get(v.id) ?? [];
            return (
              <div key={v.id} className="flex border-b last:border-b-0">
                <div
                  className="bg-card sticky left-0 z-20 flex shrink-0 items-center border-r px-3 text-sm font-medium"
                  style={{ width: LABEL_W, minHeight: 44 }}
                >
                  <span className="truncate">{v.label}</span>
                </div>
                <div className="relative" style={{ width: trackWidth, minHeight: 44 }}>
                  {/* Day gridlines / weekend + today shading */}
                  <div className="absolute inset-0 flex">
                    {days.map((d, i) => {
                      const weekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = i === todayOffset;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "shrink-0 border-r",
                            weekend && "bg-muted/40",
                            isToday && "bg-primary/10",
                          )}
                          style={{ width: DAY_W }}
                        />
                      );
                    })}
                  </div>

                  {/* Booking bars */}
                  {bars.map((r) => {
                    const s = daysBetween(start, startOfDay(r.pickupDate));
                    const e = daysBetween(start, startOfDay(r.returnDate));
                    const clampS = Math.max(0, s);
                    const clampE = Math.min(windowDays, e);
                    const left = clampS * DAY_W;
                    const width = Math.max(24, (clampE - clampS) * DAY_W - 3);
                    return (
                      <div
                        key={r.id}
                        title={`${r.reservationNumber} · ${r.customerName}\n${formatDate(r.pickupDate)} → ${formatDate(r.returnDate)} (${r.durationDays}d)\n${formatCurrency(r.totalPrice)} · ${r.status}`}
                        className={cn(
                          "absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 overflow-hidden rounded-md px-2 text-xs font-medium shadow-sm",
                          BAR_CLASS[r.status] ?? "bg-secondary text-secondary-foreground",
                          s < 0 && "rounded-l-none",
                          e > windowDays && "rounded-r-none",
                        )}
                        style={{ left: left + 1, width }}
                      >
                        <span className="truncate">{r.customerName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded", BAR_CLASS[l.status])} />
            <span className="text-muted-foreground">{l.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
