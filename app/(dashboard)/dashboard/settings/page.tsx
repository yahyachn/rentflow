import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/tenant";
import { listTeam } from "@/services/team";
import { listRolesDetailed } from "@/services/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencyProfileForm, type AgencyProfileValues } from "@/features/settings/agency-profile-form";
import { TeamManager, type TeamMember } from "@/features/team/team-manager";
import { RolesManager, type RoleDTO } from "@/features/roles/roles-manager";
import { CURRENCY_OPTIONS } from "@/validators/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agency = user.agency;
  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canEditSettings = user.role == null || permissionKeys.includes("settings.manage");
  const canManageTeam = user.role == null || permissionKeys.includes("team.manage");

  const profile: AgencyProfileValues = {
    name: agency.name,
    email: agency.email ?? "",
    phone: agency.phone ?? "",
    whatsapp: agency.whatsapp ?? "",
    address: agency.address ?? "",
    city: agency.city ?? "",
    country: agency.country,
    currency: (CURRENCY_OPTIONS as readonly string[]).includes(agency.currency)
      ? (agency.currency as (typeof CURRENCY_OPTIONS)[number])
      : "MAD",
    timezone: agency.timezone,
  };

  let members: TeamMember[] = [];
  let roles: { id: string; name: string }[] = [];
  let roleDTOs: RoleDTO[] = [];
  if (canManageTeam) {
    const [teamRows, roleRows] = await Promise.all([
      listTeam(agency.id),
      listRolesDetailed(agency.id),
    ]);
    members = teamRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      image: m.image,
      status: m.status,
      roleId: m.role?.id ?? null,
      createdAt: m.createdAt.toISOString(),
    }));
    roles = roleRows.map((r) => ({ id: r.id, name: r.name }));
    roleDTOs = roleRows.map((r) => ({
      id: r.id,
      name: r.name,
      isSystem: r.isSystem,
      permissionKeys: r.permissions.map((rp) => rp.permission.key),
      memberCount: r._count.users,
    }));
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Your agency profile, team, and account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agency profile</CardTitle>
          <CardDescription>
            {canEditSettings
              ? "This information appears on your invoices and public site."
              : "You need the “Manage settings” permission to edit this."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {canEditSettings ? (
            <AgencyProfileForm initial={profile} />
          ) : (
            <dl className="divide-y">
              {(
                [
                  ["Agency name", agency.name],
                  ["Contact email", agency.email ?? "—"],
                  ["Phone", agency.phone ?? "—"],
                  ["City", agency.city ?? "—"],
                  ["Currency", agency.currency],
                  ["Timezone", agency.timezone],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-xs">
            <span>
              Subdomain: <span className="text-foreground font-medium">{agency.slug}.rentflow.ma</span>
            </span>
            <span>
              Plan: <span className="text-foreground font-medium">{agency.plan}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Status: <Badge variant="success">{agency.status}</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              Assign roles and manage access for your staff. Inviting new members by email arrives
              with the messaging integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamManager members={members} roles={roles} currentUserId={user.id} />
          </CardContent>
        </Card>
      )}

      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Roles &amp; permissions</CardTitle>
            <CardDescription>
              Built-in roles are locked. Create custom roles and choose exactly what each can do.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolesManager roles={roleDTOs} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Signed in as <span className="text-foreground font-medium">{user.name}</span> with the{" "}
          <span className="text-foreground font-medium">{user.role?.name ?? "—"}</span> role (
          {user.role?.permissions.length ?? 0} permissions).
        </CardContent>
      </Card>
    </div>
  );
}
