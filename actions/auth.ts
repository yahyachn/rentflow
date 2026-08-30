"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { provisionAgency } from "@/services/agency";
import { registerSchema, type RegisterInput } from "@/validators/auth";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RegisterInput, string>> };

/**
 * Registers a brand-new agency + its Owner user in one flow:
 *   1. Create the Agency, its Settings row, and the Owner/Manager/Employee
 *      roles (transactional — all or nothing).
 *   2. Hand off to Better Auth to create the User/Account/Session, passing
 *      the new agencyId + Owner roleId as additional fields.
 *   3. If step 2 fails (e.g. email already taken), compensate by deleting
 *      the agency created in step 1 so we never leave an orphaned tenant.
 */
export async function registerAgency(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegisterInput | undefined;
      if (field) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { agencyName, name, email, password } = parsed.data;

  const { agency, ownerRoleId } = await prisma.$transaction((tx) =>
    provisionAgency(tx, { name: agencyName, email }),
  );

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        agencyId: agency.id,
        roleId: ownerRoleId,
      },
      headers: await headers(),
    });
  } catch (err) {
    // Compensate: don't leave an agency with no owner behind.
    await prisma.agency.delete({ where: { id: agency.id } }).catch(() => {});

    if (err instanceof APIError) {
      return { ok: false, error: err.message, fieldErrors: { email: err.message } };
    }
    return { ok: false, error: "Something went wrong creating your account." };
  }

  return { ok: true };
}
