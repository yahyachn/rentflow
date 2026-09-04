import { z } from "zod";

/**
 * Creating a dashboard teammate (Settings > Team). Since there's no
 * self-serve `/register` anymore (single-tenant product), this is the only
 * way a new dashboard login gets created after the initial owner account
 * from `prisma/seed.ts` — see services/team.ts#createTeamMember.
 */
export const createTeamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  roleId: z.string().min(1, "Choose a role"),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
