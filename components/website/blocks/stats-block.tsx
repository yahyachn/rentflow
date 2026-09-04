import { Award, Car, Clock, Headset, Shield, Users } from "lucide-react";

import type { Locale } from "@/i18n/config";
import type { StatIcon, StatsBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { Reveal } from "@/components/marketing/reveal";

const ICONS: Record<StatIcon, React.ComponentType<{ className?: string }>> = {
  car: Car,
  users: Users,
  headset: Headset,
  award: Award,
  clock: Clock,
  shield: Shield,
};

export function StatsBlockView({ block, locale }: { block: StatsBlock; locale: Locale }) {
  const title = pickText(block.title, locale);
  const subtitle = pickText(block.subtitle, locale);
  const items = block.items.filter((item) => item.value);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      {(title || subtitle) && (
        <Reveal className="mx-auto max-w-xl text-center">
          {title && (
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          )}
          {subtitle && <p className="text-muted-foreground mt-3">{subtitle}</p>}
        </Reveal>
      )}

      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon];
          const label = pickText(item.label, locale);
          return (
            <Reveal key={item.id} delay={i * 0.07}>
              <div className="glass group h-full rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1.5">
                <span className="glow-primary text-primary-foreground mx-auto flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="size-5" />
                </span>
                <p className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {item.value}
                </p>
                {label && <p className="text-muted-foreground mt-1.5 text-sm leading-snug">{label}</p>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
