/**
 * Global permission catalog + the default per-agency role presets.
 *
 * The `Permission` table is a global catalog (seeded once — see
 * prisma/seed.ts). Every agency gets its own `Role` rows (Owner / Manager /
 * Employee), each linked to a subset of these permissions via
 * `RolePermission`. `services/agency.ts#provisionAgencyRoles` is what
 * actually creates the rows; this file is just the source-of-truth list.
 */

export const PERMISSION_GROUPS = [
  "Fleet",
  "Reservations",
  "Customers",
  "Analytics",
  "Team",
  "Billing",
  "Settings",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export interface PermissionDef {
  key: string;
  label: string;
  group: PermissionGroup;
  description: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "fleet.view", label: "View fleet", group: "Fleet", description: "See vehicles, categories, and pricing." },
  { key: "fleet.manage", label: "Manage fleet", group: "Fleet", description: "Create, edit, and archive vehicles, pricing, and availability." },
  { key: "reservations.view", label: "View reservations", group: "Reservations", description: "See the booking calendar and reservation list." },
  { key: "reservations.manage", label: "Manage reservations", group: "Reservations", description: "Create, edit, and cancel reservations." },
  { key: "reservations.approve", label: "Approve reservations", group: "Reservations", description: "Confirm pending requests and change status." },
  { key: "customers.view", label: "View customers", group: "Customers", description: "See the customer directory and profiles." },
  { key: "customers.manage", label: "Manage customers", group: "Customers", description: "Edit customer records, notes, and VIP/blacklist status." },
  { key: "analytics.view", label: "View analytics", group: "Analytics", description: "See revenue, occupancy, and performance dashboards." },
  { key: "team.manage", label: "Manage team", group: "Team", description: "Invite staff and assign roles." },
  { key: "billing.manage", label: "Manage billing", group: "Billing", description: "View invoices/payments and configure billing settings." },
  { key: "settings.manage", label: "Manage settings", group: "Settings", description: "Edit agency profile, branding, and policies." },
];

export const ROLE_PRESETS: Record<"Owner" | "Manager" | "Employee", string[]> = {
  Owner: PERMISSIONS.map((p) => p.key),
  Manager: PERMISSIONS.filter((p) => !["team.manage", "billing.manage"].includes(p.key)).map(
    (p) => p.key,
  ),
  Employee: [
    "fleet.view",
    "reservations.view",
    "reservations.manage",
    "customers.view",
    "customers.manage",
  ],
};
