import { z } from "zod";

export const BOOKING_SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "Website" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "PHONE", label: "Phone" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email("Enter a valid email").optional(),
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(16).max(120).optional(),
);

/** Fields for creating a customer inline while booking (a lighter set than the
 * full customer form — the rest can be filled in later on the Customers page). */
const inlineCustomerSchema = z.object({
  firstName: z.string().min(1, "Required").max(80),
  lastName: z.string().min(1, "Required").max(80),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  email: optionalEmail,
});

export const reservationSchema = z
  .object({
    vehicleId: z.string().min(1, "Select a vehicle"),
    // Either an existing customer id, or a new customer to create inline.
    customerId: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().optional(),
    ),
    newCustomer: inlineCustomerSchema.optional(),
    pickupDate: z.string().min(1, "Required"),
    returnDate: z.string().min(1, "Required"),
    pickupTime: optionalText(10),
    returnTime: optionalText(10),
    pickupCity: optionalText(80),
    returnCity: optionalText(80),
    source: z.enum([
      "WEBSITE",
      "WHATSAPP",
      "INSTAGRAM",
      "FACEBOOK",
      "GOOGLE",
      "PHONE",
      "WALK_IN",
      "OTHER",
    ]),
    driverAge: optionalInt,
    flightNumber: optionalText(40),
    licenseCountry: optionalText(80),
    message: optionalText(2000),
    couponCode: optionalText(30),
  })
  .refine((data) => Boolean(data.customerId) || Boolean(data.newCustomer), {
    message: "Select a customer or add a new one",
    path: ["customerId"],
  })
  .refine(
    (data) => {
      const pickup = new Date(data.pickupDate);
      const ret = new Date(data.returnDate);
      return !Number.isNaN(pickup.getTime()) && !Number.isNaN(ret.getTime()) && ret > pickup;
    },
    { message: "Return date must be after pickup date", path: ["returnDate"] },
  );

export type ReservationInput = z.infer<typeof reservationSchema>;

/** Reservation status transitions the UI/service allow. Terminal states map to
 * an empty list. Kept here so client (action menus) and server (guard) agree. */
export const RESERVATION_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["ONGOING", "CANCELLED", "NO_SHOW"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};
