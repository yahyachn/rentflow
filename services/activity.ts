import { prisma } from "@/lib/prisma";

/**
 * Lightweight activity / audit log — "who did what". Writes are best-effort:
 * a logging failure must never break the action it records.
 */

export async function logActivity(
  agencyId: string,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  detail?: string,
) {
  try {
    await prisma.activityLog.create({
      data: {
        agencyId,
        userId,
        action,
        entityType,
        entityId,
        metadata: detail ? { detail } : undefined,
      },
    });
  } catch (err) {
    console.error("logActivity failed", err);
  }
}

export function listActivity(agencyId: string, take = 25) {
  return prisma.activityLog.findMany({
    where: { agencyId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
