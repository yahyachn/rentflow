"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { updateAgencyProfile } from "@/services/agency";
import { agencyProfileSchema, type AgencyProfileInput } from "@/validators/settings";

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

export async function updateAgencyProfileAction(
  input: AgencyProfileInput,
): Promise<ActionResult> {
  const parsed = agencyProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireUser();
    if (!(await userHasPermission("settings.manage"))) {
      return { ok: false, error: "You don't have permission to edit agency settings." };
    }
    await updateAgencyProfile(user.agencyId, parsed.data);
    // The agency name shows in the sidebar/topbar, so refresh the whole shell.
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
