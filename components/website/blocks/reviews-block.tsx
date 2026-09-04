import type { Locale } from "@/i18n/config";
import type { ReviewsBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { ReviewsSection } from "@/components/marketing/reviews-section";

/** Thin wrapper around the existing marketing ReviewsSection — real,
 * published reviews only (no fabricated testimonials), same as the default
 * site. Only reachable from the public renderer (it reads the DB), not the
 * dashboard editor's live preview — see components/website/editor's
 * preview, which shows a placeholder for this block type instead. */
export async function ReviewsBlockView({
  block,
  agencyId,
  locale,
}: {
  block: ReviewsBlock;
  agencyId: string;
  locale: Locale;
}) {
  const title = pickText(block.title, locale);
  return <ReviewsSection agencyId={agencyId} title={title || undefined} limit={block.limit} />;
}
