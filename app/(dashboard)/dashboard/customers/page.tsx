import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/tenant";
import { listCustomers } from "@/services/customers";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomersView } from "@/features/customers/customers-view";
import type { CustomerDTO } from "@/features/customers/types";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const permissionKeys = user.role?.permissions.map((rp) => rp.permission.key) ?? [];
  const canView = user.role == null || permissionKeys.includes("customers.view");
  const canManage = user.role == null || permissionKeys.includes("customers.manage");
  const t = await getTranslations("cust");

  if (!canView) {
    return (
      <div className="space-y-6">
        <Header title={t("title")} subtitle={t("subtitle")} />
        <EmptyState icon={Lock} title={t("noAccessTitle")} description={t("noAccessDesc")} />
      </div>
    );
  }

  const rows = await listCustomers(user.agencyId);
  const customers: CustomerDTO[] = rows.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    city: c.city,
    country: c.country,
    licenseNumber: c.licenseNumber,
    licenseCountry: c.licenseCountry,
    status: c.status,
    notes: c.notes,
    totalBookings: c.totalBookings,
    totalRevenue: Number(c.totalRevenue),
  }));

  return (
    <div className="space-y-6">
      <Header title={t("title")} subtitle={t("subtitle")} />
      <CustomersView customers={customers} canManage={canManage} />
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );
}
