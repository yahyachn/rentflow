import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * This product is single-tenant: there is exactly one `Agency` row. Cached
 * per request (React `cache()`) so repeated calls across the marketing
 * layout + page in the same request don't re-hit the DB.
 */
export const getMarketingAgency = cache(async () => {
  return prisma.agency.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
});
