import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 pb-24 lg:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-14">
          {/* animated gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-[var(--gold)]/20" />
          <div className="animate-float-slow absolute -top-20 end-10 size-64 rounded-full bg-[var(--gold)]/25 blur-3xl" />
          <div className="animate-float absolute -bottom-24 start-10 size-64 rounded-full bg-primary/30 blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
              {t("title")}
            </h2>
            <p className="text-foreground/80 mx-auto mt-3 max-w-md">{t("subtitle")}</p>
            <Link
              href="/vehicles"
              className="sheen glow-primary mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[var(--gold)] px-7 py-3.5 font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105"
            >
              {t("button")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
