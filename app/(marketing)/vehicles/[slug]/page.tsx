import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  Fuel,
  Gauge,
  Settings2,
  Users,
  DoorOpen,
  Wind,
  Bluetooth,
  Navigation as GpsIcon,
  Infinity as InfinityIcon,
  ShieldCheck,
} from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { getRelatedVehicles, getVehicleBySlug } from "@/services/vehicles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleGridSection } from "@/components/marketing/vehicle-grid-section";
import { ReserveDialog } from "@/features/vehicles/reserve-dialog";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getMarketingAgency();
  if (!agency) return {};
  const vehicle = await getVehicleBySlug(agency.id, slug);
  if (!vehicle) return {};

  return {
    title: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    description: vehicle.description ?? undefined,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const vehicle = await getVehicleBySlug(agency.id, slug);
  if (!vehicle) notFound();

  const [related, t, tCard] = await Promise.all([
    getRelatedVehicles(agency.id, vehicle.id, vehicle.categoryId),
    getTranslations("detail"),
    getTranslations("vehicleCard"),
  ]);

  const cover = vehicle.images.find((i) => i.isCover) ?? vehicle.images[0];
  const gallery = vehicle.images.length > 0 ? vehicle.images : [];
  const dailyPricing = vehicle.pricing.find((p) => p.period === "DAILY");
  const dailyPrice = dailyPricing ? Number(dailyPricing.amount) : null;

  const transLabel = tCard(`transmission.${vehicle.transmission}`);
  const fuelLabel = tCard(`fuel.${vehicle.fuel}`);

  const specs: { label: string; value: string }[] = [
    { label: t("specBrand"), value: vehicle.brand },
    { label: t("specModel"), value: vehicle.model },
    { label: t("specYear"), value: String(vehicle.year) },
    { label: t("specTransmission"), value: transLabel },
    { label: t("specFuel"), value: fuelLabel },
    ...(vehicle.horsepower
      ? [{ label: t("specHorsepower"), value: t("hp", { count: vehicle.horsepower }) }]
      : []),
    ...(vehicle.engineSize ? [{ label: t("specEngine"), value: vehicle.engineSize }] : []),
    ...(vehicle.seats ? [{ label: t("specSeats"), value: String(vehicle.seats) }] : []),
    ...(vehicle.doors ? [{ label: t("specDoors"), value: String(vehicle.doors) }] : []),
    { label: t("specDeposit"), value: formatCurrency(Number(vehicle.depositAmount)) },
  ];

  const features = [
    vehicle.hasAC && { icon: Wind, label: t("featAC") },
    vehicle.hasBluetooth && { icon: Bluetooth, label: t("featBluetooth") },
    vehicle.hasGPS && { icon: GpsIcon, label: t("featGPS") },
    vehicle.unlimitedKm && { icon: InfinityIcon, label: t("featUnlimited") },
    vehicle.insuranceIncluded && { icon: ShieldCheck, label: t("featInsurance") },
  ].filter(Boolean) as { icon: typeof Wind; label: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="text-muted-foreground text-sm">
              {vehicle.category?.name ??
                (vehicle.type === "CAR" ? t("car") : t("motorcycle"))}{" "}
              · {vehicle.year}
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {vehicle.brand} <span className="text-gradient">{vehicle.model}</span>
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="glass relative col-span-4 aspect-video overflow-hidden rounded-2xl sm:col-span-3">
              {cover && (
                <Image
                  src={cover.url}
                  alt={cover.alt ?? vehicle.model}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>
            <div className="col-span-4 flex gap-2 overflow-x-auto sm:col-span-1 sm:flex-col">
              {gallery.slice(0, 4).map((img) => (
                <div
                  key={img.id}
                  className="glass relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl sm:w-full"
                >
                  <Image src={img.url} alt={img.alt ?? vehicle.model} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <span
                  key={f.label}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  <f.icon className="size-3.5 text-[var(--gold)]" /> {f.label}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-6 sm:grid-cols-4">
            <SpecIcon icon={Settings2} label={transLabel} />
            <SpecIcon icon={Fuel} label={fuelLabel} />
            {vehicle.seats && <SpecIcon icon={Users} label={t("seats", { count: vehicle.seats })} />}
            {vehicle.doors && <SpecIcon icon={DoorOpen} label={t("doors", { count: vehicle.doors })} />}
            {vehicle.mileage != null && (
              <SpecIcon icon={Gauge} label={`${vehicle.mileage.toLocaleString()} km`} />
            )}
          </div>

          {vehicle.description && (
            <div>
              <h2 className="font-display text-lg font-semibold">{t("aboutVehicle")}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {vehicle.description}
              </p>
            </div>
          )}

          <div>
            <h2 className="font-display text-lg font-semibold">{t("fullSpecs")}</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex justify-between border-b border-white/10 py-2 text-sm"
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <div className="glass-strong sticky top-24 space-y-5 rounded-2xl p-6">
            {vehicle.pricing.length > 0 ? (
              <Tabs defaultValue={vehicle.pricing[0]?.period}>
                <TabsList className="w-full bg-white/5">
                  {vehicle.pricing.map((p) => (
                    <TabsTrigger key={p.id} value={p.period} className="flex-1">
                      {t(`period${p.period}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {vehicle.pricing.map((p) => (
                  <TabsContent key={p.id} value={p.period} className="pt-2">
                    <p className="font-display text-3xl font-semibold">
                      <span className="text-gradient">{formatCurrency(Number(p.amount))}</span>
                      <span className="text-muted-foreground text-sm font-normal">
                        {" "}
                        {t(`per${p.period}`)}
                      </span>
                    </p>
                    {p.discountPercent && (
                      <p className="mt-1 text-xs font-medium text-emerald-400">
                        {t("save", { percent: Number(p.discountPercent) })}
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="text-muted-foreground text-sm">{t("contactPricing")}</p>
            )}

            <ReserveDialog
              vehicleId={vehicle.id}
              vehicleName={`${vehicle.brand} ${vehicle.model}`}
              dailyPrice={dailyPrice}
            />

            <p className="text-muted-foreground text-center text-xs">{t("noCharge")}</p>
          </div>
        </div>
      </div>

      <VehicleGridSection title={t("related")} vehicles={related} />
    </div>
  );
}

function SpecIcon({ icon: Icon, label }: { icon: typeof Settings2; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon className="text-primary size-5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
