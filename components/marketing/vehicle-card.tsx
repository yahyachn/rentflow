import Image from "next/image";
import Link from "next/link";
import { Fuel, Gauge, Settings2, Users } from "lucide-react";

import type { PublicVehicle } from "@/services/vehicles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

const TRANSMISSION_LABEL: Record<string, string> = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
  SEMI_AUTOMATIC: "Semi-auto",
};

const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
};

export function VehicleCard({ vehicle, className }: { vehicle: PublicVehicle; className?: string }) {
  const cover = vehicle.images.find((i) => i.isCover) ?? vehicle.images[0];
  const dailyPrice = vehicle.pricing.find((p) => p.period === "DAILY");

  return (
    <Card className={cn("group overflow-hidden py-0", className)}>
      <Link href={`/vehicles/${vehicle.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? `${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No image
          </div>
        )}
        <Badge className="absolute top-3 left-3" variant="success">
          Available
        </Badge>
        {vehicle.featured && (
          <Badge className="absolute top-3 right-3" variant="secondary">
            Featured
          </Badge>
        )}
      </Link>

      <CardContent className="space-y-3 pt-4">
        <div>
          <p className="text-muted-foreground text-xs">
            {vehicle.brand} · {vehicle.year}
          </p>
          <Link href={`/vehicles/${vehicle.slug}`} className="hover:underline">
            <h3 className="font-display font-semibold">{vehicle.model}</h3>
          </Link>
        </div>

        <div className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <Settings2 className="size-3.5" /> {TRANSMISSION_LABEL[vehicle.transmission]}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5" /> {FUEL_LABEL[vehicle.fuel]}
          </span>
          {vehicle.seats && (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {vehicle.seats} seats
            </span>
          )}
          {vehicle.mileage != null && (
            <span className="flex items-center gap-1.5">
              <Gauge className="size-3.5" /> {vehicle.mileage.toLocaleString()} km
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-1 flex items-center justify-between border-t py-4">
        <div>
          {dailyPrice ? (
            <>
              <span className="font-display text-lg font-semibold">
                {formatCurrency(Number(dailyPrice.amount))}
              </span>
              <span className="text-muted-foreground text-xs"> / day</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Contact for pricing</span>
          )}
        </div>
        <Button asChild size="sm">
          <Link href={`/vehicles/${vehicle.slug}`}>View details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
