import Link from "next/link";
import { useTranslations } from "next-intl";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  type: "CAR" | "MOTORCYCLE";
  icon: string | null;
  _count: { vehicles: number };
}

export function CategoriesSection({ categories }: { categories: CategoryWithCount[] }) {
  const t = useTranslations("categories");
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category, i) => {
          const Icon = (Icons[category.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Car;
          return (
            <Reveal key={category.id} delay={i * 0.05}>
              <Link
                href={`/vehicles?category=${category.slug}`}
                className="group glass hover:border-primary/40 flex h-full flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <span className="bg-primary/15 text-primary group-hover:from-primary group-hover:to-[var(--gold)] group-hover:text-primary-foreground flex size-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:bg-gradient-to-br group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-muted-foreground text-xs">
                  {t("count", { count: category._count.vehicles })}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
