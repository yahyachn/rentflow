import { useTranslations } from "next-intl";
import { CalendarCheck, CarFront, Search } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  { icon: Search, key: "search" },
  { icon: CalendarCheck, key: "request" },
  { icon: CarFront, key: "pickup" },
] as const;

export function HowItWorks() {
  const t = useTranslations("how");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
        {/* connector line */}
        <div className="pointer-events-none absolute inset-x-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
        {STEPS.map((step, i) => (
          <Reveal key={step.key} delay={i * 0.12} className="relative text-center">
            <div className="glass-strong glow-primary mx-auto flex size-14 items-center justify-center rounded-2xl text-primary">
              <step.icon className="size-6" />
            </div>
            <p className="text-[var(--gold-soft)] mt-4 text-xs font-semibold tracking-wider">
              {t("step", { n: i + 1 })}
            </p>
            <h3 className="font-display mt-1 font-semibold">{t(`${step.key}Title`)}</h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm leading-relaxed">
              {t(`${step.key}Desc`)}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
