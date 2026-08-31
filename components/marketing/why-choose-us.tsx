import { useTranslations } from "next-intl";
import { BadgeCheck, Clock, ShieldCheck, Wallet } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

const REASONS = [
  { icon: BadgeCheck, key: "verified" },
  { icon: Wallet, key: "pricing" },
  { icon: Clock, key: "confirmation" },
  { icon: ShieldCheck, key: "insurance" },
] as const;

export function WhyChooseUs() {
  const t = useTranslations("why");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason, i) => (
          <Reveal key={reason.key} delay={i * 0.08}>
            <div className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5">
              <span className="glow-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <reason.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-display font-semibold">{t(`${reason.key}Title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {t(`${reason.key}Desc`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
