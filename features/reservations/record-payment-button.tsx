"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/features/payments/record-payment-dialog";
import type { ReservationDTO } from "./types";

/** "Record payment" trigger for the reservation detail page — reuses the same
 * dialog as the reservations list. */
export function RecordPaymentButton({ reservation }: { reservation: ReservationDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CreditCard /> Record payment
      </Button>
      <RecordPaymentDialog open={open} onOpenChange={setOpen} reservation={reservation} />
    </>
  );
}
