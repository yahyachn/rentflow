export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO
  relatedReservationId: string | null;
}
