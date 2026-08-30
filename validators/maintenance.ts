import { z } from "zod";

export const MAINTENANCE_TYPE_OPTIONS = [
  { value: "OIL_CHANGE", label: "Oil change" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "REPAIR", label: "Repair" },
  { value: "TIRE_CHANGE", label: "Tire change" },
  { value: "INSURANCE_RENEWAL", label: "Insurance renewal" },
  { value: "REGISTRATION_RENEWAL", label: "Registration renewal" },
  { value: "OTHER", label: "Other" },
] as const;

export const MAINTENANCE_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "OVERDUE", label: "Overdue" },
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional(),
  );

const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0, "Must be 0 or more").optional(),
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional(),
);

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  type: z.enum([
    "OIL_CHANGE",
    "INSPECTION",
    "REPAIR",
    "TIRE_CHANGE",
    "INSURANCE_RENEWAL",
    "REGISTRATION_RENEWAL",
    "OTHER",
  ]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]),
  title: z.string().min(1, "Required").max(120),
  description: optionalText(2000),
  scheduledDate: optionalDate,
  completedDate: optionalDate,
  cost: optionalMoney,
  mileageAt: optionalInt,
  notes: optionalText(2000),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
