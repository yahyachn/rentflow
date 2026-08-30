# Architecture

## Multi-tenancy

Every business table carries an `agencyId` foreign key. There is no
row-level security at the database level in this phase — isolation is
enforced entirely in the application/service layer: every query in
`services/` takes (or derives) an `agencyId` and filters on it.
`lib/tenant.ts#getCurrentUser` is the one place that resolves "who is signed
in and which agency do they belong to" from the session, cached per request.

`rentflow.ma` → `{agency}.rentflow.ma` subdomain routing is **not** wired up
yet — `lib/public-agency.ts` explains why and what Phase 2 needs to do
(read the `Host` header in middleware, resolve the agency by slug, pass it
down instead of the current single-demo-agency constant). The dashboard
side doesn't need this at all: it resolves the agency from the signed-in
user's session, which already works for any number of tenants.

If this ever needs defense-in-depth beyond the service layer (e.g. for
compliance), MySQL has no built-in row-level-security equivalent to lean
on the way Postgres does — the realistic next step would be per-tenant
database views, or moving the datasource to Postgres specifically to get
RLS. The schema is already shaped for either (every table has a bare
`agencyId` column, no composite keys to unwind).

## Database & Prisma

**Why MySQL instead of Postgres:** the schema, migration, and driver
adapter here target MySQL/MariaDB — including MariaDB as bundled with
XAMPP — so the project runs against whatever MySQL install is already on
hand, without a separate Postgres install or a hosted Postgres account.
Nothing in the data model relies on a Postgres-only feature (no native
arrays, no extensions): every `String` field maps to `VARCHAR(191)` unless
explicitly annotated `@db.Text` in `prisma/schema.prisma`, which is
Prisma's own convention for MySQL (191 characters keeps every indexable
column under InnoDB's key-length limit; `@db.Text`-annotated fields — long
free-text notes/descriptions/tokens — map to MySQL `TEXT` and are never
part of an index).

**Why a driver adapter instead of Prisma's default engine:** `prisma/schema.prisma`'s
`generator client` block uses `engineType = "client"` with the
`queryCompiler` + `driverAdapters` features, paired with
`@prisma/adapter-mariadb` in `lib/prisma.ts` (works against both MySQL and
MariaDB servers). This compiles queries to plain TypeScript instead of
shipping a native Rust query-engine binary — no `libquery_engine*.so.node`
to match to your OS/libssl version, smaller deploy artifacts, and it plays
well with serverless cold starts. This is a permanent, deliberate choice,
not a workaround.

**About the build environment this code was written in:** the sandbox that
produced this repository has a locked-down network allowlist that blocks
`binaries.prisma.sh`. Even with the binary-free `engineType = "client"`
generator above, the `prisma` CLI itself still runs a preflight check (for
`generate`, `validate`, `migrate`, ...) that tries to ensure a native
engine binary is present on disk — unrelated to what the generated client
actually needs at runtime, but the CLI does it unconditionally. Working
around that inside the sandbox meant pointing `PRISMA_SCHEMA_ENGINE_BINARY`
/ `PRISMA_QUERY_ENGINE_LIBRARY` at placeholder files so the CLI's
preflight check found *something* on disk and skipped the blocked download
(the CLI's own schema-parsing already goes through a bundled WASM module
that never touched the network, confirmed by the `--noEmit` typecheck and
successful `prisma generate` output during development).

**None of this applies to you.** In a normal environment (your machine,
CI, Vercel), `npx prisma generate` / `migrate` will reach
`binaries.prisma.sh` fine and download the real engine the first time,
exactly like any other Prisma project — no env vars, no placeholder files,
nothing to configure. `prisma/migrations/0001_init/migration.sql` is a
hand-written MySQL migration, applied directly against a local MariaDB
instance during development (via the `mysql` CLI) and verified end to end —
schema created, seed script run, and a full login round trip exercised
against it — then diffed back against `schema.prisma` field by field;
`prisma migrate deploy` will apply it normally on your machine.

**Soft deletes:** every business table has `deletedAt DateTime?` instead of
relying on hard deletes — reservations, invoices, and audit history should
never actually disappear. Service-layer queries should default to
`deletedAt: null`; there's no Prisma middleware auto-filtering this yet
(worth adding in Phase 2 once there are enough call sites to justify it).

**UUIDs + timestamps:** every table uses a `String @id @default(uuid())`
primary key and `createdAt`/`updatedAt`. Better Auth's `advanced.database.generateId`
is configured to emit `crypto.randomUUID()` too, so `User`/`Session`/`Account`/
`Verification` rows (which Better Auth creates itself, not Prisma's
`@default`) stay consistent with the rest of the schema.

## Auth: Better Auth + custom RBAC (not the org plugin)

Better Auth ships an `organization` plugin that does multi-tenancy
out of the box. This project doesn't use it — instead:

- `User.agencyId` (required) and `User.roleId` are declared as Better Auth
  `additionalFields` (see `lib/auth.ts`), so they travel through
  `signUpEmail` like any other field.
- `Role` and `Permission` are our own tables (`prisma/schema.prisma`), not
  Better Auth's built-in org roles — this gives per-agency custom roles and
  a real permission catalog (`lib/permissions.ts`) instead of a fixed
  owner/admin/member enum.

Why: the spec calls for Owner/Manager/Employee roles *with individually
assignable permissions*, which the org plugin doesn't model. Keeping
Better Auth scoped to "who is this session, and what's their agencyId" and
letting our own `Role`/`RolePermission` tables own authorization keeps the
two concerns cleanly separated.

**Registration flow** (`actions/auth.ts#registerAgency`) has to bridge two
systems that don't share a transaction: it (1) creates the `Agency` +
`Settings` + the three system roles inside a Prisma `$transaction`
(`services/agency.ts#provisionAgency`), then (2) calls
`auth.api.signUpEmail` with the new `agencyId`/`roleId` to create the
`User`/`Account`/`Session` — Better Auth's own internal Prisma calls aren't
part of step 1's transaction. If step 2 fails (e.g. duplicate email), the
action deletes the agency created in step 1 as a compensating action, so a
failed signup never leaves an orphaned tenant behind.

## Folder structure

```
app/            Route segments — (marketing), (auth), (dashboard) groups + api/
components/ui/  Hand-rolled shadcn/ui-style primitives (Button, Card, Dialog, ...)
components/     Shared, marketing-, and dashboard-specific composed components
features/       Feature-scoped client components (forms, dialogs) that combine
                UI primitives with a specific flow (register form, reserve dialog)
lib/            Cross-cutting singletons/helpers (prisma client, auth config,
                tenant resolution, permissions catalog, cn/format utils)
services/       Server-only data-access functions, always agencyId-scoped
actions/        Next.js Server Actions (thin — validate, call a service, return)
validators/     Zod schemas, shared between client forms and server actions
prisma/         schema.prisma, hand-written initial migration, seed script
```

`services/` vs `actions/`: actions are the thin Server Action boundary
(parse input with a validator, call a service, shape the response);
services hold the actual Prisma queries/business logic and are reusable
from Server Components directly (see `app/(dashboard)/dashboard/page.tsx`
calling `services/analytics.ts` through a Suspense boundary, no action
involved since it's a read in a Server Component).

## What's UI-only in Phase 1 (by design)

- The vehicle detail page's **Reserve** dialog (`features/vehicles/reserve-dialog.tsx`)
  and the **Contact** form (`features/marketing/contact-form.tsx`) both
  validate client-side and show a toast on submit, but don't write
  anywhere — the reservation system (Phase 3) and notification delivery
  (Phase 5) aren't built yet, and stubbing a fake "success" without saying
  so would be misleading.
- Dashboard **Fleet / Reservations / Customers / Analytics** pages are
  empty states pointing at the phase that builds them, so the nav doesn't
  404 while staying honest about what's live today.
- The **Reviews** section on the homepage only renders when there are real,
  published `Review` rows for the agency — no placeholder testimonials.
  It'll start showing content once Phase 3's post-rental review flow
  exists.

## Roadmap

- **Phase 2** — Fleet CRUD (vehicles, categories, images via Cloudinary,
  pricing, availability), dashboard tables with search/filter/sort/pagination.
- **Phase 3** — Reservation system (the dialogs built in Phase 1 get wired
  up for real), booking calendar (FullCalendar), customer management,
  double-booking prevention via `VehicleAvailability`.
- **Phase 4** — Full analytics dashboard (Recharts): revenue trends,
  occupancy, vehicle utilization, booking sources.
- **Phase 5** — Notifications (email/WhatsApp/SMS), PDF invoices, payments
  (Stripe/PayPal/CMI) — the `Notification`, `Invoice`, `Payment` tables
  already exist for this.
