import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/tenant";
import { countUnread, listSystemNotifications } from "@/services/notifications";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];

  const [notifRows, unreadCount] = await Promise.all([
    listSystemNotifications(user.agencyId),
    countUnread(user.agencyId),
  ]);
  const notifications = notifRows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.readAt != null,
    createdAt: n.createdAt.toISOString(),
    relatedReservationId: n.relatedReservationId,
  }));

  return (
    <div className="bg-muted/30 min-h-svh">
      <DashboardSidebar
        agencyName={user.agency.name}
        plan={user.agency.plan}
        permissionKeys={permissionKeys}
      />
      <div className="flex min-h-svh flex-col lg:pl-64">
        <DashboardTopbar
          agencyName={user.agency.name}
          plan={user.agency.plan}
          permissionKeys={permissionKeys}
          user={{ name: user.name, email: user.email, image: user.image }}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
