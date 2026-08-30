import { headers } from "next/headers";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * Resolve which agency the public marketing site is rendering for.
 *
 * The subdomain is resolved in middleware (`{agency}.rentflow.ma` /
 * `{agency}.localhost`) and passed down as the `x-agency-subdomain` request
 * header. When there's no subdomain (apex, bare localhost, a preview host) we
 * fall back to a single configurable demo agency, so local dev and the demo
 * deployment still have data to render. Cached per request.
 */
export const getMarketingAgency = cache(async () => {
  const subdomain = (await headers()).get("x-agency-subdomain");
  const slug = subdomain ?? process.env.DEMO_AGENCY_SLUG ?? "atlas";
  return prisma.agency.findFirst({ where: { slug, deletedAt: null } });
});
