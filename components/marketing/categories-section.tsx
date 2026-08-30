import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  type: "CAR" | "MOTORCYCLE";
  icon: string | null;
  _count: { vehicles: number };
}

export function CategoriesSection({ categories }: { categories: CategoryWithCount[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Browse by category</h2>
          <p className="text-muted-foreground mt-2">Find the right fit for your trip.</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = (Icons[category.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Car;
          return (
            <Link
              key={category.id}
              href={`/vehicles?category=${category.slug}`}
              className="hover:border-primary/40 hover:bg-primary/5 group flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors"
            >
              <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-11 items-center justify-center rounded-full transition-colors">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-muted-foreground text-xs">
                {category._count.vehicles} vehicle{category._count.vehicles === 1 ? "" : "s"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
