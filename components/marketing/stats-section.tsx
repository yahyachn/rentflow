import { useTranslations } from "next-intl";

import { Reveal } from "@/components/marketing/reveal";

/**
 * Shows only numbers we can actually back with real data (fleet size,
 * categories) plus non-numeric policy statements — no fabricated claims.
 */
export function StatsSection({
  vehicleCount,
  categoryCount,
}: {
  vehicleCount: number;
  categoryCount: number;
}) {
  const t = useTranslations("stats");

  const stats = [
    { value: String(vehicleCount), label: t("fleet") },
    { value: String(categoryCount), label: t("categories") },
    { value: t("insuredValue"), label: t("insuredLabel") },
    { value: t("samedayValue"), label: t("samedayLabel") },
  ];

  return (
    <section className="relative overflow-hidden py-4">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-12 lg:px-12">
          <div className="pointer-events-none absolute -top-20 start-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} className="text-center">
                <p className="font-display text-3xl font-semibold sm:text-4xl">
                  <span className="text-gradient">{stat.value}</span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
