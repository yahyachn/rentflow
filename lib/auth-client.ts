"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better Auth hooks (useSession, signIn, signOut, ...).
 * Points at the same origin's /api/auth/* handler by default.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { useSession, signIn, signOut, signUp } = authClient;
