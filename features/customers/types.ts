export type CustomerStatusValue = "REGULAR" | "VIP" | "BLACKLISTED";

export interface CustomerDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  country: string | null;
  licenseNumber: string | null;
  licenseCountry: string | null;
  status: CustomerStatusValue;
  notes: string | null;
  totalBookings: number;
  totalRevenue: number;
}
