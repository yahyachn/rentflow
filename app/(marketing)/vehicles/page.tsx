import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CarFront } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { getVehicleCategories, getVehicles } from "@/services/vehicles";
import { VehicleCard } from "@/components/marketing/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VehicleType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Browse our full fleet of cars and motorcycles available for rent.",
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string }>;
}) {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const { type, category } = await searchParams;
  const vehicleType = type === "CAR" || type === "MOTORCYCLE" ? (type as VehicleType) : undefined;

  const [vehicles, categories] = await Promise.all([
    getVehicles(agency.id, { type: vehicleType, categorySlug: category }),
    getVehicleCategories(agency.id),
  ]);

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/vehicles", active: !type && !category },
    { label: "Cars", href: "/vehicles?type=CAR", active: type === "CAR" },
    { label: "Motorcycles", href: "/vehicles?type=MOTORCYCLE", active: type === "MOTORCYCLE" },
    ...categories.map((c) => ({
      label: c.name,
      href: `/vehicles?category=${c.slug}`,
      active: category === c.slug,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Our fleet</h1>
        <p className="text-muted-foreground mt-2">
          {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} available right now.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link key={f.href} href={f.href}>
            <Badge
              variant={f.active ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5", !f.active && "hover:bg-muted")}
            >
              {f.label}
            </Badge>
          </Link>
        ))}
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={CarFront}
            title="No vehicles match this filter"
            description="Try a different category, or view the full fleet."
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
