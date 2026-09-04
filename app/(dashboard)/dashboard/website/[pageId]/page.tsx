import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { getPageForEdit } from "@/services/website";
import { getVehicles, getVehicleCategories } from "@/services/vehicles";
import { EmptyState } from "@/components/shared/empty-state";
import { PageEditor } from "@/features/website/page-editor";

export const metadata: Metadata = { title: "Edit page" };

export default async function WebsitePageEditor({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const hasAll = user.role == null;
  const canView = hasAll || permissionKeys.includes("website.view");
  const canEdit = hasAll || permissionKeys.includes("website.edit");
  const canPublish = hasAll || permissionKeys.includes("website.publish");

  if (!canView) {
    return <EmptyState icon={Lock} title="No access" description="You don't have permission to view the website." />;
  }

  const { pageId } = await params;
  let page;
  try {
    page = await getPageForEdit(user.agencyId, pageId);
  } catch {
    notFound();
  }
  if (!page) notFound();
  if (!canEdit) redirect("/dashboard/website");

  const [vehicles, categories] = await Promise.all([
    getVehicles(user.agencyId),
    getVehicleCategories(user.agencyId),
  ]);

  return (
    <PageEditor
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        status: page.status,
        publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
        blocks: page.blocks,
      }}
      agency={{
        whatsapp: user.agency.whatsapp,
        phone: user.agency.phone,
        email: user.agency.email,
      }}
      vehicles={vehicles}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      canPublish={canPublish}
    />
  );
}
