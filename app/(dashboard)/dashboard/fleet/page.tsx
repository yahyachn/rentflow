import type { Metadata } from "next";
import { Car, Lock, Wrench } from "lucide-react";

import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/tenant";
import { listCategories, listFleetVehicles, type FleetVehicle } from "@/services/fleet";
import { listMaintenance } from "@/services/maintenance";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FleetView } from "@/features/fleet/fleet-view";
import type { CategoryDTO, VehicleDTO } from "@/features/fleet/types";
import { MaintenanceView } from "@/features/maintenance/maintenance-view";
import type { MaintenanceDTO } from "@/features/maintenance/types";

export const metadata: Metadata = { title: "Fleet" };

/** Convert a Prisma vehicle (with Decimals + relations) into a plain,
 * serializable DTO for the client table. */
function toVehicleDTO(v: FleetVehicle): VehicleDTO {
  const amountFor = (period: "DAILY" | "WEEKLY" | "MONTHLY") => {
    const row = v.pricing.find((p) => p.period === period);
    return row ? Number(row.amount) : null;
  };
  const cover = v.images.find((i) => i.isCover) ?? v.images[0];

  return {
    images: v.images.map((img) => ({
      url: img.url,
      publicId: img.publicId,
      isCover: img.isCover,
    })),
    id: v.id,
    slug: v.slug,
    type: v.type,
    brand: v.brand,
    model: v.model,
    year: v.year,
    categoryId: v.categoryId,
    categoryName: v.category?.name ?? null,
    transmission: v.transmission,
    fuel: v.fuel,
    seats: v.seats,
    doors: v.doors,
    horsepower: v.horsepower,
    engineSize: v.engineSize,
    color: v.color,
    licensePlate: v.licensePlate,
    mileage: v.mileage,
    depositAmount: Number(v.depositAmount),
    hasAC: v.hasAC,
    hasBluetooth: v.hasBluetooth,
    hasGPS: v.hasGPS,
    unlimitedKm: v.unlimitedKm,
    insuranceIncluded: v.insuranceIncluded,
    status: v.status,
    featured: v.featured,
    description: v.description,
    dailyPrice: amountFor("DAILY"),
    weeklyPrice: amountFor("WEEKLY"),
    monthlyPrice: amountFor("MONTHLY"),
    coverImageUrl: cover?.url ?? null,
    archived: v.deletedAt != null,
  };
}

export default async function FleetPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the layout already redirects unauthenticated users

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canView = user.role == null || permissionKeys.includes("fleet.view");
  const canManage = user.role == null || permissionKeys.includes("fleet.manage");

  if (!canView) {
    return (
      <div className="space-y-6">
        <FleetHeader />
        <EmptyState
          icon={Lock}
          title="You don't have access to the fleet"
          description="Ask an owner or manager to grant you the “View fleet” permission."
        />
      </div>
    );
  }

  const [vehicles, categories, maintenance] = await Promise.all([
    listFleetVehicles(user.agencyId),
    listCategories(user.agencyId),
    listMaintenance(user.agencyId),
  ]);

  const vehicleDTOs = vehicles.map(toVehicleDTO);
  const categoryDTOs: CategoryDTO[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type,
    icon: c.icon,
    description: c.description,
    vehicleCount: c._count.vehicles,
  }));

  const maintenanceDTOs: MaintenanceDTO[] = maintenance.map((m) => ({
    id: m.id,
    vehicleId: m.vehicleId,
    vehicleLabel: `${m.vehicle.brand} ${m.vehicle.model} (${m.vehicle.year})`,
    type: m.type,
    status: m.status,
    title: m.title,
    description: m.description,
    scheduledDate: m.scheduledDate ? m.scheduledDate.toISOString() : null,
    completedDate: m.completedDate ? m.completedDate.toISOString() : null,
    cost: m.cost != null ? Number(m.cost) : null,
    mileageAt: m.mileageAt,
    notes: m.notes,
  }));
  const vehiclePicks = vehicleDTOs
    .filter((v) => !v.archived)
    .map((v) => ({ id: v.id, label: `${v.brand} ${v.model} (${v.year})` }));

  return (
    <div className="space-y-6">
      <FleetHeader />
      <Tabs defaultValue="vehicles" className="gap-4">
        <TabsList>
          <TabsTrigger value="vehicles">
            <Car /> Vehicles
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench /> Maintenance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <FleetView
            vehicles={vehicleDTOs}
            categories={categoryDTOs}
            canManage={canManage}
            cloudinaryConfigured={isCloudinaryConfigured()}
          />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceView records={maintenanceDTOs} vehicles={vehiclePicks} canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FleetHeader() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Fleet</h1>
      <p className="text-muted-foreground text-sm">
        Manage your cars and motorcycles, categories, and pricing.
      </p>
    </div>
  );
}
