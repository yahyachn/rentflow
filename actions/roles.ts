"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser, userHasPermission } from "@/lib/tenant";
import * as roles from "@/services/roles";
import { roleSchema, type RoleInput } from "@/validators/role";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function messageFor(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return "A role with that name already exists.";
  }
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "ROLE_NOT_FOUND":
      return "That role no longer exists.";
    case "SYSTEM_ROLE":
      return "Built-in roles can't be edited or deleted.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireTeamManage() {
  const user = await requireUser();
  if (!(await userHasPermission("team.manage"))) throw new Error("FORBIDDEN");
  return user;
}

function forbiddenOr(err: unknown): ActionResult {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return { ok: false, error: "You don't have permission to manage roles." };
  }
  return { ok: false, error: messageFor(err) };
}

export async function createRoleAction(input: RoleInput): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { name: "Enter a role name (2+ characters)." } };
  }
  try {
    const user = await requireTeamManage();
    await roles.createRole(user.agencyId, parsed.data);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function updateRoleAction(id: string, input: RoleInput): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { name: "Enter a role name (2+ characters)." } };
  }
  try {
    const user = await requireTeamManage();
    await roles.updateRole(user.agencyId, id, parsed.data);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireTeamManage();
    await roles.deleteRole(user.agencyId, id);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}
