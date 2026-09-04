import type { Prisma, PrismaClient } from "@prisma/client";

import { ROLE_PRESETS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { AgencyProfileInput } from "@/validators/settings";
import type { BrandColorsInput } from "@/validators/website";

type Tx = PrismaClient | Prisma.TransactionClient;

/**
 * Create the three system roles (Owner / Manager / Employee) for a freshly
 * created agency and wire each to its preset list of permissions from the
 * global `Permission` catalog. Permissions must already be seeded
 * (see prisma/seed.ts) — this looks them up by key, it never creates them.
 */
export async function provisionAgencyRoles(tx: Tx, agencyId: string) {
  const allPermissions = await tx.permission.findMany();
  const byKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  const roles: Record<string, string> = {};

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PRESETS)) {
    const role = await tx.role.create({
      data: {
        agencyId,
        name: roleName,
        isSystem: true,
        description:
          roleName === "Owner"
            ? "Full access to every part of the agency's account."
            : roleName === "Manager"
              ? "Day-to-day operations: fleet, reservations, customers, analytics."
              : "Front-desk operations: reservations and customers.",
      },
    });

    const permissionIds = permissionKeys
      .map((key) => byKey.get(key))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      });
    }

    roles[roleName] = role.id;
  }

  return roles;
}

/**
 * Create a new tenant: the Agency row, its default roles/permissions, and a
 * Settings singleton. Returns the created agency and the Owner role id, so
 * the caller (the registration server action) can create the first User
 * with that role. Runs inside the given transaction client so it either
 * fully succeeds or fully rolls back alongside the Better Auth user create.
 */
export async function provisionAgency(
  tx: Tx,
  input: { name: string; email: string },
) {
  const baseSlug = slugify(input.name) || "agency";
  let slug = baseSlug;
  let attempt = 1;
  while (await tx.agency.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const agency = await tx.agency.create({
    data: {
      name: input.name,
      slug,
      email: input.email,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await tx.settings.create({ data: { agencyId: agency.id } });

  const roles = await provisionAgencyRoles(tx, agency.id);

  return { agency, ownerRoleId: roles["Owner"] };
}

/** Update the agency's editable profile fields (Settings screen). */
export function updateAgencyProfile(agencyId: string, input: AgencyProfileInput) {
  return prisma.agency.update({
    where: { id: agencyId },
    data: {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
    },
  });
}

/** Website > Theme tab — the public site's brand colors (see lib/theme-agency.ts
 * for where these get applied). */
export function updateAgencyBrandColors(agencyId: string, input: BrandColorsInput) {
  return prisma.agency.update({
    where: { id: agencyId },
    data: { primaryColor: input.primaryColor, accentColor: input.accentColor },
  });
}
