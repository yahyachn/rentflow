"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "./types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationDTO[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [, startTransition] = useTransition();

  function openItem(n: NotificationDTO) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      startTransition(() => {
        void markNotificationReadAction(n.id);
      });
    }
    if (n.relatedReservationId) router.push("/dashboard/reservations");
  }

  function markAll() {
    if (unread === 0) return;
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="bg-accent text-accent-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={cn(
                  "hover:bg-muted/60 flex w-full gap-2.5 border-b px-4 py-3 text-left transition-colors last:border-b-0",
                  !n.read && "bg-accent/5",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-accent",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                    {n.body}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
