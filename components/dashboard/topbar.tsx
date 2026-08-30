"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";

import { DashboardSidebarContent } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/features/notifications/notification-bell";
import type { NotificationDTO } from "@/features/notifications/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function DashboardTopbar({
  agencyName,
  plan,
  permissionKeys,
  user,
  notifications,
  unreadCount,
}: {
  agencyName: string;
  plan: string;
  permissionKeys: string[];
  user: { name: string; email: string; image?: string | null };
  notifications: NotificationDTO[];
  unreadCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebarContent
            agencyName={agencyName}
            plan={plan}
            permissionKeys={permissionKeys}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search vehicles, reservations, customers…" className="pl-9" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <NotificationBell initialItems={notifications} initialUnread={unreadCount} />
        <ThemeToggle />
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
