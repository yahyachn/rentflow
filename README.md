# RentFlow

Multi-tenant car & motorcycle rental management SaaS. Each agency gets its
own public website and an isolated dashboard for fleet, reservations,
customers, and analytics.

This repository is **Phase 1** of a five-phase build — see
[ARCHITECTURE.md](./ARCHITECTURE.md) for the full roadmap and the
architectural decisions behind the schema, auth, and folder structure.

## What's in Phase 1

- Project scaffold: Next.js 15 (App Router) + TypeScript (strict) + Tailwind
  CSS v4 + hand-rolled shadcn/ui-style components + Framer Motion.
- Full multi-tenant Prisma schema (25 tables — see `prisma/schema.prisma`):
  agencies, RBAC (roles/permissions), fleet, reservations, customers,
  billing, engagement, and audit/activity logs.
- Authentication: Better Auth (email/password), wired to the custom
  `Agency`/`Role`/`Permission` tables — not Better Auth's org plugin — so a
  new sign-up provisions an `Agency` + its default Owner/Manager/Employee
  roles in one flow.
- A real, working marketing website (home, vehicle listing + detail pages,
  about, FAQ, contact, privacy, terms, 404) rendering live data from MySQL
  via Prisma.
- A dashboard shell (sidebar, topbar, theme toggle, permission-aware nav)
  with a real stats widget and placeholder pages for the sections that ship
  in later phases.

## Getting started

You need a running MySQL (or MariaDB) server and Node.js 20+. On macOS/Linux:

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

npx prisma generate
npx prisma migrate deploy   # applies prisma/migrations/0001_init
npm run db:seed             # seeds permissions + a demo agency "Atlas Car Rental"

npm run dev
```

Demo login (created by the seed script): **owner@atlascarrental.com** /
**RentFlow2026!**

> Note: `npx prisma migrate deploy` / `generate` need normal internet access
> to download Prisma's engine binaries on first run, same as any Prisma
> project — nothing special required in your own environment. See
> ARCHITECTURE.md if you're curious why that's called out explicitly here.

### Windows + XAMPP setup

XAMPP bundles a real MySQL server (via MariaDB), which this project's
`DATABASE_URL` can point straight at — no separate database install needed
if you already have XAMPP.

1. Open the **XAMPP Control Panel** and click **Start** next to **MySQL**.
2. Create the database. Either:
   - Click **Admin** next to MySQL to open phpMyAdmin, then **New** → name
     it `rentflow` → **Create**, or
   - Open a terminal and run: `"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE rentflow CHARACTER SET utf8mb4;"`
3. In PowerShell, from the project folder (commands run one at a time, not
   chained with `&&`, which PowerShell 5.1 doesn't support):

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

4. Open `.env` in a text editor and set:

   ```
   DATABASE_URL="mysql://root@localhost:3306/rentflow"
   ```

   (XAMPP's MySQL defaults to user `root` with no password. If you set a
   root password in XAMPP's security settings, use
   `mysql://root:yourpassword@localhost:3306/rentflow` instead.)

   Also set `BETTER_AUTH_SECRET` to any long random string — generate one
   with:

   ```powershell
   -join ((48..57)+(97..122)|Get-Random -Count 40|%{[char]$_})
   ```

5. Apply the schema and seed data, then start the app:

   ```powershell
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```

6. Visit `http://localhost:3000` and log in at `/login` with
   **owner@atlascarrental.com** / **RentFlow2026!**.

### Cloudinary image uploads (fleet gallery)

Vehicle images are uploaded straight from the browser to Cloudinary using a
short-lived signature minted server-side (`lib/cloudinary.ts` +
`getUploadSignatureAction`), so your API secret never reaches the client and
large files don't pass through the Next.js server. Until the three env vars
below are set, the fleet form shows a setup notice and disables the upload
button — everything else (adding/editing vehicles, existing images) keeps
working.

To enable uploads:

1. Create a free account at <https://cloudinary.com> and open the
   **Dashboard** — it shows your **Cloud name**, **API Key**, and **API
   Secret** (click *Reveal* for the secret). No upload preset is needed; uploads
   are signed server-side.
2. Add them to `.env`:

   ```
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

3. Restart the dev server (env vars are read at boot). The **Upload images**
   button in the vehicle form is now live: upload up to 12 images per vehicle,
   click the ★ to pick a cover, or ✕ to remove one. Uploads are stored under
   `rentflow/<agencyId>/vehicles/` so tenants never share an asset namespace,
   and removing/replacing an image deletes the old asset from Cloudinary.

### Scripts

| Command             | Description                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Start the dev server (Turbopack)              |
| `npm run build`      | Production build                              |
| `npm run start`      | Run the production build                      |
| `npm run lint`       | ESLint                                        |
| `npm run db:generate`| Regenerate the Prisma Client                  |
| `npm run db:migrate` | `prisma migrate dev` (creates new migrations) |
| `npm run db:deploy`  | `prisma migrate deploy` (applies migrations)  |
| `npm run db:seed`    | Seed permissions + the demo agency            |
| `npm run db:seed:demo` | Add sample bookings so the dashboards have data (opt-in) |
| `npm run db:seed:demo:clear` | Remove the sample bookings again        |
| `npm run db:studio`  | Prisma Studio                                 |

### Demo data (optional)

The base seed creates a fleet but no reservations, so the analytics dashboard
and booking calendar start empty. To populate them with a few months of sample
bookings — spread across customers, vehicles, sources, and statuses — run:

```bash
npm run db:seed:demo
```

Everything it creates is tagged `DEMO_DATA` and is **not for production**;
remove it anytime with `npm run db:seed:demo:clear` (real data is untouched).

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Radix UI primitives ·
Framer Motion · MySQL/MariaDB · Prisma 6 (via `@prisma/adapter-mariadb`, no
native engine binary) · Better Auth · Zod · React Hook Form · TanStack Table ·
Recharts · Sonner
