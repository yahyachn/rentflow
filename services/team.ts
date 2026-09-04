import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@prisma/client";
import type { CreateTeamMemberInput } from "@/validators/team";

/**
 * Team / staff management within an agency. Guards protect against locking the
 * agency out of itself:
 *   - you can't change your own role or status (another owner must),
 *   - the last active Owner can't be demoted or suspended.
 *
 * Known error strings (translated in actions/team.ts): MEMBER_NOT_FOUND,
 * ROLE_NOT_FOUND, SELF_MODIFY, LAST_OWNER, EMAIL_TAKEN.
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

/**
 * Create a new dashboard login directly (no email verification step, no
 * Better Auth `signUpEmail` call — that would set session cookies on the
 * *caller's* (the Owner's) response via the `nextCookies()` plugin and swap
 * out their active session). Hashes the password and writes User + Account
 * exactly like `prisma/seed.ts` does for the initial owner account, so the
 * new teammate can sign in immediately with the password the Owner set.
 */
export async function createTeamMember(agencyId: string, input: CreateTeamMemberInput) {
  const role = await prisma.role.findFirst({ where: { id: input.roleId, agencyId }, select: { id: true } });
  if (!role) throw new Error("ROLE_NOT_FOUND");

  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        agencyId,
        roleId: input.roleId,
        name: input.name,
        email: input.email,
        emailVerified: true,
        status: "ACTIVE",
      },
    });
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        issuer: "local:credential",
        password: passwordHash,
      },
    });
    return user;
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
