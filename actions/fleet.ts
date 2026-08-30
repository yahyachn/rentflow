"use server";

import { revalidatePath } from "next/cache";

import { isCloudinaryConfigured, signUpload, type UploadSignature } from "@/lib/cloudinary";
import { requireUser, userHasPermission } from "@/lib/tenant";
import { logActivity } from "@/services/activity";
import * as fleet from "@/services/fleet";
import {
  categorySchema,
  vehicleSchema,
  type CategoryInput,
  type VehicleInput,
} from "@/validators/vehicle";

/**
 * Thin Server Action boundary for fleet management: authenticate, check the
 * `fleet.manage` permission, validate with a Zod schema, delegate to
 * services/fleet.ts, then revalidate the affected routes. Business logic and
 * Prisma live in the service, not here (see ARCHITECTURE.md).
 */

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

/** Translate the service layer's known error strings into user-facing copy. */
function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "UNAUTHENTICATED":
      return "Your session has expired — please sign in again.";
    case "VEHICLE_NOT_FOUND":
      return "That vehicle no longer exists.";
    case "CATEGORY_NOT_FOUND":
      return "That category no longer exists.";
    case "CATEGORY_TYPE_MISMATCH":
      return "The selected category doesn't match the vehicle type.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireFleetManage() {
  const user = await requireUser();
  if (!(await userHasPermission("fleet.manage"))) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Revalidate every page whose content depends on the fleet. */
function revalidateFleet() {
  revalidatePath("/dashboard/fleet");
  revalidatePath("/dashboard");
  // Marketing site renders live vehicle data.
  revalidatePath("/vehicles");
  revalidatePath("/");
}

// --- image uploads ---------------------------------------------------------

export type SignatureResult =
  | { ok: true; data: UploadSignature }
  | { ok: false; error: string };

/**
 * Mint a short-lived signature so the browser can upload a vehicle image
 * directly to Cloudinary. Requires `fleet.manage`; the upload is scoped to a
 * per-agency folder so tenants never share an asset namespace.
 */
export async function getUploadSignatureAction(): Promise<SignatureResult> {
  try {
    const user = await requireFleetManage();
    if (!isCloudinaryConfigured()) {
      return {
        ok: false,
        error: "Image uploads aren't configured yet. Add your Cloudinary keys to .env.",
      };
    }
    return { ok: true, data: signUpload(`rentflow/${user.agencyId}/vehicles`) };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to upload images." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

// --- vehicles --------------------------------------------------------------

export async function createVehicleAction(input: VehicleInput): Promise<ActionResult> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireFleetManage();
    await fleet.createVehicle(user.agencyId, parsed.data);
    await logActivity(
      user.agencyId,
      user.id,
      "vehicle.created",
      "Vehicle",
      null,
      `${parsed.data.brand} ${parsed.data.model}`,
    );
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function updateVehicleAction(
  id: string,
  input: VehicleInput,
): Promise<ActionResult> {
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireFleetManage();
    await fleet.updateVehicle(user.agencyId, id, parsed.data);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function archiveVehicleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireFleetManage();
    await fleet.archiveVehicle(user.agencyId, id);
    await logActivity(user.agencyId, user.id, "vehicle.archived", "Vehicle", id);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function restoreVehicleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireFleetManage();
    await fleet.restoreVehicle(user.agencyId, id);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

// --- categories ------------------------------------------------------------

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireFleetManage();
    await fleet.createCategory(user.agencyId, parsed.data);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireFleetManage();
    await fleet.updateCategory(user.agencyId, id, parsed.data);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireFleetManage();
    await fleet.deleteCategory(user.agencyId, id);
    revalidateFleet();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the fleet." };
    }
    return { ok: false, error: messageFor(err) };
  }
}
