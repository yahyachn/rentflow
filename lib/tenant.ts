import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Resolve the signed-in user's session + agency in one place, cached per
 * request (React `cache`) so repeated calls across server components /
 * server actions in the same request don't re-hit the DB.
 *
 * Every data-access function in `services/` should ultimately trace back to
 * a `agencyId` obtained here (or passed explicitly for a public/marketing
 * route that's already resolved the agency from the subdomain) — never a
 * bare, unscoped Prisma query against a tenant table.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } }, agency: true },
  });

  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function userHasPermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user?.role) return false;
  return user.role.permissions.some((rp) => rp.permission.key === permissionKey);
}
