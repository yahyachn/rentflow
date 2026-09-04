import type { Locale } from "@/i18n/config";
import type { RichTextBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

export function RichTextBlockView({ block, locale }: { block: RichTextBlock; locale: Locale }) {
  const heading = pickText(block.heading, locale);
  const body = pickText(block.body, locale);
  if (!heading && !body) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 lg:px-6">
      <Reveal className={cn(block.alignment === "center" ? "text-center" : "text-start")}>
        {heading && (
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>
        )}
        {body && (
          <p className="text-muted-foreground mt-4 text-base leading-relaxed whitespace-pre-line">{body}</p>
        )}
      </Reveal>
    </section>
  );
}
