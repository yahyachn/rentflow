import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Better Auth configuration.
 *
 * This is a single-tenant product (one `Agency` row, no self-serve sign-up —
 * `/register` doesn't exist; the agency + its Owner/Manager/Employee roles
 * are provisioned once by `prisma/seed.ts` via `services/agency.ts#provisionAgency`).
 * Every dashboard `User` still carries an `agencyId` (a required additional
 * field, not Better Auth's `organization` plugin) purely so `Role`/
 * `Permission`/every `services/*` query keep their existing tenant-scoped
 * shape — see ARCHITECTURE.md. See lib/tenant.ts for how request handlers
 * read the current user + agency out of the session.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  user: {
    additionalFields: {
      agencyId: {
        type: "string",
        required: true,
        input: true,
      },
      roleId: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },

  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },

  // Must be last in the plugins array (per Better Auth's Next.js docs) —
  // it makes auth.api.* calls made from Server Actions/Route Handlers
  // automatically propagate Set-Cookie via next/headers.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
