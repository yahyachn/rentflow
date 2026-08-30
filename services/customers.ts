import { prisma } from "@/lib/prisma";
import type { CustomerInput } from "@/validators/customer";

/**
 * Customer directory data access — agency-scoped, soft-delete aware. Known
 * error strings (translated in actions/customers.ts): CUSTOMER_NOT_FOUND.
 */

export function listCustomers(agencyId: string) {
  return prisma.customer.findMany({
    where: { agencyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

/** Minimal shape for pickers (e.g. the New Reservation dialog). */
export function listCustomerOptions(agencyId: string) {
  return prisma.customer.findMany({
    where: { agencyId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

function customerData(input: CustomerInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    licenseNumber: input.licenseNumber ?? null,
    licenseCountry: input.licenseCountry ?? null,
    status: input.status,
    notes: input.notes ?? null,
  };
}

export function createCustomer(agencyId: string, input: CustomerInput) {
  return prisma.customer.create({ data: { agencyId, ...customerData(input) } });
}

export async function updateCustomer(agencyId: string, id: string, input: CustomerInput) {
  const existing = await prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error("CUSTOMER_NOT_FOUND");
  return prisma.customer.update({ where: { id }, data: customerData(input) });
}

/** Soft delete — reservations reference customers with onDelete: Restrict, so
 * we never hard-delete; history is preserved. */
export async function archiveCustomer(agencyId: string, id: string) {
  const res = await prisma.customer.updateMany({
    where: { id, agencyId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) throw new Error("CUSTOMER_NOT_FOUND");
}
