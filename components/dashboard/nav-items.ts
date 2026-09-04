import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  BarChart3,
  Globe,
  Settings,
} from "lucide-react";

export interface NavItem {
  /** Key into the `dashNav` message namespace. */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "fleet", href: "/dashboard/fleet", icon: Car, permission: "fleet.view" },
  {
    labelKey: "reservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    permission: "reservations.view",
  },
  { labelKey: "customers", href: "/dashboard/customers", icon: Users, permission: "customers.view" },
  { labelKey: "analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics.view" },
  { labelKey: "website", href: "/dashboard/website", icon: Globe, permission: "website.view" },
  { labelKey: "settings", href: "/dashboard/settings", icon: Settings, permission: "settings.manage" },
];
