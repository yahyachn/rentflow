"use server";

import { requireUser } from "@/lib/tenant";
import * as notifications from "@/services/notifications";

export type NotificationActionResult = { ok: boolean };

export async function markNotificationReadAction(id: string): Promise<NotificationActionResult> {
  try {
    const user = await requireUser();
    await notifications.markNotificationRead(user.agencyId, id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  try {
    const user = await requireUser();
    await notifications.markAllNotificationsRead(user.agencyId);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
