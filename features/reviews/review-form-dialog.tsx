"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { createReviewAction } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { reviewSchema } from "@/validators/review";
import type { CustomerOption, VehicleOption } from "@/features/reservations/types";

export function ReviewFormDialog({
  open,
  onOpenChange,
  vehicles,
  customers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleOption[];
  customers: CustomerOption[];
}) {
  const [vehicleId, setVehicleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setVehicleId("");
      setCustomerId("");
      setRating("5");
      setComment("");
      setIsPublished(true);
      setErrors({});
    }
  }, [open]);

  function submit() {
    const parsed = reviewSchema.safeParse({ vehicleId, customerId, rating, comment, isPublished });
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
      const result = await createReviewAction(parsed.data);
      if (result.ok) {
        toast.success("Review added");
        onOpenChange(false);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  const err = (key: string) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add review</DialogTitle>
          <DialogDescription>
            Record a customer&apos;s review. Published reviews appear on your public site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("vehicleId")}
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("customerId")}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Rating</Label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {"★".repeat(n)} ({n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did the customer say?"
            />
          </div>

          <label className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span>Publish on public site</span>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Add review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
