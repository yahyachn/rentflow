import { z } from "zod";

import { PERMISSIONS } from "@/lib/permissions";

const VALID_KEYS = new Set(PERMISSIONS.map((p) => p.key));

export const roleSchema = z.object({
  name: z.string().min(2, "Required").max(40),
  // Keep only real permission keys, so a tampered payload can't grant unknowns.
  permissions: z
    .array(z.string())
    .default([])
    .transform((keys) => keys.filter((k) => VALID_KEYS.has(k))),
});

export type RoleInput = z.infer<typeof roleSchema>;
