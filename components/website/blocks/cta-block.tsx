import type { Locale } from "@/i18n/config";
import type { CtaBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { BuilderButton } from "@/components/website/blocks/builder-button";
import { Reveal } from "@/components/marketing/reveal";
import type { LinkAgencyContact } from "@/components/website/link-target";

export function CtaBlockView({
  block,
  agency,
  locale,
}: {
  block: CtaBlock;
  agency: LinkAgencyContact;
  locale: Locale;
}) {
  const title = pickText(block.title, locale);
  const subtitle = pickText(block.subtitle, locale);
  if (!title && !subtitle) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border px-6 py-16 text-center sm:px-14">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-[var(--gold)]/20" />
          <div className="animate-float-slow absolute -top-20 end-10 size-64 rounded-full bg-[var(--gold)]/25 blur-3xl" />
          <div className="animate-float absolute -bottom-24 start-10 size-64 rounded-full bg-primary/30 blur-3xl" />

          <div className="relative">
            {title && <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">{title}</h2>}
            {subtitle && <p className="text-foreground/80 mx-auto mt-3 max-w-md">{subtitle}</p>}
            <div className="mt-8 flex justify-center">
              <BuilderButton button={block.button} agency={agency} locale={locale} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
