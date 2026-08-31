"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashNav");
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
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            {/* active accent bar */}
            <span
              className={cn(
                "absolute inset-y-1.5 start-0 w-1 rounded-full bg-gradient-to-b from-primary to-[var(--gold)] transition-opacity duration-200",
                isActive ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive ? "text-primary" : "group-hover:text-sidebar-accent-foreground",
              )}
            />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
