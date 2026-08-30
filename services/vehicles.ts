import { prisma } from "@/lib/prisma";
import type { Prisma, VehicleType } from "@prisma/client";

const PUBLIC_VEHICLE_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  pricing: true,
  category: true,
} as const;

export type PublicVehicle = Prisma.VehicleGetPayload<{
  include: typeof PUBLIC_VEHICLE_INCLUDE;
}>;

export async function getFeaturedVehicles(agencyId: string, take = 6) {
  return prisma.vehicle.findMany({
    where: { agencyId, deletedAt: null, status: "AVAILABLE", featured: true },
    include: PUBLIC_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getLatestVehicles(agencyId: string, take = 8) {
  return prisma.vehicle.findMany({
    where: { agencyId, deletedAt: null, status: "AVAILABLE" },
    include: PUBLIC_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getVehicles(
  agencyId: string,
  filters: { type?: VehicleType; categorySlug?: string } = {},
) {
  return prisma.vehicle.findMany({
    where: {
      agencyId,
      deletedAt: null,
      status: "AVAILABLE",
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    },
    include: PUBLIC_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getVehicleBySlug(agencyId: string, slug: string) {
  return prisma.vehicle.findFirst({
    where: { agencyId, slug, deletedAt: null },
    include: PUBLIC_VEHICLE_INCLUDE,
  });
}

export async function getRelatedVehicles(agencyId: string, vehicleId: string, categoryId: string | null, take = 3) {
  return prisma.vehicle.findMany({
    where: {
      agencyId,
      deletedAt: null,
      status: "AVAILABLE",
      id: { not: vehicleId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: PUBLIC_VEHICLE_INCLUDE,
    take,
  });
}

export async function getVehicleCategories(agencyId: string) {
  return prisma.vehicleCategory.findMany({
    where: { agencyId },
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: "asc" },
  });
}
