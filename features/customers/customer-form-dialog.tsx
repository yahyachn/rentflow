"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
        toast.success(isEdit ? "Customer updated" : "Customer added");
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
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this customer's details." : "Add a customer to your directory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register("firstName")} />
            {err("firstName")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register("lastName")} />
            {err("lastName")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {err("phone")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" {...register("whatsapp")} />
            {err("whatsapp")}
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {err("email")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            {err("city")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} />
            {err("country")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="licenseNumber">License number</Label>
            <Input id="licenseNumber" {...register("licenseNumber")} />
            {err("licenseNumber")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="licenseCountry">License country</Label>
            <Input id="licenseCountry" {...register("licenseCountry")} />
            {err("licenseCountry")}
          </div>

          <div className="col-span-2 grid gap-1.5 sm:col-span-1">
            <Label>Status</Label>
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
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
