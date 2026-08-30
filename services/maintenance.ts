import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { MaintenanceInput } from "@/validators/maintenance";

/**
 * Vehicle maintenance / service records. Agency-scoped.
 * Known error strings (translated in actions/maintenance.ts):
 * MAINTENANCE_NOT_FOUND, VEHICLE_NOT_FOUND.
 */

const INCLUDE = {
  vehicle: { select: { id: true, brand: true, model: true, year: true } },
} as const;

export type MaintenanceRow = Prisma.MaintenanceGetPayload<{ include: typeof INCLUDE }>;

export function listMaintenance(agencyId: string) {
  return prisma.maintenance.findMany({
    where: { agencyId },
    include: INCLUDE,
    orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
  });
}

function toDate(v: string | undefined) {
  return v ? new Date(v) : null;
}

function data(input: MaintenanceInput) {
  return {
    type: input.type,
    status: input.status,
    title: input.title,
    description: input.description ?? null,
    scheduledDate: toDate(input.scheduledDate),
    completedDate: toDate(input.completedDate),
    cost: input.cost ?? null,
    mileageAt: input.mileageAt ?? null,
    notes: input.notes ?? null,
  };
}

async function assertVehicle(agencyId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, agencyId },
    select: { id: true },
  });
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
}

export async function createMaintenance(agencyId: string, input: MaintenanceInput) {
  await assertVehicle(agencyId, input.vehicleId);
  return prisma.maintenance.create({
    data: { agencyId, vehicleId: input.vehicleId, ...data(input) },
  });
}

export async function updateMaintenance(agencyId: string, id: string, input: MaintenanceInput) {
  const existing = await prisma.maintenance.findFirst({
    where: { id, agencyId },
    select: { id: true },
  });
  if (!existing) throw new Error("MAINTENANCE_NOT_FOUND");
  await assertVehicle(agencyId, input.vehicleId);
  return prisma.maintenance.update({
    where: { id },
    data: { vehicleId: input.vehicleId, ...data(input) },
  });
}

export async function deleteMaintenance(agencyId: string, id: string) {
  const res = await prisma.maintenance.deleteMany({ where: { id, agencyId } });
  if (res.count === 0) throw new Error("MAINTENANCE_NOT_FOUND");
}
