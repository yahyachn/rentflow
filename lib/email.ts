import "server-only";

import { Resend } from "resend";

/**
 * Transactional email via Resend.
 *
 * Configuration lives in two env vars:
 *   - RESEND_API_KEY — from the Resend dashboard (API Keys).
 *   - RESEND_FROM    — a verified sender, e.g. "RentFlow <noreply@yourdomain.com>".
 *                      For quick testing Resend allows "onboarding@resend.dev".
 *
 * When either is missing the app runs exactly as before: `isEmailConfigured()`
 * returns false and callers keep their messages queued in the notification
 * outbox (status PENDING) instead of sending.
 */

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM?.trim();

export function isEmailConfigured(): boolean {
  return Boolean(apiKey && from);
}

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body. Also used to build the default HTML if `html` is omitted. */
  text: string;
  html?: string;
  replyTo?: string;
}

export type SendEmailResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend || !from) return { ok: false, error: "EMAIL_NOT_CONFIGURED" };

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? renderEmailHtml({ title: input.subject, body: input.text }),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}

/**
 * Minimal, email-client-safe branded HTML (all styles inline, table-free).
 * Mirrors the app's gradient brand mark without depending on external assets.
 */
export function renderEmailHtml({ title, body }: { title: string; body: string }): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(100deg,#2563eb,#d4a017);padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">RentFlow</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
        ${paragraphs}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by RentFlow on behalf of your rental agency.</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
