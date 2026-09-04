import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/tenant";
import { listActivity } from "@/services/activity";
import { listTeam } from "@/services/team";
import { listRolesDetailed } from "@/services/roles";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencyProfileForm, type AgencyProfileValues } from "@/features/settings/agency-profile-form";
import { TeamManager, type TeamMember } from "@/features/team/team-manager";
import { RolesManager, type RoleDTO } from "@/features/roles/roles-manager";
import { CURRENCY_OPTIONS } from "@/validators/settings";

export const metadata: Metadata = { title: "Settings" };

/** Maps an activity action to its key in the `set` message namespace. */
const ACTIVITY_KEY: Record<string, string> = {
  "reservation.created": "aReservationCreated",
  "reservation.status": "aReservationStatus",
  "payment.recorded": "aPaymentRecorded",
  "vehicle.created": "aVehicleCreated",
  "vehicle.archived": "aVehicleArchived",
  "customer.created": "aCustomerCreated",
  "team.role": "aTeamRole",
  "team.status": "aTeamStatus",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agency = user.agency;
  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canEditSettings = user.role == null || permissionKeys.includes("settings.manage");
  const canManageTeam = user.role == null || permissionKeys.includes("team.manage");
  const t = await getTranslations("set");

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

  const activityRows = canEditSettings ? await listActivity(agency.id) : [];
  const activity = activityRows.map((a) => {
    const meta = a.metadata;
    const detail =
      meta && typeof meta === "object" && !Array.isArray(meta)
        ? ((meta as Record<string, unknown>).detail as string | undefined)
        : undefined;
    const key = ACTIVITY_KEY[a.action];
    return {
      id: a.id,
      label: key ? t(key) : a.action,
      detail,
      user: a.user?.name ?? t("system"),
      createdAt: a.createdAt,
    };
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>
            {canEditSettings ? t("profileDescEdit") : t("profileDescReadonly")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {canEditSettings ? (
            <AgencyProfileForm initial={profile} />
          ) : (
            <dl className="divide-y">
              {(
                [
                  [t("roName"), agency.name],
                  [t("roEmail"), agency.email ?? "—"],
                  [t("roPhone"), agency.phone ?? "—"],
                  [t("roCity"), agency.city ?? "—"],
                  [t("roCurrency"), agency.currency],
                  [t("roTimezone"), agency.timezone],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle>{t("teamTitle")}</CardTitle>
            <CardDescription>{t("teamDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamManager members={members} roles={roles} currentUserId={user.id} />
          </CardContent>
        </Card>
      )}

      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle>{t("rolesTitle")}</CardTitle>
            <CardDescription>{t("rolesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RolesManager roles={roleDTOs} />
          </CardContent>
        </Card>
      )}

      {canEditSettings && (
        <Card>
          <CardHeader>
            <CardTitle>{t("activityTitle")}</CardTitle>
            <CardDescription>{t("activityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("activityEmpty")}</p>
            ) : (
              <ul className="divide-y">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{a.label}</span>
                        {a.detail ? <span className="text-muted-foreground"> · {a.detail}</span> : null}
                      </p>
                      <p className="text-muted-foreground text-xs">{a.user}</p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDate(a.createdAt, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("accountTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {t.rich("accountBody", {
            name: user.name,
            role: user.role?.name ?? "—",
            count: user.role?.permissions.length ?? 0,
            b: (chunks) => <span className="text-foreground font-medium">{chunks}</span>,
          })}
        </CardContent>
      </Card>
    </div>
  );
}
