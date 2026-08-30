import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const reviewSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  customerId: z.string().min(1, "Select a customer"),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  comment: optionalText(2000),
  isPublished: z.boolean(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
