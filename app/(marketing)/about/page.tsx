import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, MapPin, Wrench } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "About us",
  description: "Learn about our fleet, our team, and how we operate.",
};

export default async function AboutPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const t = await getTranslations("about");
  const city = agency.city ?? "Morocco";

  const cards = [
    { icon: BadgeCheck, title: t("verifiedTitle"), desc: t("verifiedDesc") },
    { icon: Wrench, title: t("maintenanceTitle"), desc: t("maintenanceDesc") },
    { icon: MapPin, title: t("localTitle"), desc: t("localDesc", { city }) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 lg:px-6">
      <Reveal>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          <span className="text-gradient">{t("title", { name: agency.name })}</span>
        </h1>
        <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
          {agency.description ?? t("introFallback", { name: agency.name, city })}
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <div className="glass group h-full rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1.5">
              <span className="glow-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] transition-transform duration-300 group-hover:scale-110">
                <c.icon className="size-5" />
              </span>
              <h2 className="font-display mt-5 font-semibold">{c.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{c.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
