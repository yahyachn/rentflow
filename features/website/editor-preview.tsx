"use client";

import { useLocale, useTranslations } from "next-intl";
import { MessageSquareQuote } from "lucide-react";

import { isLocale } from "@/i18n/config";
import type { Block } from "@/validators/website-blocks";
import type { PublicVehicle } from "@/services/vehicles";
import type { LinkAgencyContact } from "@/components/website/link-target";
import { HeroBlockView } from "@/components/website/blocks/hero-block";
import { RichTextBlockView } from "@/components/website/blocks/rich-text-block";
import { ImageBlockView } from "@/components/website/blocks/image-block";
import { CtaBlockView } from "@/components/website/blocks/cta-block";
import { VehicleGridBlockView } from "@/components/website/blocks/vehicle-grid-block";
import { FaqBlockView } from "@/components/website/blocks/faq-block";
import { SpacerBlockView } from "@/components/website/blocks/spacer-block";
import { StatsBlockView } from "@/components/website/blocks/stats-block";
import { cn } from "@/lib/utils";

/**
 * Client-side live preview: the same pure `*BlockView` components the public
 * site renders (see components/website/public-page-renderer.tsx), fed the
 * editor's in-memory (unsaved) block list instead of a server fetch. The one
 * exception is `reviews`, which reads the DB in the public renderer — here it
 * shows a static placeholder card since a client component can't do that
 * server-side read against unsaved state.
 */
export function EditorPreview({
  blocks,
  agency,
  vehicles,
  selectedId,
  onSelect,
}: {
  blocks: Block[];
  agency: LinkAgencyContact;
  vehicles: PublicVehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "fr";
  const t = useTranslations("web");

  return (
    <div className="space-y-0">
      {blocks.map((block) => {
        if (block.hidden) return null;
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onSelect(block.id)}
            className={cn(
              "block w-full text-start outline-none",
              "ring-inset transition-shadow",
              block.id === selectedId ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/40",
            )}
          >
            {renderBlock(block, agency, vehicles, locale, t)}
          </button>
        );
      })}
      {blocks.length === 0 && (
        <p className="text-muted-foreground p-10 text-center text-sm">{t("emptyPage")}</p>
      )}
    </div>
  );
}

function renderBlock(
  block: Block,
  agency: LinkAgencyContact,
  vehicles: PublicVehicle[],
  locale: "fr" | "ar" | "en",
  t: ReturnType<typeof useTranslations>,
) {
  switch (block.type) {
    case "hero":
      return <HeroBlockView block={block} agency={agency} locale={locale} />;
    case "richText":
      return <RichTextBlockView block={block} locale={locale} />;
    case "image":
      return <ImageBlockView block={block} locale={locale} />;
    case "cta":
      return <CtaBlockView block={block} agency={agency} locale={locale} />;
    case "vehicleGrid":
      return <VehicleGridBlockView block={block} vehicles={vehicles} locale={locale} />;
    case "faq":
      return <FaqBlockView block={block} locale={locale} />;
    case "spacer":
      return <SpacerBlockView block={block} />;
    case "stats":
      return <StatsBlockView block={block} locale={locale} />;
    case "reviews":
      return (
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-16 text-center">
          <MessageSquareQuote className="text-muted-foreground size-6" />
          <p className="text-muted-foreground text-sm">{t("reviewsPreviewNote")}</p>
        </div>
      );
    default:
      return null;
  }
}
