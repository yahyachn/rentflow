"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createReservationAction } from "@/actions/reservations";
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
import { BOOKING_SOURCE_OPTIONS, reservationSchema } from "@/validators/reservation";
import type { CustomerOption, VehicleOption } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Booking sources with a localized label (brand names keep their own name). */
const SOURCE_KEY: Record<string, string> = {
  WEBSITE: "nrSrcWEBSITE",
  PHONE: "nrSrcPHONE",
  WALK_IN: "nrSrcWALK_IN",
  OTHER: "nrSrcOTHER",
};

const emptyForm = {
  vehicleId: "",
  customerId: "",
  newFirstName: "",
  newLastName: "",
  newPhone: "",
  newEmail: "",
  pickupDate: "",
  returnDate: "",
  pickupTime: "",
  returnTime: "",
  pickupCity: "",
  returnCity: "",
  source: "WALK_IN",
  driverAge: "",
  message: "",
  couponCode: "",
};

type FormState = typeof emptyForm;

export function NewReservationDialog({
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
  const t = useTranslations("res");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    customers.length > 0 ? "existing" : "new",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId) ?? null;

  const quote = useMemo(() => {
    if (!selectedVehicle?.dailyPrice || !form.pickupDate || !form.returnDate) return null;
    const pickup = new Date(form.pickupDate);
    const ret = new Date(form.returnDate);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(ret.getTime()) || ret <= pickup) return null;
    const days = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / DAY_MS));
    return { days, total: selectedVehicle.dailyPrice * days };
  }, [selectedVehicle, form.pickupDate, form.returnDate]);

  function reset() {
    setForm(emptyForm);
    setErrors({});
    setCustomerMode(customers.length > 0 ? "existing" : "new");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function submit() {
    const payload = {
      vehicleId: form.vehicleId,
      ...(customerMode === "existing"
        ? { customerId: form.customerId }
        : {
            newCustomer: {
              firstName: form.newFirstName,
              lastName: form.newLastName,
              phone: form.newPhone,
              email: form.newEmail,
            },
          }),
      pickupDate: form.pickupDate,
      returnDate: form.returnDate,
      pickupTime: form.pickupTime,
      returnTime: form.returnTime,
      pickupCity: form.pickupCity,
      returnCity: form.returnCity,
      source: form.source,
      driverAge: form.driverAge,
      message: form.message,
      couponCode: form.couponCode,
    };

    const parsed = reservationSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!(key in next)) next[key] = issue.message;
      }
      setErrors(next);
      // Nested new-customer errors don't have a visible field anchor — surface them.
      const firstCustomerErr = Object.entries(next).find(([k]) => k.startsWith("newCustomer"));
      if (firstCustomerErr) toast.error(firstCustomerErr[1]);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await createReservationAction(parsed.data);
      if (result.ok) {
        toast.success(t("nrCreated"));
        handleOpenChange(false);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  const err = (key: string) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("nrTitle")}</DialogTitle>
          <DialogDescription>{t("nrDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle */}
          <div className="grid gap-1.5">
            <Label>{t("nrVehicle")}</Label>
            <Select value={form.vehicleId} onValueChange={(v) => set("vehicleId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("nrSelectVehicle")} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                    {v.dailyPrice != null
                      ? ` — ${formatCurrency(v.dailyPrice)}${t("nrPerDay")}`
                      : ` — ${t("nrNoPrice")}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("vehicleId")}
          </div>

          {/* Customer */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("nrCustomer")}</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === "existing" ? "secondary" : "ghost"}
                  onClick={() => setCustomerMode("existing")}
                  disabled={customers.length === 0}
                >
                  {t("nrExisting")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === "new" ? "secondary" : "ghost"}
                  onClick={() => setCustomerMode("new")}
                >
                  {t("nrNew")}
                </Button>
              </div>
            </div>

            {customerMode === "existing" ? (
              <>
                <Select value={form.customerId} onValueChange={(v) => set("customerId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("nrSelectCustomer")} />
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
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t("nrFirstName")}
                  value={form.newFirstName}
                  onChange={(e) => set("newFirstName", e.target.value)}
                />
                <Input
                  placeholder={t("nrLastName")}
                  value={form.newLastName}
                  onChange={(e) => set("newLastName", e.target.value)}
                />
                <Input
                  placeholder={t("nrPhone")}
                  value={form.newPhone}
                  onChange={(e) => set("newPhone", e.target.value)}
                />
                <Input
                  placeholder={t("nrEmailOpt")}
                  value={form.newEmail}
                  onChange={(e) => set("newEmail", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pickupDate">{t("nrPickupDate")}</Label>
              <Input
                id="pickupDate"
                type="date"
                value={form.pickupDate}
                onChange={(e) => set("pickupDate", e.target.value)}
              />
              {err("pickupDate")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="returnDate">{t("nrReturnDate")}</Label>
              <Input
                id="returnDate"
                type="date"
                value={form.returnDate}
                onChange={(e) => set("returnDate", e.target.value)}
              />
              {err("returnDate")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pickupTime">{t("nrPickupTime")}</Label>
              <Input
                id="pickupTime"
                type="time"
                value={form.pickupTime}
                onChange={(e) => set("pickupTime", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="returnTime">{t("nrReturnTime")}</Label>
              <Input
                id="returnTime"
                type="time"
                value={form.returnTime}
                onChange={(e) => set("returnTime", e.target.value)}
              />
            </div>
          </div>

          {/* Source + driver age */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("nrSource")}</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {SOURCE_KEY[o.value] ? t(SOURCE_KEY[o.value]) : o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="driverAge">{t("nrDriverAge")}</Label>
              <Input
                id="driverAge"
                type="number"
                value={form.driverAge}
                onChange={(e) => set("driverAge", e.target.value)}
              />
              {err("driverAge")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="couponCode">{t("nrCouponCode")}</Label>
              <Input
                id="couponCode"
                value={form.couponCode}
                onChange={(e) => set("couponCode", e.target.value)}
                placeholder={t("nrCouponPlaceholder")}
                className="uppercase"
              />
              {err("couponCode")}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="message">{t("nrNote")}</Label>
            <Textarea
              id="message"
              rows={2}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>

          {/* Live quote */}
          {quote && (
            <div className="bg-muted/50 flex items-center justify-between rounded-md border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {t("days", { count: quote.days })} ×{" "}
                {selectedVehicle?.dailyPrice != null
                  ? formatCurrency(selectedVehicle.dailyPrice)
                  : "—"}
              </span>
              <span className="font-display text-lg font-semibold">
                {formatCurrency(quote.total)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            {t("nrCancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={pending}
            className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
          >
            {pending ? t("nrCreating") : t("nrCreateBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
