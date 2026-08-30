/**
 * Plain, fully-serializable shapes handed from the Fleet server component
 * (app/(dashboard)/dashboard/fleet/page.tsx) down to the client components.
 * Prisma `Decimal`s are converted to numbers and dates to ISO strings on the
 * server so nothing non-serializable crosses the RSC boundary.
 */

export type VehicleTypeValue = "CAR" | "MOTORCYCLE";
export type TransmissionValue = "AUTOMATIC" | "MANUAL" | "SEMI_AUTOMATIC";
export type FuelValue = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
export type VehicleStatusValue = "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "HIDDEN";

export interface VehicleImageDTO {
  url: string;
  publicId: string | null;
  isCover: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  type: VehicleTypeValue;
  icon: string | null;
  description: string | null;
  vehicleCount: number;
}

export interface VehicleDTO {
  id: string;
  slug: string;
  type: VehicleTypeValue;
  brand: string;
  model: string;
  year: number;
  categoryId: string | null;
  categoryName: string | null;
  transmission: TransmissionValue;
  fuel: FuelValue;
  seats: number | null;
  doors: number | null;
  horsepower: number | null;
  engineSize: string | null;
  color: string | null;
  licensePlate: string | null;
  mileage: number | null;
  depositAmount: number;
  hasAC: boolean;
  hasBluetooth: boolean;
  hasGPS: boolean;
  unlimitedKm: boolean;
  insuranceIncluded: boolean;
  status: VehicleStatusValue;
  featured: boolean;
  description: string | null;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
  coverImageUrl: string | null;
  images: VehicleImageDTO[];
  archived: boolean;
}
