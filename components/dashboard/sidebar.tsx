import Link from "next/link";
import { Car } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Badge } from "@/components/ui/badge";

export function DashboardSidebarContent({
  agencyName,
  plan,
  permissionKeys,
  onNavigate,
}: {
  agencyName: string;
  plan: string;
  permissionKeys: string[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="size-4" />
          </span>
          RentFlow
        </Link>
      </div>

      <div className="px-5 pb-4">
        <p className="truncate text-sm font-medium">{agencyName}</p>
        <Badge variant="outline" className="mt-1 border-sidebar-border text-sidebar-foreground/70">
          {plan}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <SidebarNav permissionKeys={permissionKeys} onNavigate={onNavigate} />
      </div>

      <div className="border-sidebar-border border-t p-4">
        <p className="text-sidebar-foreground/50 text-xs">
          RentFlow &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: {
  agencyName: string;
  plan: string;
  permissionKeys: string[];
}) {
  return (
    <aside className="border-sidebar-border fixed inset-y-0 left-0 hidden w-64 border-r lg:block">
      <DashboardSidebarContent {...props} />
    </aside>
  );
}
