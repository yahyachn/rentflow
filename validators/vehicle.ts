import { z } from "zod";

/**
 * Fleet (vehicle + category) validation schemas, shared between the client
 * form (features/fleet/*) and the server actions (actions/fleet.ts).
 *
 * The client form holds every numeric field as a string (that's what an
 * <input> yields); these schemas coerce those strings back to numbers and
 * treat "" as "not provided", so the same schema validates both sides.
 */

export const VEHICLE_TYPE_OPTIONS = [
  { value: "CAR", label: "Car" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
] as const;

export const TRANSMISSION_OPTIONS = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual" },
  { value: "SEMI_AUTOMATIC", label: "Semi-automatic" },
] as const;

export const FUEL_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "HYBRID", label: "Hybrid" },
] as const;

export const VEHICLE_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BOOKED", label: "Booked" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "HIDDEN", label: "Hidden" },
] as const;

// "" / null / undefined -> undefined, otherwise coerce to a non-negative int.
const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int("Must be a whole number").min(0, "Must be 0 or more").optional(),
);

// "" / null / undefined -> undefined, otherwise coerce to a non-negative amount.
const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0, "Must be 0 or more").optional(),
);

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

export const vehicleImageSchema = z.object({
  url: z.string().url(),
  publicId: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional(),
  ),
  isCover: z.boolean().default(false),
});

export type VehicleImageInput = z.infer<typeof vehicleImageSchema>;

export const vehicleSchema = z.object({
  type: z.enum(["CAR", "MOTORCYCLE"]),
  brand: z.string().min(1, "Required").max(80),
  model: z.string().min(1, "Required").max(80),
  year: z.coerce
    .number()
    .int("Enter a valid year")
    .min(1950, "Enter a valid year")
    .max(new Date().getFullYear() + 1, "Enter a valid year"),
  categoryId: z.preprocess(
    (v) => (v === "" || v === "none" ? undefined : v),
    z.string().optional(),
  ),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "SEMI_AUTOMATIC"]),
  fuel: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]),
  seats: optionalInt,
  doors: optionalInt,
  horsepower: optionalInt,
  engineSize: optionalText(40),
  color: optionalText(40),
  licensePlate: optionalText(20),
  mileage: optionalInt,
  depositAmount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().min(0, "Must be 0 or more"),
  ),
  hasAC: z.boolean(),
  hasBluetooth: z.boolean(),
  hasGPS: z.boolean(),
  unlimitedKm: z.boolean(),
  insuranceIncluded: z.boolean(),
  status: z.enum(["AVAILABLE", "BOOKED", "MAINTENANCE", "HIDDEN"]),
  featured: z.boolean(),
  description: optionalText(2000),
  dailyPrice: optionalMoney,
  weeklyPrice: optionalMoney,
  monthlyPrice: optionalMoney,
  // Gallery images uploaded to Cloudinary (signed direct upload). Each carries
  // the secure URL and the Cloudinary public_id (used to delete the asset when
  // an image is removed). Exactly one image is the cover; the server falls back
  // to the first if none is flagged.
  images: z.array(vehicleImageSchema).max(12, "Up to 12 images per vehicle").default([]),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Required").max(60),
  type: z.enum(["CAR", "MOTORCYCLE"]),
  icon: optionalText(40),
  description: optionalText(200),
});

export type CategoryInput = z.infer<typeof categorySchema>;
