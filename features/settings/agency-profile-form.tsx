"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateAgencyProfileAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS, agencyProfileSchema } from "@/validators/settings";

export interface AgencyProfileValues {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  currency: (typeof CURRENCY_OPTIONS)[number];
  timezone: string;
}

export function AgencyProfileForm({ initial }: { initial: AgencyProfileValues }) {
  const t = useTranslations("set");
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<AgencyProfileValues>({ defaultValues: initial });

  function submit(values: AgencyProfileValues) {
    const parsed = agencyProfileSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") setError(key as keyof AgencyProfileValues, { message: issue.message });
      }
      return;
    }
    startTransition(async () => {
      const result = await updateAgencyProfileAction(parsed.data);
      if (result.ok) {
        toast.success(t("profileUpdated"));
        reset(values); // clear the dirty state, keep the saved values
      } else {
        if (result.fieldErrors) {
          for (const [k, message] of Object.entries(result.fieldErrors)) {
            setError(k as keyof AgencyProfileValues, { message });
          }
        }
        toast.error(result.error);
      }
    });
  }

  const err = (key: keyof AgencyProfileValues) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]?.message}</p> : null;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="name">{t("roName")}</Label>
          <Input id="name" {...register("name")} />
          {err("name")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">{t("roEmail")}</Label>
          <Input id="email" type="email" {...register("email")} />
          {err("email")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">{t("roPhone")}</Label>
          <Input id="phone" {...register("phone")} />
          {err("phone")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="whatsapp">{t("fWhatsapp")}</Label>
          <Input id="whatsapp" {...register("whatsapp")} />
          {err("whatsapp")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="address">{t("fAddress")}</Label>
          <Input id="address" {...register("address")} />
          {err("address")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="city">{t("roCity")}</Label>
          <Input id="city" {...register("city")} />
          {err("city")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="country">{t("fCountry")}</Label>
          <Input id="country" {...register("country")} />
          {err("country")}
        </div>
        <div className="grid gap-1.5">
          <Label>{t("roCurrency")}</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="timezone">{t("roTimezone")}</Label>
          <Input id="timezone" {...register("timezone")} />
          {err("timezone")}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending || !isDirty}
          className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
        >
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
