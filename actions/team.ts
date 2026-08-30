"use server";

import { revalidatePath } from "next/cache";
import type { UserStatus } from "@prisma/client";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { assignRole, setMemberStatus } from "@/services/team";

export type ActionResult = { ok: true } | { ok: false; error: string };

function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "MEMBER_NOT_FOUND":
      return "That team member no longer exists.";
    case "ROLE_NOT_FOUND":
      return "That role no longer exists.";
    case "SELF_MODIFY":
      return "You can't change your own role or status — ask another owner.";
    case "LAST_OWNER":
      return "You can't demote or suspend the last active owner.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireTeamManage() {
  const user = await requireUser();
  if (!(await userHasPermission("team.manage"))) throw new Error("FORBIDDEN");
  return user;
}

export async function assignRoleAction(userId: string, roleId: string): Promise<ActionResult> {
  try {
    const user = await requireTeamManage();
    await assignRole(user.agencyId, user.id, userId, roleId);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the team." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function setMemberStatusAction(
  userId: string,
  status: UserStatus,
): Promise<ActionResult> {
  try {
    const user = await requireTeamManage();
    await setMemberStatus(user.agencyId, user.id, userId, status);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage the team." };
    }
    return { ok: false, error: messageFor(err) };
  }
}
