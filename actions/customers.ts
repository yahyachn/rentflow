"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import { logActivity } from "@/services/activity";
import * as customers from "@/services/customers";
import { customerSchema, type CustomerInput } from "@/validators/customer";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFrom(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

function messageFor(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "UNAUTHENTICATED":
      return "Your session has expired — please sign in again.";
    case "CUSTOMER_NOT_FOUND":
      return "That customer no longer exists.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireCustomerManage() {
  await requireUser();
  if (!(await userHasPermission("customers.manage"))) throw new Error("FORBIDDEN");
  return requireUser();
}

function revalidateCustomers() {
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}

export async function createCustomerAction(input: CustomerInput): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireCustomerManage();
    await customers.createCustomer(user.agencyId, parsed.data);
    await logActivity(
      user.agencyId,
      user.id,
      "customer.created",
      "Customer",
      null,
      `${parsed.data.firstName} ${parsed.data.lastName}`,
    );
    revalidateCustomers();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage customers." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerInput,
): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  try {
    const user = await requireCustomerManage();
    await customers.updateCustomer(user.agencyId, id, parsed.data);
    revalidateCustomers();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage customers." };
    }
    return { ok: false, error: messageFor(err) };
  }
}

export async function archiveCustomerAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireCustomerManage();
    await customers.archiveCustomer(user.agencyId, id);
    revalidateCustomers();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return { ok: false, error: "You don't have permission to manage customers." };
    }
    return { ok: false, error: messageFor(err) };
  }
}
