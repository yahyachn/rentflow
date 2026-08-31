"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createCustomerAction, updateCustomerAction } from "@/actions/customers";
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
import { CUSTOMER_STATUS_OPTIONS, customerSchema } from "@/validators/customer";
import type { CustomerDTO, CustomerStatusValue } from "./types";

const STATUS_KEY: Record<string, string> = {
  REGULAR: "sREGULAR",
  VIP: "sVIP",
  BLACKLISTED: "sBLACKLISTED",
};

interface CustomerFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  country: string;
  licenseNumber: string;
  licenseCountry: string;
  status: CustomerStatusValue;
  notes: string;
}

function defaultsFrom(customer: CustomerDTO | null): CustomerFormValues {
  return {
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    whatsapp: customer?.whatsapp ?? "",
    city: customer?.city ?? "",
    country: customer?.country ?? "",
    licenseNumber: customer?.licenseNumber ?? "",
    licenseCountry: customer?.licenseCountry ?? "",
    status: customer?.status ?? "REGULAR",
    notes: customer?.notes ?? "",
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerDTO | null;
}) {
  const t = useTranslations("cust");
  const isEdit = customer != null;
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({ defaultValues: defaultsFrom(customer) });

  useEffect(() => {
    if (open) reset(defaultsFrom(customer));
  }, [open, customer, reset]);

  function submit(values: CustomerFormValues) {
    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") setError(key as keyof CustomerFormValues, { message: issue.message });
      }
      return;
    }
    startTransition(async () => {
      const result = isEdit
        ? await updateCustomerAction(customer.id, parsed.data)
        : await createCustomerAction(parsed.data);
      if (result.ok) {
        toast.success(isEdit ? t("toastUpdated") : t("toastAdded"));
        onOpenChange(false);
      } else {
        if (result.fieldErrors) {
          for (const [key, message] of Object.entries(result.fieldErrors)) {
            setError(key as keyof CustomerFormValues, { message });
          }
        }
        toast.error(result.error);
      }
    });
  }

  const err = (key: keyof CustomerFormValues) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{isEdit ? t("editDesc") : t("addDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="firstName">{t("fFirstName")}</Label>
            <Input id="firstName" {...register("firstName")} />
            {err("firstName")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lastName">{t("fLastName")}</Label>
            <Input id="lastName" {...register("lastName")} />
            {err("lastName")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="phone">{t("fPhone")}</Label>
            <Input id="phone" {...register("phone")} />
            {err("phone")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="whatsapp">{t("fWhatsapp")}</Label>
            <Input id="whatsapp" {...register("whatsapp")} />
            {err("whatsapp")}
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="email">{t("fEmail")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {err("email")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="city">{t("fCity")}</Label>
            <Input id="city" {...register("city")} />
            {err("city")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="country">{t("fCountry")}</Label>
            <Input id="country" {...register("country")} />
            {err("country")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="licenseNumber">{t("fLicenseNumber")}</Label>
            <Input id="licenseNumber" {...register("licenseNumber")} />
            {err("licenseNumber")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="licenseCountry">{t("fLicenseCountry")}</Label>
            <Input id="licenseCountry" {...register("licenseCountry")} />
            {err("licenseCountry")}
          </div>

          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label>{t("fStatus")}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMER_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {STATUS_KEY[o.value] ? t(STATUS_KEY[o.value]) : o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="notes">{t("fNotes")}</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
            {err("notes")}
          </div>

          <DialogFooter className="col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
            >
              {pending ? t("saving") : isEdit ? t("save") : t("addTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
