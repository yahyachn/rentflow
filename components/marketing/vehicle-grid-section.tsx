import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { PublicVehicle } from "@/services/vehicles";
import { VehicleCard } from "@/components/marketing/vehicle-card";
import { Button } from "@/components/ui/button";

export function VehicleGridSection({
  title,
  description,
  vehicles,
  viewAllHref,
}: {
  title: string;
  description?: string;
  vehicles: PublicVehicle[];
  viewAllHref?: string;
}) {
  if (vehicles.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
        {viewAllHref && (
          <Button asChild variant="ghost">
            <Link href={viewAllHref}>
              View all <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </section>
  );
}
