"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createCouponAction, updateCouponAction } from "@/actions/coupons";
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
import { Switch } from "@/components/ui/switch";
import { COUPON_TYPE_OPTIONS, couponSchema } from "@/validators/coupon";
import type { CouponDTO } from "./types";

interface FormValues {
  code: string;
  type: string;
  value: string;
  maxUses: string;
  minRentalDays: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const iso = (v: string | null) => (v ? v.slice(0, 10) : "");

function defaultsFrom(c: CouponDTO | null): FormValues {
  return {
    code: c?.code ?? "",
    type: c?.type ?? "PERCENTAGE",
    value: c?.value != null ? String(c.value) : "",
    maxUses: c?.maxUses != null ? String(c.maxUses) : "",
    minRentalDays: c?.minRentalDays != null ? String(c.minRentalDays) : "",
    startsAt: iso(c?.startsAt ?? null),
    expiresAt: iso(c?.expiresAt ?? null),
    isActive: c?.isActive ?? true,
  };
}

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponDTO | null;
}) {
  const isEdit = coupon != null;
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultsFrom(coupon) });

  useEffect(() => {
    if (open) reset(defaultsFrom(coupon));
  }, [open, coupon, reset]);

  function submit(values: FormValues) {
    const parsed = couponSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") setError(key as keyof FormValues, { message: issue.message });
      }
      return;
    }
    startTransition(async () => {
      const result = isEdit
        ? await updateCouponAction(coupon.id, parsed.data)
        : await createCouponAction(parsed.data);
      if (result.ok) {
        toast.success(isEdit ? "Coupon updated" : "Coupon created");
        onOpenChange(false);
      } else {
        if (result.fieldErrors) {
          for (const [k, message] of Object.entries(result.fieldErrors)) {
            setError(k as keyof FormValues, { message });
          }
        }
        toast.error(result.error);
      }
    });
  }

  const err = (key: keyof FormValues) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>Discount codes customers can apply to a booking.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...register("code")} placeholder="SUMMER20" className="uppercase" />
              {err("code")}
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUPON_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" step="0.01" {...register("value")} />
              {err("value")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxUses">Max uses</Label>
              <Input id="maxUses" type="number" {...register("maxUses")} placeholder="Unlimited" />
              {err("maxUses")}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="minRentalDays">Min rental days</Label>
              <Input id="minRentalDays" type="number" {...register("minRentalDays")} placeholder="Any" />
              {err("minRentalDays")}
            </div>
            <div className="grid gap-1.5">
              <Label>Active</Label>
              <label className="flex h-9 items-center justify-between gap-2 rounded-md border px-3 text-sm">
                <span>Enabled</span>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </label>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="startsAt">Starts</Label>
              <Input id="startsAt" type="date" {...register("startsAt")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="expiresAt">Expires</Label>
              <Input id="expiresAt" type="date" {...register("expiresAt")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
