"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { logActivity } from "@/services/activity";
import { updateAgencyBrandColors } from "@/services/agency";
import * as website from "@/services/website";
import { pageBlocksSchema, type Block } from "@/validators/website-blocks";
import {
  brandColorsSchema,
  createPageSchema,
  updatePageMetaSchema,
  type BrandColorsInput,
  type CreatePageInput,
  type UpdatePageMetaInput,
} from "@/validators/website";

/**
 * Thin Server Action boundary for the Website Builder — same shape as
 * actions/fleet.ts: authenticate, check permission, validate with Zod,
 * delegate to services/website.ts, revalidate. Never touches Prisma directly.
 */

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "UNAUTHENTICATED":
      return "Your session has expired — please sign in again.";
    case "FORBIDDEN":
      return "You don't have permission to do that.";
    case "PAGE_NOT_FOUND":
      return "That page no longer exists.";
    case "SLUG_TAKEN":
      return "That URL is already used by another page.";
    case "CANNOT_DELETE_HOME":
      return "The home page can't be deleted.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireWebsiteEdit() {
  const user = await requireUser();
  if (!(await userHasPermission("website.edit"))) throw new Error("FORBIDDEN");
  return user;
}

async function requireWebsitePublish() {
  const user = await requireUser();
  if (!(await userHasPermission("website.publish"))) throw new Error("FORBIDDEN");
  return user;
}

function revalidatePublicSite() {
  // Every published-page slug maps 1:1 to a public route; the home page is "/".
  revalidatePath("/", "layout");
}

export async function getOrCreateWebsiteAction() {
  const user = await requireUser();
  if (!(await userHasPermission("website.view"))) throw new Error("FORBIDDEN");
  return website.getOrCreateWebsite(user.agencyId);
}

export async function createPageAction(input: CreatePageInput): Promise<ActionResult> {
  const parsed = createPageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };
  try {
    const user = await requireWebsiteEdit();
    const page = await website.createPage(user.agencyId, parsed.data);
    await logActivity(user.agencyId, user.id, "website.page.created", "WebsitePage", page.id, page.title);
    revalidatePath("/dashboard/website");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

export async function updatePageMetaAction(
  pageId: string,
  input: UpdatePageMetaInput,
): Promise<ActionResult> {
  const parsed = updatePageMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };
  try {
    const user = await requireWebsiteEdit();
    await website.updatePageMeta(user.agencyId, pageId, parsed.data);
    revalidatePath(`/dashboard/website/${pageId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

/** Autosave endpoint — called on a debounce from the editor, so this one
 * deliberately does NOT write an ActivityLog entry (would flood it). */
export async function saveDraftBlocksAction(pageId: string, blocks: Block[]): Promise<ActionResult> {
  const parsed = pageBlocksSchema.safeParse(blocks);
  if (!parsed.success) return { ok: false, error: "Invalid section data." };
  try {
    const user = await requireWebsiteEdit();
    await website.updatePageBlocks(user.agencyId, pageId, parsed.data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

export async function publishPageAction(pageId: string): Promise<ActionResult> {
  try {
    const user = await requireWebsitePublish();
    await website.publishPage(user.agencyId, pageId);
    await logActivity(user.agencyId, user.id, "website.page.published", "WebsitePage", pageId);
    revalidatePath("/dashboard/website");
    revalidatePath(`/dashboard/website/${pageId}`);
    revalidatePublicSite();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

export async function deletePageAction(pageId: string): Promise<ActionResult> {
  try {
    const user = await requireWebsiteEdit();
    await website.deletePage(user.agencyId, pageId);
    await logActivity(user.agencyId, user.id, "website.page.deleted", "WebsitePage", pageId);
    revalidatePath("/dashboard/website");
    revalidatePublicSite();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

export async function updateBrandColorsAction(input: BrandColorsInput): Promise<ActionResult> {
  const parsed = brandColorsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };
  try {
    const user = await requireWebsiteEdit();
    await updateAgencyBrandColors(user.agencyId, parsed.data);
    await logActivity(user.agencyId, user.id, "website.theme.changed", "Agency", user.agencyId);
    revalidatePath("/dashboard/website");
    revalidatePublicSite();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}

export async function restorePageVersionAction(pageId: string, versionId: string): Promise<ActionResult> {
  try {
    const user = await requireWebsiteEdit();
    await website.restorePageVersion(user.agencyId, pageId, versionId);
    revalidatePath(`/dashboard/website/${pageId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err) };
  }
}
