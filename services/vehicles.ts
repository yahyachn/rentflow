import { prisma } from "@/lib/prisma";
import type { Prisma, VehicleType } from "@prisma/client";

const PUBLIC_VEHICLE_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  pricing: true,
  category: true,
} as const;

type RawPublicVehicle = Prisma.VehicleGetPayload<{
  include: typeof PUBLIC_VEHICLE_INCLUDE;
}>;

/**
 * Prisma's `Decimal` (depositAmount, pricing[].amount/discountPercent) isn't
 * a plain object — it can't cross a Server -> Client Component boundary
 * (React throws "Only plain objects can be passed..."). Every public-facing
 * vehicle query below serializes those fields to plain `number` once, here,
 * so `PublicVehicle` is always RSC-safe: fine to pass straight into a Client
 * Component (e.g. the Website Builder's dashboard editor) as well as render
 * server-side (same pattern as services/fleet.ts#toVehicleDTO).
 */
export type PublicVehicle = Omit<RawPublicVehicle, "depositAmount" | "pricing"> & {
  depositAmount: number;
  pricing: (Omit<RawPublicVehicle["pricing"][number], "amount" | "discountPercent"> & {
    amount: number;
    discountPercent: number | null;
  })[];
};

function serialize(v: RawPublicVehicle): PublicVehicle {
  return {
    ...v,
    depositAmount: Number(v.depositAmount),
    pricing: v.pricing.map((p) => ({
      ...p,
      amount: Number(p.amount),
      discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
    })),
  };
}

export async function getFeaturedVehicles(agencyId: string, take = 6): Promise<PublicVehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId, deletedAt: null, status: "AVAILABLE", featured: true },
    include: PUBLIC_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return vehicles.map(serialize);
}

export async function getLatestVehicles(agencyId: string, take = 8): Promise<PublicVehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId, deletedAt: null, status: "AVAILABLE" },
    include: PUBLIC_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return vehicles.map(serialize);
}

export async function getVehicles(
  agencyId: string,
  filters: { type?: VehicleType; categorySlug?: string } = {},
): Promise<PublicVehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
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
  return vehicles.map(serialize);
}

export async function getVehicleBySlug(agencyId: string, slug: string): Promise<PublicVehicle | null> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { agencyId, slug, deletedAt: null },
    include: PUBLIC_VEHICLE_INCLUDE,
  });
  return vehicle ? serialize(vehicle) : null;
}

export async function getRelatedVehicles(
  agencyId: string,
  vehicleId: string,
  categoryId: string | null,
  take = 3,
): Promise<PublicVehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
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
  return vehicles.map(serialize);
}

export async function getVehicleCategories(agencyId: string) {
  return prisma.vehicleCategory.findMany({
    where: { agencyId },
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: "asc" },
  });
}
