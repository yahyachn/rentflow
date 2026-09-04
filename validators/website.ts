import { z } from "zod";

/**
 * Page-level (not block-level — see validators/website-blocks.ts) Website
 * Builder schemas: creating/renaming a page, and per-page/site SEO fields.
 */

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

/** Routes already served by their own static page (app/(marketing)/<name>) —
 * a custom page with one of these slugs would be permanently unreachable
 * (Next.js always prefers the static route over the [...slug] catch-all that
 * serves custom pages), so it's rejected here rather than silently 404ing. */
const RESERVED_SLUGS = new Set(["vehicles", "about", "contact", "faq", "privacy", "terms", "login", "register", "invoice", "api"]);

/** Lowercase URL segment: letters, digits, hyphens, optional "/" nesting
 * ("services/airport-transfer"). Never empty — the home page uses the
 * reserved slug "" internally but isn't created through this schema. */
const pageSlugSchema = z
  .string()
  .min(1, "Required")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
    "Lowercase letters, numbers, and hyphens only",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug.split("/")[0]), {
    message: "That URL is reserved by the site — pick a different one.",
  });

export const createPageSchema = z.object({
  title: z.string().min(1, "Required").max(120),
  slug: pageSlugSchema,
});
export type CreatePageInput = z.infer<typeof createPageSchema>;

export const updatePageMetaSchema = z.object({
  title: z.string().min(1, "Required").max(120),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});
export type UpdatePageMetaInput = z.infer<typeof updatePageMetaSchema>;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color, e.g. #2563EB");

/** Website > Theme tab — colors live on Agency (primaryColor/accentColor),
 * not on the Website row, so the dashboard has one place to look for brand
 * color regardless of whether a Website has been customized yet. */
export const brandColorsSchema = z.object({
  primaryColor: hexColor,
  accentColor: hexColor,
});
export type BrandColorsInput = z.infer<typeof brandColorsSchema>;
