export type MaintenanceStatusValue = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type MaintenanceTypeValue =
  | "OIL_CHANGE"
  | "INSPECTION"
  | "REPAIR"
  | "TIRE_CHANGE"
  | "INSURANCE_RENEWAL"
  | "REGISTRATION_RENEWAL"
  | "OTHER";

export interface MaintenanceDTO {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  type: MaintenanceTypeValue;
  status: MaintenanceStatusValue;
  title: string;
  description: string | null;
  scheduledDate: string | null; // ISO
  completedDate: string | null; // ISO
  cost: number | null;
  mileageAt: number | null;
  notes: string | null;
}

export interface VehiclePick {
  id: string;
  label: string;
}
