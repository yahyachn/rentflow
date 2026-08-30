export type CouponTypeValue = "PERCENTAGE" | "FIXED";

export interface CouponDTO {
  id: string;
  code: string;
  type: CouponTypeValue;
  value: number;
  maxUses: number | null;
  usedCount: number;
  minRentalDays: number | null;
  startsAt: string | null; // ISO
  expiresAt: string | null; // ISO
  isActive: boolean;
}
