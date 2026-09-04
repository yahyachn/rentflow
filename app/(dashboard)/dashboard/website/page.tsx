import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { getOrCreateWebsite, listPages } from "@/services/website";
import { EmptyState } from "@/components/shared/empty-state";
import { WebsiteOverview } from "@/features/website/website-overview";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const hasAll = user.role == null;
  const canView = hasAll || permissionKeys.includes("website.view");
  const canEdit = hasAll || permissionKeys.includes("website.edit");
  const canPublish = hasAll || permissionKeys.includes("website.publish");
  const t = await getTranslations("web");

  if (!canView) {
    return (
      <EmptyState icon={Lock} title={t("noAccessTitle")} description={t("noAccessDesc")} />
    );
  }

  // Lazily provisions the Website + a draft Home page on first visit — see
  // services/website.ts#getOrCreateWebsite. Never affects the public site
  // until a page is explicitly published.
  await getOrCreateWebsite(user.agencyId);
  const pages = await listPages(user.agencyId);

  return (
    <WebsiteOverview
      pages={pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        isHome: p.isHome,
        status: p.status,
        updatedAt: p.updatedAt.toISOString(),
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      }))}
      agency={{ primaryColor: user.agency.primaryColor, accentColor: user.agency.accentColor }}
      canEdit={canEdit}
      canPublish={canPublish}
    />
  );
}
