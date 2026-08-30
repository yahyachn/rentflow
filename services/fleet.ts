import { prisma } from "@/lib/prisma";
import { destroyImage } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CategoryInput, VehicleInput } from "@/validators/vehicle";

/**
 * Dashboard-side fleet data access. Every function is scoped by `agencyId`
 * (tenant isolation is an application-layer concern here — see
 * lib/tenant.ts / ARCHITECTURE.md). Reads for the public marketing site live
 * in services/vehicles.ts; this module owns the create/update/archive path.
 *
 * Known error strings thrown here (translated to friendly copy in
 * actions/fleet.ts): VEHICLE_NOT_FOUND, CATEGORY_NOT_FOUND,
 * CATEGORY_TYPE_MISMATCH.
 */

type Tx = PrismaClient | Prisma.TransactionClient;

const FLEET_VEHICLE_INCLUDE = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
  pricing: true,
} as const;

export type FleetVehicle = Prisma.VehicleGetPayload<{
  include: typeof FLEET_VEHICLE_INCLUDE;
}>;

/** All of an agency's vehicles (including archived), newest first. */
export function listFleetVehicles(agencyId: string) {
  return prisma.vehicle.findMany({
    where: { agencyId },
    include: FLEET_VEHICLE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/** Categories with a live vehicle count, grouped car-then-moto by name. */
export function listCategories(agencyId: string) {
  return prisma.vehicleCategory.findMany({
    where: { agencyId },
    include: { _count: { select: { vehicles: { where: { deletedAt: null } } } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

// --- helpers ---------------------------------------------------------------

async function uniqueVehicleSlug(
  tx: Tx,
  agencyId: string,
  base: string,
  excludeId?: string,
) {
  const root = base || "vehicle";
  let slug = root;
  let n = 1;
  // Loop until we find a slug not already used by another vehicle in this
  // agency (the DB has a @@unique([agencyId, slug]) to back this up).
  while (
    await tx.vehicle.findFirst({
      where: { agencyId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

async function uniqueCategorySlug(tx: Tx, agencyId: string, base: string, excludeId?: string) {
  const root = base || "category";
  let slug = root;
  let n = 1;
  while (
    await tx.vehicleCategory.findFirst({
      where: { agencyId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

/**
 * Validate that a chosen category belongs to this agency and matches the
 * vehicle's type. Returns the id to store (or null when none was chosen).
 */
async function resolveCategoryId(
  tx: Tx,
  agencyId: string,
  categoryId: string | undefined,
  type: VehicleInput["type"],
): Promise<string | null> {
  if (!categoryId) return null;
  const category = await tx.vehicleCategory.findFirst({
    where: { id: categoryId, agencyId },
    select: { id: true, type: true },
  });
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
  if (category.type !== type) throw new Error("CATEGORY_TYPE_MISMATCH");
  return category.id;
}

/** Map the form's editable fields onto the Prisma column set (no slug — the
 * slug is generated once on create and kept stable so public URLs don't break). */
function vehicleData(input: VehicleInput, categoryId: string | null) {
  return {
    categoryId,
    type: input.type,
    brand: input.brand,
    model: input.model,
    year: input.year,
    transmission: input.transmission,
    fuel: input.fuel,
    seats: input.seats ?? null,
    // Motorcycles don't have doors — never persist a stray value for them.
    doors: input.type === "MOTORCYCLE" ? null : (input.doors ?? null),
    horsepower: input.horsepower ?? null,
    engineSize: input.engineSize ?? null,
    color: input.color ?? null,
    licensePlate: input.licensePlate ?? null,
    mileage: input.mileage ?? null,
    depositAmount: input.depositAmount,
    hasAC: input.hasAC,
    hasBluetooth: input.hasBluetooth,
    hasGPS: input.hasGPS,
    unlimitedKm: input.unlimitedKm,
    insuranceIncluded: input.insuranceIncluded,
    status: input.status,
    featured: input.featured,
    description: input.description ?? null,
  };
}

/** Replace the three "standard" pricing rows (daily/weekly/monthly) for a
 * vehicle, leaving any WEEKEND/HOLIDAY/SEASONAL rows untouched. */
async function replaceStandardPricing(tx: Tx, vehicleId: string, input: VehicleInput) {
  const managed = ["DAILY", "WEEKLY", "MONTHLY"] as const;
  await tx.vehiclePricing.deleteMany({ where: { vehicleId, period: { in: [...managed] } } });

  const rows: Prisma.VehiclePricingCreateManyInput[] = [];
  if (input.dailyPrice != null) rows.push({ vehicleId, period: "DAILY", amount: input.dailyPrice });
  if (input.weeklyPrice != null) rows.push({ vehicleId, period: "WEEKLY", amount: input.weeklyPrice });
  if (input.monthlyPrice != null)
    rows.push({ vehicleId, period: "MONTHLY", amount: input.monthlyPrice });
  if (rows.length) await tx.vehiclePricing.createMany({ data: rows });
}

/**
 * Reconcile a vehicle's gallery to exactly the submitted list: wipe the
 * existing rows and recreate them in order, with position = index and a single
 * cover (the flagged one, or the first as a fallback). Returns the Cloudinary
 * public_ids that were dropped, so the caller can delete those assets *after*
 * the transaction commits (an external call has no place inside a DB tx).
 */
async function replaceVehicleImages(
  tx: Tx,
  vehicleId: string,
  images: VehicleInput["images"],
  alt: string,
): Promise<string[]> {
  const existing = await tx.vehicleImage.findMany({
    where: { vehicleId },
    select: { publicId: true },
  });

  await tx.vehicleImage.deleteMany({ where: { vehicleId } });

  if (images.length > 0) {
    const coverIndex = images.findIndex((img) => img.isCover);
    const cover = coverIndex >= 0 ? coverIndex : 0;
    await tx.vehicleImage.createMany({
      data: images.map((img, i) => ({
        vehicleId,
        url: img.url,
        publicId: img.publicId ?? null,
        alt,
        position: i,
        isCover: i === cover,
      })),
    });
  }

  const keptPublicIds = new Set(
    images.map((img) => img.publicId).filter((id): id is string => Boolean(id)),
  );
  return existing
    .map((e) => e.publicId)
    .filter((id): id is string => Boolean(id) && !keptPublicIds.has(id as string));
}

// --- vehicle mutations -----------------------------------------------------

export async function createVehicle(agencyId: string, input: VehicleInput) {
  return prisma.$transaction(async (tx) => {
    const categoryId = await resolveCategoryId(tx, agencyId, input.categoryId, input.type);
    const slug = await uniqueVehicleSlug(
      tx,
      agencyId,
      slugify(`${input.brand}-${input.model}-${input.year}`),
    );

    const vehicle = await tx.vehicle.create({
      data: { agencyId, slug, ...vehicleData(input, categoryId) },
    });

    await replaceStandardPricing(tx, vehicle.id, input);
    await replaceVehicleImages(tx, vehicle.id, input.images, `${input.brand} ${input.model}`);
    return vehicle;
  });
}

export async function updateVehicle(agencyId: string, id: string, input: VehicleInput) {
  const removedPublicIds = await prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });
    if (!existing) throw new Error("VEHICLE_NOT_FOUND");

    const categoryId = await resolveCategoryId(tx, agencyId, input.categoryId, input.type);

    await tx.vehicle.update({ where: { id }, data: vehicleData(input, categoryId) });
    await replaceStandardPricing(tx, id, input);
    return replaceVehicleImages(tx, id, input.images, `${input.brand} ${input.model}`);
  });

  // Delete now-orphaned Cloudinary assets after the DB write has committed.
  for (const publicId of removedPublicIds) {
    await destroyImage(publicId);
  }
}

/** Soft delete (sets deletedAt) — keeps reservation/audit history intact. */
export async function archiveVehicle(agencyId: string, id: string) {
  const res = await prisma.vehicle.updateMany({
    where: { id, agencyId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) throw new Error("VEHICLE_NOT_FOUND");
}

export async function restoreVehicle(agencyId: string, id: string) {
  const res = await prisma.vehicle.updateMany({
    where: { id, agencyId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (res.count === 0) throw new Error("VEHICLE_NOT_FOUND");
}

// --- category mutations ----------------------------------------------------

export async function createCategory(agencyId: string, input: CategoryInput) {
  const slug = await uniqueCategorySlug(prisma, agencyId, slugify(input.name));
  return prisma.vehicleCategory.create({
    data: {
      agencyId,
      name: input.name,
      slug,
      type: input.type,
      icon: input.icon ?? null,
      description: input.description ?? null,
    },
  });
}

export async function updateCategory(agencyId: string, id: string, input: CategoryInput) {
  const existing = await prisma.vehicleCategory.findFirst({
    where: { id, agencyId },
    select: { id: true },
  });
  if (!existing) throw new Error("CATEGORY_NOT_FOUND");

  return prisma.vehicleCategory.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      icon: input.icon ?? null,
      description: input.description ?? null,
    },
  });
}

/** Hard delete — the FK is onDelete: SetNull, so vehicles keep existing with
 * their categoryId cleared rather than being removed. */
export async function deleteCategory(agencyId: string, id: string) {
  const res = await prisma.vehicleCategory.deleteMany({ where: { id, agencyId } });
  if (res.count === 0) throw new Error("CATEGORY_NOT_FOUND");
}
