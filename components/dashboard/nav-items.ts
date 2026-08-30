import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Fleet", href: "/dashboard/fleet", icon: Car, permission: "fleet.view" },
  {
    label: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    permission: "reservations.view",
  },
  { label: "Customers", href: "/dashboard/customers", icon: Users, permission: "customers.view" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics.view" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, permission: "settings.manage" },
];
