"use server";

import { revalidatePath } from "next/cache";

import { requireUser, userHasPermission } from "@/lib/tenant";
import * as reviews from "@/services/reviews";
import { reviewSchema, type ReviewInput } from "@/validators/review";

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
    case "REVIEW_NOT_FOUND":
      return "That review no longer exists.";
    case "VEHICLE_NOT_FOUND":
      return "That vehicle no longer exists.";
    case "CUSTOMER_NOT_FOUND":
      return "That customer no longer exists.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function requireManage() {
  const user = await requireUser();
  if (!(await userHasPermission("reservations.manage"))) throw new Error("FORBIDDEN");
  return user;
}

function forbiddenOr(err: unknown): ActionResult {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return { ok: false, error: "You don't have permission to manage reviews." };
  }
  return { ok: false, error: messageFor(err) };
}

// Published reviews render on the public site + home page.
function revalidateReviews() {
  revalidatePath("/dashboard/reservations");
  revalidatePath("/");
}

export async function createReviewAction(input: ReviewInput): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const user = await requireManage();
    await reviews.createReview(user.agencyId, parsed.data);
    revalidateReviews();
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function setReviewPublishedAction(id: string, isPublished: boolean): Promise<ActionResult> {
  try {
    const user = await requireManage();
    await reviews.setReviewPublished(user.agencyId, id, isPublished);
    revalidateReviews();
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}

export async function deleteReviewAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireManage();
    await reviews.deleteReview(user.agencyId, id);
    revalidateReviews();
    return { ok: true };
  } catch (err) {
    return forbiddenOr(err);
  }
}
