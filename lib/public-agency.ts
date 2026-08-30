import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * Resolves which agency the public marketing site is currently rendering
 * for. In production this reads the subdomain (`agencyA.rentflow.ma` ->
 * slug "agencyA") via the request host — that routing layer is real-domain
 * dependent and is intentionally deferred; for local dev and this Phase 1
 * deliverable it falls back to a single configurable demo agency so the
 * marketing pages have real data to render against.
 *
 * TODO(Phase 2+): read `host` from `headers()` in middleware, extract the
 * subdomain, and pass the resolved agency down via a request header instead
 * of this constant lookup.
 */
export const getMarketingAgency = cache(async () => {
  const slug = process.env.DEMO_AGENCY_SLUG ?? "atlas";
  return prisma.agency.findFirst({ where: { slug, deletedAt: null } });
});
