"use server";

import { z } from "zod";

import { getMarketingAgency } from "@/lib/public-agency";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
});

/**
 * Public contact form → emails the resolved agency's inbox via Resend, with the
 * visitor set as reply-to. `delivered` tells the UI whether an email actually
 * went out (false when Resend isn't configured or the agency has no inbox), so
 * it can show an honest message either way.
 */
export type ContactResult = { ok: true; delivered: boolean } | { ok: false; error: string };

export async function sendContactMessageAction(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { name, email, message } = parsed.data;

  const agency = await getMarketingAgency();
  const to = agency?.email;
  if (!to || !isEmailConfigured()) return { ok: true, delivered: false };

  const result = await sendEmail({
    to,
    subject: `New contact message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    replyTo: email,
  });

  return { ok: true, delivered: result.ok };
}
