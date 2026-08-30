import { Star } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/utils";

/**
 * Renders real, published customer reviews (Review.isPublished = true).
 * Intentionally has no fallback fake testimonials — an agency with no
 * reviews yet simply doesn't render this section, rather than showing
 * fabricated quotes. Reviews go live once Phase 3 wires up the post-rental
 * review flow.
 */
export async function ReviewsSection({ agencyId }: { agencyId: string }) {
  const reviews = await prisma.review.findMany({
    where: { agencyId, isPublished: true },
    include: { customer: true, vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold">What customers say</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < review.rating
                        ? "fill-warning text-warning size-4"
                        : "text-muted size-4"
                    }
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-muted-foreground text-sm">&ldquo;{review.comment}&rdquo;</p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <span className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
