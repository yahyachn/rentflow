export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: string; // ISO
  vehicleLabel: string;
  customerName: string;
}
