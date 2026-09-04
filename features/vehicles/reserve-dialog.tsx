"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { createPublicReservationAction } from "@/actions/public-reservations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { ReservationInput } from "@/validators/reservation";

const DAY_MS = 24 * 60 * 60 * 1000;

export function ReserveDialog({
  vehicleId,
  vehicleName,
  dailyPrice,
}: {
  vehicleId: string;
  vehicleName: string;
  dailyPrice: number | null;
}) {
  const t = useTranslations("reserve");
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const formSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, t("vRequired")),
          lastName: z.string().min(1, t("vRequired")),
          phone: z.string().min(1, t("vRequired")),
          whatsapp: z.string().optional(),
          email: z.string().email(t("vEmail")),
          pickupDate: z.string().min(1, t("vRequired")),
          returnDate: z.string().min(1, t("vRequired")),
          pickupCity: z.string().min(1, t("vRequired")),
          returnCity: z.string().optional(),
          flightNumber: z.string().optional(),
          age: z.string().optional(),
          licenseCountry: z.string().optional(),
          message: z.string().optional(),
        })
        .refine((d) => new Date(d.returnDate) > new Date(d.pickupDate), {
          message: t("vReturnAfter"),
          path: ["returnDate"],
        }),
    [t],
  );

  type ReservationForm = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReservationForm>({ resolver: zodResolver(formSchema) });

  const pickupDate = watch("pickupDate");
  const returnDate = watch("returnDate");

  const quote = useMemo(() => {
    if (!dailyPrice || !pickupDate || !returnDate) return null;
    const p = new Date(pickupDate);
    const r = new Date(returnDate);
    if (Number.isNaN(p.getTime()) || Number.isNaN(r.getTime()) || r <= p) return null;
    const days = Math.max(1, Math.ceil((r.getTime() - p.getTime()) / DAY_MS));
    return { days, total: dailyPrice * days };
  }, [dailyPrice, pickupDate, returnDate]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        reset();
        setConfirmation(null);
      }, 150);
    }
  }

  async function onSubmit(values: ReservationForm) {
    const payload: ReservationInput = {
      vehicleId,
      newCustomer: {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        whatsapp: values.whatsapp || undefined,
        email: values.email,
      },
      pickupDate: values.pickupDate,
      returnDate: values.returnDate,
      pickupCity: values.pickupCity || undefined,
      returnCity: values.returnCity || undefined,
      source: "WEBSITE",
      driverAge: values.age ? Number(values.age) : undefined,
      flightNumber: values.flightNumber || undefined,
      licenseCountry: values.licenseCountry || undefined,
      message: values.message || undefined,
    };

    const result = await createPublicReservationAction(payload);
    if (result.ok) {
      setConfirmation(result.reservationNumber);
    } else {
      if (result.fieldErrors?.returnDate) {
        setError("returnDate", { message: result.fieldErrors.returnDate });
      }
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="sheen glow-primary w-full rounded-xl bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
        >
          <CalendarClock /> {t("cta")}
        </Button>
      </DialogTrigger>
      <DialogContent className="marketing-shell max-h-[85vh] overflow-y-auto border-border sm:max-w-lg">
        {confirmation ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="size-6" />
            </span>
            <DialogHeader className="items-center">
              <DialogTitle>{t("successTitle")}</DialogTitle>
              <DialogDescription>
                {t("successRef")}{" "}
                <span className="text-foreground font-semibold">{confirmation}</span>. {" "}
                {t("successDesc", { name: vehicleName })}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              {t("done")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("title", { name: vehicleName })}</DialogTitle>
              <DialogDescription>{t("desc")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">{t("firstName")}</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-destructive text-xs">{errors.firstName.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">{t("lastName")}</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-destructive text-xs">{errors.lastName.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="whatsapp">{t("whatsapp")}</Label>
                <Input id="whatsapp" {...register("whatsapp")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pickupDate">{t("pickupDate")}</Label>
                <Input id="pickupDate" type="date" {...register("pickupDate")} />
                {errors.pickupDate && (
                  <p className="text-destructive text-xs">{errors.pickupDate.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="returnDate">{t("returnDate")}</Label>
                <Input id="returnDate" type="date" {...register("returnDate")} />
                {errors.returnDate && (
                  <p className="text-destructive text-xs">{errors.returnDate.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pickupCity">{t("pickupCity")}</Label>
                <Input id="pickupCity" {...register("pickupCity")} />
                {errors.pickupCity && (
                  <p className="text-destructive text-xs">{errors.pickupCity.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="returnCity">{t("returnCity")}</Label>
                <Input id="returnCity" {...register("returnCity")} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="flightNumber">{t("flightNumber")}</Label>
                <Input id="flightNumber" {...register("flightNumber")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="age">{t("age")}</Label>
                <Input id="age" type="number" {...register("age")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="licenseCountry">{t("licenseCountry")}</Label>
                <Input id="licenseCountry" {...register("licenseCountry")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea id="message" rows={3} {...register("message")} />
              </div>

              {quote && (
                <div className="glass col-span-2 flex items-center justify-between rounded-xl px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {t("days", { count: quote.days })} × {formatCurrency(dailyPrice ?? 0)}
                  </span>
                  <span className="font-display text-lg font-semibold">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              )}

              <DialogFooter className="col-span-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sheen w-full rounded-xl bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground"
                >
                  {isSubmitting ? t("sending") : t("submit")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
