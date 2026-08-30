import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about renting a car or motorcycle with us.",
};

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const items = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 lg:px-6">
      <Reveal>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          <span className="text-gradient">{t("title")}</span>
        </h1>
      </Reveal>

      <Reveal delay={0.05}>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {items.map((i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass rounded-2xl border-0 px-5"
            >
              <AccordionTrigger className="text-start hover:no-underline">
                {t(`q${i}`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t(`a${i}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  );
}
