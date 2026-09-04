import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getMarketingAgency } from "@/lib/public-agency";
import { getPublishedPageBySlug } from "@/services/website";
import { isLocale } from "@/i18n/config";
import { PublicPageRenderer } from "@/components/website/public-page-renderer";

/**
 * Renders a custom Website Builder page (anything other than the home page —
 * see app/(marketing)/page.tsx for that one) at its published slug, e.g.
 * `/services` or `/services/airport-transfer`. Next.js always prefers a
 * static route (`/about`, `/vehicles`, ...) over this catch-all when both
 * could match, so the built-in marketing pages are never shadowed —
 * validators/website.ts also rejects creating a custom page with one of
 * those reserved slugs in the first place.
 */

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getMarketingAgency();
  if (!agency) return {};
  const page = await getPublishedPageBySlug(agency.id, slug.join("/"));
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function CustomWebsitePage({ params }: Props) {
  const { slug } = await params;
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const page = await getPublishedPageBySlug(agency.id, slug.join("/"));
  if (!page) notFound();

  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "fr";

  return <PublicPageRenderer blocks={page.blocks} agency={agency} locale={locale} />;
}
