import Image from "next/image";
import { ArrowDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/config";
import type { HeroBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { BuilderButton } from "@/components/website/blocks/builder-button";
import { Reveal } from "@/components/marketing/reveal";
import type { LinkAgencyContact } from "@/components/website/link-target";

const TRUST_KEYS = ["cancellation", "airportDelivery", "insurance", "noFees", "support"] as const;

/** Same curated fallback as the default hero (components/marketing/hero.tsx)
 * — used when this block's own `imageUrl` (editable per-block, per-page from
 * the inspector) hasn't been set yet. */
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=2400&q=80";

/**
 * Builder-editable Hero — full-bleed photo-with-dark-overlay band (see
 * components/marketing/hero.tsx, which this mirrors visually). Title/
 * subtitle/buttons/image are agency content, editable from the block
 * inspector; the trust badges row reuses the same fixed, translated copy as
 * the default hero (hero.trust.* in messages/*.json) — not yet a per-item
 * CMS field, kept simple on purpose.
 */
export function HeroBlockView({
  block,
  agency,
  locale,
}: {
  block: HeroBlock;
  agency: LinkAgencyContact;
  locale: Locale;
}) {
  const t = useTranslations("hero");
  const eyebrow = pickText(block.eyebrow, locale);
  const title = pickText(block.title, locale);
  const subtitle = pickText(block.subtitle, locale);

  return (
    <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden text-white">
      <div className="absolute inset-0 -z-20 bg-[oklch(0.1_0.02_264)]">
        <Image
          src={block.imageUrl || DEFAULT_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.06_0.01_264)] via-[oklch(0.08_0.015_264)/78%] to-[oklch(0.1_0.02_264)/60%]" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:py-28 lg:px-6">
        <Reveal>
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90 uppercase backdrop-blur-md">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
              </span>
              {eyebrow}
            </span>
          )}
          {title && (
            <h1 className="font-display mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mx-auto mt-6 max-w-xl text-base text-balance text-white/75 sm:text-lg">{subtitle}</p>
          )}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BuilderButton button={block.primaryButton} agency={agency} locale={locale} />
            <BuilderButton button={block.secondaryButton} agency={agency} locale={locale} />
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-medium text-white/65 sm:text-[13px]">
            {TRUST_KEYS.map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-[var(--gold)]" />
                {t(`trust.${key}`)}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-7 hidden justify-center sm:flex">
        <div className="animate-float flex flex-col items-center gap-1.5 text-white/50">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase">{t("scroll")}</span>
          <ArrowDown className="size-4" />
        </div>
      </div>
    </section>
  );
}
