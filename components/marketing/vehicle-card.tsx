import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Fuel, Gauge, Settings2, Users } from "lucide-react";

import type { PublicVehicle } from "@/services/vehicles";
import { cn, formatCurrency } from "@/lib/utils";

export function VehicleCard({ vehicle, className }: { vehicle: PublicVehicle; className?: string }) {
  const t = useTranslations("vehicleCard");
  const cover = vehicle.images.find((i) => i.isCover) ?? vehicle.images[0];
  const dailyPrice = vehicle.pricing.find((p) => p.period === "DAILY");

  return (
    <div
      className={cn(
        "group glass relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40",
        className,
      )}
    >
      {/* hover gradient border glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:linear-gradient(120deg,color-mix(in_oklch,var(--primary)_50%,transparent),transparent_40%,color-mix(in_oklch,var(--gold)_45%,transparent))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] p-px" />

      <Link
        href={`/vehicles/${vehicle.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-black/30"
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? `${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t("noImage")}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="size-1.5 rounded-full bg-white" /> {t("available")}
        </span>
        {vehicle.featured && (
          <span className="absolute top-3 end-3 inline-flex items-center rounded-full bg-[var(--gold)]/90 px-2.5 py-1 text-[11px] font-semibold text-black backdrop-blur">
            {t("featured")}
          </span>
        )}
      </Link>

      <div className="relative space-y-3 p-5">
        <div>
          <p className="text-muted-foreground text-xs">
            {vehicle.brand} · {vehicle.year}
          </p>
          <Link href={`/vehicles/${vehicle.slug}`}>
            <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-primary">
              {vehicle.model}
            </h3>
          </Link>
        </div>

        <div className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5">
            <Settings2 className="size-3.5 text-primary/70" /> {t(`transmission.${vehicle.transmission}`)}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5 text-primary/70" /> {t(`fuel.${vehicle.fuel}`)}
          </span>
          {vehicle.seats && (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-primary/70" /> {t("seats", { count: vehicle.seats })}
            </span>
          )}
          {vehicle.mileage != null && (
            <span className="flex items-center gap-1.5">
              <Gauge className="size-3.5 text-primary/70" /> {vehicle.mileage.toLocaleString()} km
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            {dailyPrice ? (
              <>
                <span className="font-display text-xl font-semibold text-foreground">
                  {formatCurrency(Number(dailyPrice.amount))}
                </span>
                <span className="text-muted-foreground text-xs"> {t("perDay")}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">{t("contactPricing")}</span>
            )}
          </div>
          <Link
            href={`/vehicles/${vehicle.slug}`}
            className="sheen inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10"
          >
            {t("viewDetails")} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
