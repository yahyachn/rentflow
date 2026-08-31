import Link from "next/link";
import { Car } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";

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
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 font-display text-[15px] font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Car className="size-4" />
          </span>
          RentFlow
        </Link>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3.5 py-3">
          <p className="truncate text-sm font-medium">{agencyName}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/20 to-[var(--gold)]/20 px-2.5 py-0.5 text-[11px] font-semibold text-sidebar-foreground/90">
            <span className="size-1.5 rounded-full bg-[var(--gold)]" />
            {plan}
          </span>
        </div>
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
