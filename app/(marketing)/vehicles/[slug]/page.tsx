import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleGridSection } from "@/components/marketing/vehicle-grid-section";
import { ReserveDialog } from "@/features/vehicles/reserve-dialog";
import { formatCurrency } from "@/lib/utils";

const TRANSMISSION_LABEL: Record<string, string> = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
  SEMI_AUTOMATIC: "Semi-automatic",
};

const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
};

const PERIOD_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

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

  const related = await getRelatedVehicles(agency.id, vehicle.id, vehicle.categoryId);
  const cover = vehicle.images.find((i) => i.isCover) ?? vehicle.images[0];
  const gallery = vehicle.images.length > 0 ? vehicle.images : [];
  const dailyPricing = vehicle.pricing.find((p) => p.period === "DAILY");
  const dailyPrice = dailyPricing ? Number(dailyPricing.amount) : null;

  const specs: { label: string; value: string }[] = [
    { label: "Brand", value: vehicle.brand },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: String(vehicle.year) },
    { label: "Transmission", value: TRANSMISSION_LABEL[vehicle.transmission] },
    { label: "Fuel", value: FUEL_LABEL[vehicle.fuel] },
    ...(vehicle.horsepower ? [{ label: "Horsepower", value: `${vehicle.horsepower} hp` }] : []),
    ...(vehicle.engineSize ? [{ label: "Engine", value: vehicle.engineSize }] : []),
    ...(vehicle.seats ? [{ label: "Seats", value: String(vehicle.seats) }] : []),
    ...(vehicle.doors ? [{ label: "Doors", value: String(vehicle.doors) }] : []),
    { label: "Deposit", value: formatCurrency(Number(vehicle.depositAmount)) },
  ];

  const features = [
    vehicle.hasAC && { icon: Wind, label: "Air conditioning" },
    vehicle.hasBluetooth && { icon: Bluetooth, label: "Bluetooth" },
    vehicle.hasGPS && { icon: GpsIcon, label: "GPS included" },
    vehicle.unlimitedKm && { icon: InfinityIcon, label: "Unlimited mileage" },
    vehicle.insuranceIncluded && { icon: ShieldCheck, label: "Insurance included" },
  ].filter(Boolean) as { icon: typeof Wind; label: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="text-muted-foreground text-sm">
              {vehicle.category?.name ?? (vehicle.type === "CAR" ? "Car" : "Motorcycle")} ·{" "}
              {vehicle.year}
            </p>
            <h1 className="font-display text-3xl font-semibold">
              {vehicle.brand} {vehicle.model}
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="relative col-span-4 aspect-video overflow-hidden rounded-xl bg-muted sm:col-span-3">
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
                  className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-full"
                >
                  <Image src={img.url} alt={img.alt ?? vehicle.model} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <Badge key={f.label} variant="outline" className="gap-1.5 py-1.5">
                  <f.icon className="size-3.5" /> {f.label}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-4">
            <SpecIcon icon={Settings2} label={TRANSMISSION_LABEL[vehicle.transmission]} />
            <SpecIcon icon={Fuel} label={FUEL_LABEL[vehicle.fuel]} />
            {vehicle.seats && <SpecIcon icon={Users} label={`${vehicle.seats} seats`} />}
            {vehicle.doors && <SpecIcon icon={DoorOpen} label={`${vehicle.doors} doors`} />}
            {vehicle.mileage != null && (
              <SpecIcon icon={Gauge} label={`${vehicle.mileage.toLocaleString()} km`} />
            )}
          </div>

          {vehicle.description && (
            <div>
              <h2 className="font-display text-lg font-semibold">About this vehicle</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {vehicle.description}
              </p>
            </div>
          )}

          <div>
            <h2 className="font-display text-lg font-semibold">Full specifications</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between border-b py-2 text-sm">
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="space-y-5">
              {vehicle.pricing.length > 0 ? (
                <Tabs defaultValue={vehicle.pricing[0]?.period}>
                  <TabsList className="w-full">
                    {vehicle.pricing.map((p) => (
                      <TabsTrigger key={p.id} value={p.period} className="flex-1">
                        {PERIOD_LABEL[p.period] ?? p.period}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {vehicle.pricing.map((p) => (
                    <TabsContent key={p.id} value={p.period} className="pt-2">
                      <p className="font-display text-3xl font-semibold">
                        {formatCurrency(Number(p.amount))}
                        <span className="text-muted-foreground text-sm font-normal">
                          {" "}
                          / {p.period.toLowerCase()}
                        </span>
                      </p>
                      {p.discountPercent && (
                        <p className="text-success mt-1 text-xs font-medium">
                          Save {Number(p.discountPercent)}% vs daily rate
                        </p>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-muted-foreground text-sm">Contact us for pricing.</p>
              )}

              <ReserveDialog
                vehicleId={vehicle.id}
                vehicleName={`${vehicle.brand} ${vehicle.model}`}
                dailyPrice={dailyPrice}
              />

              <p className="text-muted-foreground text-center text-xs">
                No charge until your reservation is confirmed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <VehicleGridSection title="Related vehicles" vehicles={related} />
    </div>
  );
}

function SpecIcon({ icon: Icon, label }: { icon: typeof Settings2; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon className="text-muted-foreground size-5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
