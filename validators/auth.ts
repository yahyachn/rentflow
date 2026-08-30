import { z } from "zod";

export const registerSchema = z.object({
  agencyName: z
    .string()
    .min(2, "Agency name must be at least 2 characters")
    .max(80),
  name: z.string().min(2, "Your name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
