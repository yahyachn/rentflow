import { prisma } from "@/lib/prisma";
import type { RoleInput } from "@/validators/role";

/**
 * Custom roles + permission editing. System roles (Owner/Manager/Employee,
 * seeded per agency) are protected: they can't be edited or deleted here, so
 * the Owner can never be stripped of access.
 *
 * Known error strings (translated in actions/roles.ts): ROLE_NOT_FOUND,
 * SYSTEM_ROLE.
 */

export function listRolesDetailed(agencyId: string) {
  return prisma.role.findMany({
    where: { agencyId },
    include: {
      permissions: { select: { permission: { select: { key: true } } } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function permissionIdsFor(keys: string[]) {
  if (keys.length === 0) return [];
  const perms = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true },
  });
  return perms.map((p) => p.id);
}

export async function createRole(agencyId: string, input: RoleInput) {
  const permIds = await permissionIdsFor(input.permissions);
  return prisma.role.create({
    data: {
      agencyId,
      name: input.name,
      isSystem: false,
      permissions: { create: permIds.map((permissionId) => ({ permissionId })) },
    },
  });
}

export async function updateRole(agencyId: string, id: string, input: RoleInput) {
  const role = await prisma.role.findFirst({
    where: { id, agencyId },
    select: { id: true, isSystem: true },
  });
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.isSystem) throw new Error("SYSTEM_ROLE");

  const permIds = await permissionIdsFor(input.permissions);
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.role.update({
      where: { id },
      data: {
        name: input.name,
        permissions: { create: permIds.map((permissionId) => ({ permissionId })) },
      },
    }),
  ]);
}

export async function deleteRole(agencyId: string, id: string) {
  const role = await prisma.role.findFirst({
    where: { id, agencyId },
    select: { id: true, isSystem: true },
  });
  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.isSystem) throw new Error("SYSTEM_ROLE");
  // Users holding this role have their roleId set null (schema onDelete: SetNull).
  await prisma.role.delete({ where: { id } });
}
