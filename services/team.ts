import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@prisma/client";

/**
 * Team / staff management within an agency. Guards protect against locking the
 * agency out of itself:
 *   - you can't change your own role or status (another owner must),
 *   - the last active Owner can't be demoted or suspended.
 *
 * Known error strings (translated in actions/team.ts): MEMBER_NOT_FOUND,
 * ROLE_NOT_FOUND, SELF_MODIFY, LAST_OWNER.
 */

export function listTeam(agencyId: string) {
  return prisma.user.findMany({
    where: { agencyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      role: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function listRoles(agencyId: string) {
  return prisma.role.findMany({
    where: { agencyId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
}

async function isLastActiveOwner(agencyId: string, userId: string) {
  const owner = await prisma.user.findFirst({
    where: { id: userId, agencyId },
    select: { role: { select: { name: true } }, status: true },
  });
  if (owner?.role?.name !== "Owner") return false;
  const activeOwners = await prisma.user.count({
    where: {
      agencyId,
      deletedAt: null,
      status: "ACTIVE",
      role: { name: "Owner" },
    },
  });
  return activeOwners <= 1;
}

export async function assignRole(
  agencyId: string,
  actingUserId: string,
  userId: string,
  roleId: string,
) {
  if (userId === actingUserId) throw new Error("SELF_MODIFY");

  const [member, role] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, agencyId, deletedAt: null },
      select: { id: true, role: { select: { name: true } } },
    }),
    prisma.role.findFirst({ where: { id: roleId, agencyId }, select: { id: true, name: true } }),
  ]);
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  if (!role) throw new Error("ROLE_NOT_FOUND");

  // Demoting the only Owner would leave the agency ownerless.
  if (member.role?.name === "Owner" && role.name !== "Owner") {
    if (await isLastActiveOwner(agencyId, userId)) throw new Error("LAST_OWNER");
  }

  await prisma.user.update({ where: { id: userId }, data: { roleId } });
}

export async function setMemberStatus(
  agencyId: string,
  actingUserId: string,
  userId: string,
  status: UserStatus,
) {
  if (userId === actingUserId) throw new Error("SELF_MODIFY");

  const member = await prisma.user.findFirst({
    where: { id: userId, agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!member) throw new Error("MEMBER_NOT_FOUND");

  if (status !== "ACTIVE" && (await isLastActiveOwner(agencyId, userId))) {
    throw new Error("LAST_OWNER");
  }

  await prisma.user.update({ where: { id: userId }, data: { status } });
}
