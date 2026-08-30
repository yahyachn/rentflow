# emails/

React Email templates (reservation confirmation, agency welcome email,
password reset) — added in Phase 5 alongside the real email/WhatsApp/SMS
notification senders. The `Notification` model (`prisma/schema.prisma`)
and its channel enum already exist so this phase can plug straight in.
