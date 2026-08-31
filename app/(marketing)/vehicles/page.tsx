import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CarFront } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { getVehicleCategories, getVehicles } from "@/services/vehicles";
import { VehicleCard } from "@/components/marketing/vehicle-card";
import { Reveal } from "@/components/marketing/reveal";
import { EmptyState } from "@/components/shared/empty-state";
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

  const [vehicles, categories, t, tc, th] = await Promise.all([
    getVehicles(agency.id, { type: vehicleType, categorySlug: category }),
    getVehicleCategories(agency.id),
    getTranslations("vehiclesPage"),
    getTranslations("common"),
    getTranslations("hero"),
  ]);

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: tc("all"), href: "/vehicles", active: !type && !category },
    { label: th("cars"), href: "/vehicles?type=CAR", active: type === "CAR" },
    { label: th("motorcycles"), href: "/vehicles?type=MOTORCYCLE", active: type === "MOTORCYCLE" },
    ...categories.map((c) => ({
      label: c.name,
      href: `/vehicles?category=${c.slug}`,
      active: category === c.slug,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
      <Reveal className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          <span className="text-gradient">{t("title")}</span>
        </h1>
        <p className="text-muted-foreground mt-3">{t("subtitle", { count: vehicles.length })}</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              f.active
                ? "glow-primary bg-gradient-to-r from-primary to-[var(--gold)] text-primary-foreground"
                : "glass text-foreground/80 hover:text-foreground hover:-translate-y-0.5",
            )}
          >
            {f.label}
          </Link>
        ))}
      </Reveal>

      {vehicles.length === 0 ? (
        <div className="mt-12">
          <EmptyState icon={CarFront} title={t("noMatchTitle")} description={t("noMatchDesc")} />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle, i) => (
            <Reveal key={vehicle.id} delay={Math.min(i * 0.05, 0.3)}>
              <VehicleCard vehicle={vehicle} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
