import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Better Auth configuration.
 *
 * Multi-tenancy note: RentFlow does NOT use Better Auth's `organization`
 * plugin. Every dashboard user (`User` row) belongs to exactly one `Agency`
 * via a required `agencyId`, set at account-creation time by
 * `actions/auth.ts#registerAgency` (which provisions the Agency + its
 * default Owner/Manager/Employee roles in the same transaction before
 * calling `auth.api.signUpEmail`). This keeps our own `Role`/`Permission`
 * tables — richer than Better Auth's built-in org roles — as the single
 * source of truth for authorization. See lib/tenant.ts for how request
 * handlers read the current agency out of the session.
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
