import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import type { PublicVehicle } from "@/services/vehicles";
import { VehicleCard } from "@/components/marketing/vehicle-card";
import { Reveal } from "@/components/marketing/reveal";

export function VehicleGridSection({
  title,
  description,
  vehicles,
  viewAllHref,
}: {
  title?: string;
  description?: string;
  vehicles: PublicVehicle[];
  viewAllHref?: string;
}) {
  const tc = useTranslations("common");
  if (vehicles.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {title && (
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          )}
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
          >
            {tc("viewAll")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
          </Link>
        )}
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle, i) => (
          <Reveal key={vehicle.id} delay={i * 0.06}>
            <VehicleCard vehicle={vehicle} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
