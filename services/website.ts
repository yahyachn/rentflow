import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type Block,
  createBlock,
  emptyLocalizedText,
  pageBlocksSchema,
} from "@/validators/website-blocks";
import type { CreatePageInput, UpdatePageMetaInput } from "@/validators/website";

/**
 * Website Builder data access — every function is tenant-scoped by
 * `agencyId`. `draftBlocks`/`publishedBlocks` are stored as Prisma `Json` but
 * NEVER handed to a caller un-validated: every read re-parses them through
 * `pageBlocksSchema` (see `parseBlocks`) so a hand-edited row, a future
 * schema change, or a bug elsewhere can never smuggle unvalidated JSON into a
 * rendered page. An invalid/legacy row degrades to an empty block list rather
 * than throwing, so one bad row can't 500 the whole dashboard or site.
 *
 * Known error strings (translated in actions/website.ts):
 *   WEBSITE_NOT_FOUND, PAGE_NOT_FOUND, SLUG_TAKEN, CANNOT_DELETE_HOME.
 */

const MAX_VERSIONS_KEPT = 10;

function parseBlocks(raw: Prisma.JsonValue | null): Block[] {
  if (raw == null) return [];
  const result = pageBlocksSchema.safeParse(raw);
  if (!result.success) {
    console.warn("website: invalid blocks JSON, degrading to empty page", result.error.message);
    return [];
  }
  return result.data;
}

function defaultHomeBlocks(): Block[] {
  const hero = createBlock("hero");
  const featured = createBlock("vehicleGrid");
  const reviews = createBlock("reviews");
  const cta = createBlock("cta");
  if (hero.type === "hero") {
    hero.title = { fr: "Trouvez votre véhicule idéal", ar: "ابحث عن سيارتك المثالية", en: "Find your ideal vehicle" };
    hero.subtitle = {
      fr: "Réservez en quelques clics parmi notre flotte de véhicules récents.",
      ar: "احجز خلال ثوانٍ من أسطولنا من المركبات الحديثة.",
      en: "Book in a few clicks from our fleet of recent vehicles.",
    };
    hero.primaryButton = {
      label: { fr: "Voir les véhicules", ar: "عرض المركبات", en: "View vehicles" },
      link: { kind: "vehicles" },
      style: "primary",
    };
  }
  if (featured.type === "vehicleGrid") {
    featured.title = { fr: "Véhicules en vedette", ar: "مركبات مميزة", en: "Featured vehicles" };
    featured.source = "featured";
    featured.limit = 6;
  }
  if (reviews.type === "reviews") {
    reviews.title = { fr: "Ce que disent nos clients", ar: "آراء عملائنا", en: "What our customers say" };
  }
  if (cta.type === "cta") {
    cta.title = { fr: "Prêt à prendre la route ?", ar: "جاهز للانطلاق؟", en: "Ready to hit the road?" };
    cta.button = {
      label: { fr: "Réserver maintenant", ar: "احجز الآن", en: "Book now" },
      link: { kind: "vehicles" },
      style: "primary",
    };
  }
  return [hero, featured, reviews, cta];
}

export type WebsitePageSummary = {
  id: string;
  slug: string;
  title: string;
  isHome: boolean;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: Date;
  publishedAt: Date | null;
};

/** Get the agency's Website row, creating it (+ a draft Home page seeded to
 * approximate the current default look) on first access. Idempotent — safe
 * to call every time the dashboard's Website section is opened. */
export async function getOrCreateWebsite(agencyId: string) {
  const existing = await prisma.website.findUnique({ where: { agencyId } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    // Guard against a race between two concurrent first-visits.
    const again = await tx.website.findUnique({ where: { agencyId } });
    if (again) return again;

    const website = await tx.website.create({ data: { agencyId } });
    await tx.websitePage.create({
      data: {
        agencyId,
        websiteId: website.id,
        slug: "",
        title: "Home",
        isHome: true,
        status: "DRAFT",
        draftBlocks: defaultHomeBlocks() as unknown as Prisma.InputJsonValue,
      },
    });
    return website;
  });
}

export async function listPages(agencyId: string): Promise<WebsitePageSummary[]> {
  const pages = await prisma.websitePage.findMany({
    where: { agencyId, deletedAt: null },
    orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, title: true, isHome: true, status: true, updatedAt: true, publishedAt: true },
  });
  return pages;
}

export async function getPageForEdit(agencyId: string, pageId: string) {
  const page = await prisma.websitePage.findFirst({
    where: { id: pageId, agencyId, deletedAt: null },
  });
  if (!page) throw new Error("PAGE_NOT_FOUND");
  return { ...page, blocks: parseBlocks(page.draftBlocks) };
}

export async function createPage(agencyId: string, input: CreatePageInput) {
  const website = await getOrCreateWebsite(agencyId);
  const existing = await prisma.websitePage.findFirst({
    where: { agencyId, slug: input.slug, deletedAt: null },
    select: { id: true },
  });
  if (existing) throw new Error("SLUG_TAKEN");

  return prisma.websitePage.create({
    data: {
      agencyId,
      websiteId: website.id,
      slug: input.slug,
      title: input.title,
      isHome: false,
      status: "DRAFT",
      draftBlocks: [] as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function updatePageMeta(agencyId: string, pageId: string, input: UpdatePageMetaInput) {
  const page = await prisma.websitePage.findFirst({ where: { id: pageId, agencyId, deletedAt: null } });
  if (!page) throw new Error("PAGE_NOT_FOUND");
  return prisma.websitePage.update({
    where: { id: pageId },
    data: {
      title: input.title,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    },
  });
}

/** Autosave — writes the draft only. Validated defensively even though the
 * action layer already validated the same input (belt and suspenders: this
 * is the last line of defense before untrusted-shaped JSON hits the DB). */
export async function updatePageBlocks(agencyId: string, pageId: string, blocks: Block[]) {
  const page = await prisma.websitePage.findFirst({
    where: { id: pageId, agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!page) throw new Error("PAGE_NOT_FOUND");
  const validated = pageBlocksSchema.parse(blocks);
  await prisma.websitePage.update({
    where: { id: pageId },
    data: { draftBlocks: validated as unknown as Prisma.InputJsonValue },
  });
}

/** Publish: draft -> published (visible on the public site immediately),
 * plus a version snapshot, pruned to the last MAX_VERSIONS_KEPT. */
export async function publishPage(agencyId: string, pageId: string) {
  await prisma.$transaction(async (tx) => {
    const page = await tx.websitePage.findFirst({
      where: { id: pageId, agencyId, deletedAt: null },
      select: { id: true, draftBlocks: true },
    });
    if (!page) throw new Error("PAGE_NOT_FOUND");

    await tx.websitePage.update({
      where: { id: pageId },
      data: {
        publishedBlocks: page.draftBlocks as Prisma.InputJsonValue,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await tx.websitePageVersion.create({
      data: {
        pageId,
        blocks: page.draftBlocks as Prisma.InputJsonValue,
        label: new Date().toISOString(),
      },
    });

    const stale = await tx.websitePageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
      skip: MAX_VERSIONS_KEPT,
      select: { id: true },
    });
    if (stale.length > 0) {
      await tx.websitePageVersion.deleteMany({ where: { id: { in: stale.map((v) => v.id) } } });
    }
  });
}

export async function deletePage(agencyId: string, pageId: string) {
  const page = await prisma.websitePage.findFirst({ where: { id: pageId, agencyId, deletedAt: null } });
  if (!page) throw new Error("PAGE_NOT_FOUND");
  if (page.isHome) throw new Error("CANNOT_DELETE_HOME");
  await prisma.websitePage.update({ where: { id: pageId }, data: { deletedAt: new Date() } });
}

export async function listPageVersions(agencyId: string, pageId: string) {
  const page = await prisma.websitePage.findFirst({
    where: { id: pageId, agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!page) throw new Error("PAGE_NOT_FOUND");
  return prisma.websitePageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true },
  });
}

export async function restorePageVersion(agencyId: string, pageId: string, versionId: string) {
  const version = await prisma.websitePageVersion.findFirst({
    where: { id: versionId, page: { id: pageId, agencyId, deletedAt: null } },
    select: { blocks: true },
  });
  if (!version) throw new Error("PAGE_NOT_FOUND");
  const validated = pageBlocksSchema.parse(parseBlocks(version.blocks));
  await prisma.websitePage.update({
    where: { id: pageId },
    data: { draftBlocks: validated as unknown as Prisma.InputJsonValue },
  });
}

// --- public site reads -------------------------------------------------------

/** Published Home page blocks for the public site, or `null` if the agency
 * has no Website yet, or its Home page has never been published — the caller
 * (app/(marketing)/page.tsx) falls back to the original hardcoded homepage
 * in either case, so existing agencies are never affected by this feature
 * until they explicitly publish. */
export async function getPublishedHomeBlocks(agencyId: string): Promise<Block[] | null> {
  const page = await prisma.websitePage.findFirst({
    where: { agencyId, isHome: true, status: "PUBLISHED", deletedAt: null },
    select: { publishedBlocks: true },
  });
  if (!page?.publishedBlocks) return null;
  return parseBlocks(page.publishedBlocks);
}

/** Published, non-home pages for the public navbar — see
 * components/marketing/navbar.tsx, which appends these after the fixed
 * links (Home/Vehicles/About/FAQ/Contact). Draft pages never appear here:
 * the navbar should never link somewhere a visitor would 404. */
export async function listPublishedPagesForNav(agencyId: string): Promise<{ slug: string; title: string }[]> {
  return prisma.websitePage.findMany({
    where: { agencyId, isHome: false, status: "PUBLISHED", deletedAt: null },
    select: { slug: true, title: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPublishedPageBySlug(agencyId: string, slug: string) {
  const page = await prisma.websitePage.findFirst({
    where: { agencyId, slug, status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, seoTitle: true, seoDescription: true, publishedBlocks: true },
  });
  if (!page) return null;
  return { ...page, blocks: parseBlocks(page.publishedBlocks) };
}

export { emptyLocalizedText };
