"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { recordPaymentAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_OPTIONS, paymentSchema } from "@/validators/payment";
import type { ReservationDTO } from "../reservations/types";

export function RecordPaymentDialog({
  open,
  onOpenChange,
  reservation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: ReservationDTO | null;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const total = reservation?.totalPrice ?? 0;
  const paid = reservation?.amountPaid ?? 0;
  const balance = Math.max(0, total - paid);

  useEffect(() => {
    if (open) {
      setAmount(balance > 0 ? String(balance) : "");
      setMethod("CASH");
      setTransactionRef("");
      setNotes("");
      setErrors({});
    }
    // Re-seed when the dialog opens for a (possibly different) reservation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation?.id]);

  function submit() {
    if (!reservation) return;
    const parsed = paymentSchema.safeParse({
      reservationId: reservation.id,
      amount,
      method,
      transactionRef,
      notes,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    startTransition(async () => {
      const result = await recordPaymentAction(parsed.data);
      if (result.ok) {
        toast.success("Payment recorded");
        onOpenChange(false);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {reservation
              ? `${reservation.reservationNumber} · ${reservation.customerName}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 grid grid-cols-3 gap-2 rounded-md border p-3 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="font-medium tabular-nums">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Paid</p>
            <p className="font-medium tabular-nums">{formatCurrency(paid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className="text-primary font-semibold tabular-nums">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pay-ref">Reference (optional)</Label>
            <Input
              id="pay-ref"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. TPE receipt #"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pay-notes">Note (optional)</Label>
            <Textarea
              id="pay-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Recording…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
