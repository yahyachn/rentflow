import type { Agency } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import type { Block } from "@/validators/website-blocks";
import { getVehicles, type PublicVehicle } from "@/services/vehicles";
import { HeroBlockView } from "@/components/website/blocks/hero-block";
import { RichTextBlockView } from "@/components/website/blocks/rich-text-block";
import { ImageBlockView } from "@/components/website/blocks/image-block";
import { CtaBlockView } from "@/components/website/blocks/cta-block";
import { VehicleGridBlockView } from "@/components/website/blocks/vehicle-grid-block";
import { FaqBlockView } from "@/components/website/blocks/faq-block";
import { ReviewsBlockView } from "@/components/website/blocks/reviews-block";
import { SpacerBlockView } from "@/components/website/blocks/spacer-block";
import { StatsBlockView } from "@/components/website/blocks/stats-block";

/**
 * Public site's block dispatcher — registry-driven (no if/else chain). Fetches
 * the agency's vehicle list once (not once per `vehicleGrid` block) since a
 * page can have more than one such block.
 */
export async function PublicPageRenderer({
  blocks,
  agency,
  locale,
}: {
  blocks: Block[];
  agency: Agency;
  locale: Locale;
}) {
  const needsVehicles = blocks.some((b) => b.type === "vehicleGrid" && !b.hidden);
  const vehicles: PublicVehicle[] = needsVehicles ? await getVehicles(agency.id) : [];

  return (
    <>
      {blocks.map((block) => {
        if (block.hidden) return null;
        switch (block.type) {
          case "hero":
            return <HeroBlockView key={block.id} block={block} agency={agency} locale={locale} />;
          case "richText":
            return <RichTextBlockView key={block.id} block={block} locale={locale} />;
          case "image":
            return <ImageBlockView key={block.id} block={block} locale={locale} />;
          case "cta":
            return <CtaBlockView key={block.id} block={block} agency={agency} locale={locale} />;
          case "vehicleGrid":
            return <VehicleGridBlockView key={block.id} block={block} vehicles={vehicles} locale={locale} />;
          case "faq":
            return <FaqBlockView key={block.id} block={block} locale={locale} />;
          case "reviews":
            return <ReviewsBlockView key={block.id} block={block} agencyId={agency.id} locale={locale} />;
          case "spacer":
            return <SpacerBlockView key={block.id} block={block} />;
          case "stats":
            return <StatsBlockView key={block.id} block={block} locale={locale} />;
          default:
            return null;
        }
      })}
    </>
  );
}
