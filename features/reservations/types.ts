export type ReservationStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface ReservationDTO {
  id: string;
  reservationNumber: string;
  status: ReservationStatusValue;
  source: string;
  vehicleId: string;
  vehicleLabel: string;
  customerId: string;
  customerName: string;
  pickupDate: string; // ISO
  returnDate: string; // ISO
  durationDays: number;
  totalPrice: number;
  paymentStatus: string;
  amountPaid: number;
}

export interface VehicleOption {
  id: string;
  label: string;
  dailyPrice: number | null;
}

export interface CustomerOption {
  id: string;
  label: string;
}
