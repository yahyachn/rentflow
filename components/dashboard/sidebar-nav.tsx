"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav({
  permissionKeys,
  onNavigate,
}: {
  permissionKeys: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasAll = permissionKeys.length === 0;

  return (
    <nav className="flex flex-col gap-1 px-3">
      {DASHBOARD_NAV_ITEMS.filter(
        (item) => !item.permission || hasAll || permissionKeys.includes(item.permission),
      ).map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
