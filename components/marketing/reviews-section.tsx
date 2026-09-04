import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Renders real, published customer reviews (Review.isPublished = true).
 * No fabricated testimonials — an agency with no reviews simply omits it.
 */
export async function ReviewsSection({
  agencyId,
  title,
  limit = 6,
}: {
  agencyId: string;
  /** Overrides the default translated heading (used by the Website Builder's
   * "reviews" block, which lets an agency customize the title). */
  title?: string;
  limit?: number;
}) {
  const [reviews, t] = await Promise.all([
    prisma.review.findMany({
      where: { agencyId, isPublished: true },
      include: { customer: true, vehicle: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    getTranslations("reviews"),
  ]);

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title || t("title")}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {reviews.map((review, i) => (
          <Reveal key={review.id} delay={i * 0.07}>
            <figure className="glass h-full space-y-4 rounded-2xl p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={
                      idx < review.rating
                        ? "size-4 fill-[var(--gold)] text-[var(--gold)]"
                        : "text-muted size-4"
                    }
                  />
                ))}
              </div>
              {review.comment && (
                <blockquote className="text-foreground/90 text-sm leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              )}
              <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                <span className="text-primary-foreground flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--gold)] text-xs font-semibold">
                  {initials(`${review.customer.firstName} ${review.customer.lastName}`)}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {review.customer.firstName} {review.customer.lastName[0]}.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {review.vehicle.brand} {review.vehicle.model}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
