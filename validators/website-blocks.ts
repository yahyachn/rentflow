import { z } from "zod";

/**
 * Zod schemas for the Website Builder's block tree. This is the single
 * source of truth every read/write of `WebsitePage.draftBlocks` /
 * `publishedBlocks` must pass through — never `JSON.parse(...) as any`.
 *
 * Shared between:
 *   - services/website.ts (validates before every DB write, and re-validates
 *     on read so a hand-edited or legacy row can never reach a component
 *     un-checked — see `pageBlocksSchema.safeParse` there)
 *   - features/website/* (the dashboard editor)
 *   - components/website/* (the public renderer)
 *
 * Extending the builder with a new block type: add one schema below, add it
 * to `blockSchema`'s union, add a default factory case in `createBlock`, then
 * register a view + inspector in components/website/block-registry.tsx.
 * Nothing else needs to change.
 */

// --- shared primitives ------------------------------------------------------

/** Short editable copy (titles, labels, CTAs) in the site's three locales. */
export const localizedTextSchema = z.object({
  fr: z.string().max(300).default(""),
  ar: z.string().max(300).default(""),
  en: z.string().max(300).default(""),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Longer plain-text copy (paragraphs, descriptions). Deliberately plain text,
 * never HTML — it's rendered as text nodes, so there's nothing to sanitize
 * and no XSS surface. A rich-text (bold/links/lists) editor is future work. */
export const localizedRichTextSchema = z.object({
  fr: z.string().max(5000).default(""),
  ar: z.string().max(5000).default(""),
  en: z.string().max(5000).default(""),
});
export type LocalizedRichText = z.infer<typeof localizedRichTextSchema>;

export function emptyLocalizedText(): LocalizedText {
  return { fr: "", ar: "", en: "" };
}

/** Where a button/link can point. Deliberately closed — no "javascript:" or
 * arbitrary HTML, no raw href field. */
export const linkTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("page"), slug: z.string().max(120) }),
  z.object({ kind: z.literal("vehicles") }),
  z.object({ kind: z.literal("vehicle"), slug: z.string().max(160) }),
  z.object({ kind: z.literal("category"), slug: z.string().max(160) }),
  z.object({ kind: z.literal("contact") }),
  z.object({ kind: z.literal("whatsapp") }),
  z.object({ kind: z.literal("phone") }),
  z.object({ kind: z.literal("email") }),
  z.object({ kind: z.literal("anchor"), id: z.string().max(80) }),
  z.object({ kind: z.literal("external"), url: z.string().url().max(500) }),
]);
export type LinkTarget = z.infer<typeof linkTargetSchema>;

export const defaultLinkTarget: LinkTarget = { kind: "none" };

export const buttonSchema = z.object({
  label: localizedTextSchema,
  link: linkTargetSchema,
  style: z.enum(["primary", "secondary", "outline", "ghost"]).default("primary"),
});
export type ButtonConfig = z.infer<typeof buttonSchema>;

function defaultButton(): ButtonConfig {
  return { label: emptyLocalizedText(), link: defaultLinkTarget, style: "primary" };
}

export const spacingScale = z.enum(["none", "sm", "md", "lg", "xl"]);
export type SpacingScale = z.infer<typeof spacingScale>;

/** Fields every block carries, regardless of type. */
const blockBase = {
  id: z.string().min(1),
  hidden: z.boolean().default(false),
  hideOnMobile: z.boolean().default(false),
};

// --- block schemas -----------------------------------------------------------

export const heroBlockSchema = z.object({
  type: z.literal("hero"),
  ...blockBase,
  eyebrow: localizedTextSchema.default(emptyLocalizedText),
  title: localizedTextSchema.default(emptyLocalizedText),
  subtitle: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
  primaryButton: buttonSchema.default(defaultButton),
  secondaryButton: buttonSchema.default(defaultButton),
  imageUrl: z.string().url().max(500).nullable().default(null),
});
export type HeroBlock = z.infer<typeof heroBlockSchema>;

export const richTextBlockSchema = z.object({
  type: z.literal("richText"),
  ...blockBase,
  heading: localizedTextSchema.default(emptyLocalizedText),
  body: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
  alignment: z.enum(["start", "center"]).default("start"),
});
export type RichTextBlock = z.infer<typeof richTextBlockSchema>;

export const imageBlockSchema = z.object({
  type: z.literal("image"),
  ...blockBase,
  imageUrl: z.string().url().max(500).nullable().default(null),
  alt: localizedTextSchema.default(emptyLocalizedText),
  caption: localizedTextSchema.default(emptyLocalizedText),
});
export type ImageBlock = z.infer<typeof imageBlockSchema>;

export const ctaBlockSchema = z.object({
  type: z.literal("cta"),
  ...blockBase,
  title: localizedTextSchema.default(emptyLocalizedText),
  subtitle: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
  button: buttonSchema.default(defaultButton),
});
export type CtaBlock = z.infer<typeof ctaBlockSchema>;

export const vehicleGridBlockSchema = z.object({
  type: z.literal("vehicleGrid"),
  ...blockBase,
  title: localizedTextSchema.default(emptyLocalizedText),
  subtitle: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
  source: z.enum(["featured", "latest", "all"]).default("featured"),
  vehicleType: z.enum(["ALL", "CAR", "MOTORCYCLE"]).default("ALL"),
  categoryIds: z.array(z.string()).max(20).default([]),
  limit: z.coerce.number().int().min(1).max(24).default(6),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  showViewAllButton: z.boolean().default(true),
});
export type VehicleGridBlock = z.infer<typeof vehicleGridBlockSchema>;

export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: localizedTextSchema.default(emptyLocalizedText),
  answer: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

export const faqBlockSchema = z.object({
  type: z.literal("faq"),
  ...blockBase,
  title: localizedTextSchema.default(emptyLocalizedText),
  items: z.array(faqItemSchema).max(30).default([]),
});
export type FaqBlock = z.infer<typeof faqBlockSchema>;

export const reviewsBlockSchema = z.object({
  type: z.literal("reviews"),
  ...blockBase,
  title: localizedTextSchema.default(emptyLocalizedText),
  limit: z.coerce.number().int().min(1).max(12).default(6),
});
export type ReviewsBlock = z.infer<typeof reviewsBlockSchema>;

export const spacerBlockSchema = z.object({
  type: z.literal("spacer"),
  ...blockBase,
  height: spacingScale.default("md"),
});
export type SpacerBlock = z.infer<typeof spacerBlockSchema>;

export const STAT_ICONS = ["car", "users", "headset", "award", "clock", "shield"] as const;
export type StatIcon = (typeof STAT_ICONS)[number];

export const statItemSchema = z.object({
  id: z.string().min(1),
  /** Short freeform value, e.g. "150+", "24/7" — not a number field on
   * purpose, so agencies can express "24/7" or "5000+" equally naturally. */
  value: z.string().max(20).default(""),
  label: localizedTextSchema.default(emptyLocalizedText),
  icon: z.enum(STAT_ICONS).default("car"),
});
export type StatItem = z.infer<typeof statItemSchema>;

export const statsBlockSchema = z.object({
  type: z.literal("stats"),
  ...blockBase,
  title: localizedTextSchema.default(emptyLocalizedText),
  subtitle: localizedRichTextSchema.default({ fr: "", ar: "", en: "" }),
  items: z.array(statItemSchema).max(6).default([]),
});
export type StatsBlock = z.infer<typeof statsBlockSchema>;

export const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  ctaBlockSchema,
  vehicleGridBlockSchema,
  faqBlockSchema,
  reviewsBlockSchema,
  spacerBlockSchema,
  statsBlockSchema,
]);
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const BLOCK_TYPES = [
  "hero",
  "richText",
  "image",
  "cta",
  "vehicleGrid",
  "faq",
  "reviews",
  "spacer",
  "stats",
] as const satisfies readonly BlockType[];

export const pageBlocksSchema = z.array(blockSchema).max(60);

/** Random-enough id for a client-created block/FAQ item — collision risk is
 * irrelevant here (ids are scoped to one page's JSON array, never a DB key). */
export function newBlockId() {
  return `b_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** A blank starting point for each block type, used by the "Add section" menu. */
export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "hero":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        eyebrow: emptyLocalizedText(),
        title: emptyLocalizedText(),
        subtitle: { fr: "", ar: "", en: "" },
        primaryButton: defaultButton(),
        secondaryButton: { ...defaultButton(), style: "outline" },
        imageUrl: null,
      };
    case "richText":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        heading: emptyLocalizedText(),
        body: { fr: "", ar: "", en: "" },
        alignment: "start",
      };
    case "image":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        imageUrl: null,
        alt: emptyLocalizedText(),
        caption: emptyLocalizedText(),
      };
    case "cta":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        title: emptyLocalizedText(),
        subtitle: { fr: "", ar: "", en: "" },
        button: defaultButton(),
      };
    case "vehicleGrid":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        title: emptyLocalizedText(),
        subtitle: { fr: "", ar: "", en: "" },
        source: "featured",
        vehicleType: "ALL",
        categoryIds: [],
        limit: 6,
        sort: "newest",
        showViewAllButton: true,
      };
    case "faq":
      return { type, id, hidden: false, hideOnMobile: false, title: emptyLocalizedText(), items: [] };
    case "reviews":
      return { type, id, hidden: false, hideOnMobile: false, title: emptyLocalizedText(), limit: 6 };
    case "spacer":
      return { type, id, hidden: false, hideOnMobile: false, height: "md" };
    case "stats":
      return {
        type,
        id,
        hidden: false,
        hideOnMobile: false,
        title: emptyLocalizedText(),
        subtitle: { fr: "", ar: "", en: "" },
        items: [
          { id: newBlockId(), value: "150+", label: emptyLocalizedText(), icon: "car" },
          { id: newBlockId(), value: "5000+", label: emptyLocalizedText(), icon: "users" },
          { id: newBlockId(), value: "24/7", label: emptyLocalizedText(), icon: "headset" },
          { id: newBlockId(), value: "10+", label: emptyLocalizedText(), icon: "award" },
        ],
      };
  }
}

// --- global sections (Website.navigation / Website.footer) -----------------

export const navigationItemSchema: z.ZodType<{
  id: string;
  label: LocalizedText;
  link: LinkTarget;
  children?: Array<{ id: string; label: LocalizedText; link: LinkTarget }>;
}> = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  link: linkTargetSchema,
  children: z
    .array(
      z.object({
        id: z.string().min(1),
        label: localizedTextSchema,
        link: linkTargetSchema,
      }),
    )
    .max(10)
    .optional(),
});
export type NavigationItem = z.infer<typeof navigationItemSchema>;
export const navigationSchema = z.array(navigationItemSchema).max(12);

export const footerConfigSchema = z.object({
  tagline: localizedTextSchema.default(emptyLocalizedText),
});
export type FooterConfig = z.infer<typeof footerConfigSchema>;
