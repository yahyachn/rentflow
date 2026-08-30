import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ReviewInput } from "@/validators/review";

/**
 * Customer reviews. Agency-scoped. Published reviews surface on the public
 * marketing site. Known errors: REVIEW_NOT_FOUND, VEHICLE_NOT_FOUND,
 * CUSTOMER_NOT_FOUND.
 */

const INCLUDE = {
  vehicle: { select: { brand: true, model: true, year: true } },
  customer: { select: { firstName: true, lastName: true } },
} as const;

export type ReviewRow = Prisma.ReviewGetPayload<{ include: typeof INCLUDE }>;

export function listReviews(agencyId: string) {
  return prisma.review.findMany({
    where: { agencyId },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview(agencyId: string, input: ReviewInput) {
  const [vehicle, customer] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: input.vehicleId, agencyId }, select: { id: true } }),
    prisma.customer.findFirst({ where: { id: input.customerId, agencyId }, select: { id: true } }),
  ]);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

  return prisma.review.create({
    data: {
      agencyId,
      vehicleId: input.vehicleId,
      customerId: input.customerId,
      rating: input.rating,
      comment: input.comment ?? null,
      isPublished: input.isPublished,
    },
  });
}

export async function setReviewPublished(agencyId: string, id: string, isPublished: boolean) {
  const res = await prisma.review.updateMany({ where: { id, agencyId }, data: { isPublished } });
  if (res.count === 0) throw new Error("REVIEW_NOT_FOUND");
}

export async function deleteReview(agencyId: string, id: string) {
  const res = await prisma.review.deleteMany({ where: { id, agencyId } });
  if (res.count === 0) throw new Error("REVIEW_NOT_FOUND");
}
