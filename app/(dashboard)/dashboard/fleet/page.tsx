import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/tenant";
import { listCategories, listFleetVehicles, type FleetVehicle } from "@/services/fleet";
import { EmptyState } from "@/components/shared/empty-state";
import { FleetView } from "@/features/fleet/fleet-view";
import type { CategoryDTO, VehicleDTO } from "@/features/fleet/types";

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

  const [vehicles, categories] = await Promise.all([
    listFleetVehicles(user.agencyId),
    listCategories(user.agencyId),
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

  return (
    <div className="space-y-6">
      <FleetHeader />
      <FleetView
        vehicles={vehicleDTOs}
        categories={categoryDTOs}
        canManage={canManage}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
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
