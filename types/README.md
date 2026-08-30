# types/

Hand-written shared TypeScript types that aren't derived from Prisma.
Prisma-derived types (e.g. `PublicVehicle` in `services/vehicles.ts`) live
next to the query that produces them via `Prisma.<Model>GetPayload<...>` —
that's the source of truth and stays in sync with the schema automatically.
Use this folder for types that don't come from the database: API response
shapes for third-party integrations (Cloudinary, Stripe, WhatsApp Business
API) added in later phases, form-state types shared across components, etc.
