"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import * as maintenance from "@/services/maintenance";
import { maintenanceSchema, type MaintenanceInput } from "@/validators/maintenance";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFrom(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "VEHICLE_NOT_FOUND":
      return "That vehicle no longer exists.";
    case "MAINTENANCE_NOT_FOUND":
      return "That maintenance record no longer exists.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireFleetManage() {
  const user = await requireUser();
  if (!(await userHasPermission("fleet.manage"))) throw new Error("FORBIDDEN");
  return user;
}

function forbiddenOr(err: unknown): ActionResult {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return { ok: false, error: "You don't have permission to manage the fleet." };
  }
  return { ok: false, error: messageFor(err) };
}

export async function createMaintenanceAction(input: MaintenanceInput): Promise<ActionResult> {
  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const user = await requireFleetManage();
    await maintenance.createMaintenance(user.agencyId, parsed.data);
    revalidatePath("/dashboard/fleet");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function updateMaintenanceAction(
  id: string,
  input: MaintenanceInput,
): Promise<ActionResult> {
  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const user = await requireFleetManage();
    await maintenance.updateMaintenance(user.agencyId, id, parsed.data);
    revalidatePath("/dashboard/fleet");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function deleteMaintenanceAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireFleetManage();
    await maintenance.deleteMaintenance(user.agencyId, id);
    revalidatePath("/dashboard/fleet");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}
