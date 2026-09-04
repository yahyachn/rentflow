import type { Locale } from "@/i18n/config";
import type { FaqBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";

export function FaqBlockView({ block, locale }: { block: FaqBlock; locale: Locale }) {
  const title = pickText(block.title, locale);
  const items = block.items
    .map((item) => ({ id: item.id, question: pickText(item.question, locale), answer: pickText(item.answer, locale) }))
    .filter((item) => item.question);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 lg:px-6">
      <Reveal>
        {title && (
          <h2 className="font-display text-center text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        )}
        <Accordion type="single" collapsible className="mt-8">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
