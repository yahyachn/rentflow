"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

/**
 * Public reservation request. Collects the fields from the spec, validates
 * client-side, then creates a real PENDING booking via
 * `createPublicReservationAction` (server-side pricing + double-booking
 * prevention). The agency confirms it from the dashboard afterwards.
 */
const formSchema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    phone: z.string().min(1, "Required"),
    whatsapp: z.string().optional(),
    email: z.string().email("Enter a valid email"),
    pickupDate: z.string().min(1, "Required"),
    returnDate: z.string().min(1, "Required"),
    pickupCity: z.string().min(1, "Required"),
    returnCity: z.string().optional(),
    flightNumber: z.string().optional(),
    age: z.string().optional(),
    licenseCountry: z.string().optional(),
    message: z.string().optional(),
  })
  .refine((d) => new Date(d.returnDate) > new Date(d.pickupDate), {
    message: "Return date must be after pickup date",
    path: ["returnDate"],
  });

type ReservationForm = z.infer<typeof formSchema>;

export function ReserveDialog({
  vehicleId,
  vehicleName,
  dailyPrice,
}: {
  vehicleId: string;
  vehicleName: string;
  dailyPrice: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

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
      // Reset on close so the next open starts fresh.
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
        <Button size="lg" className="w-full sm:w-auto">
          <CalendarClock /> Reserve this vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {confirmation ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="bg-success/15 text-success flex size-12 items-center justify-center rounded-full">
              <CheckCircle2 className="size-6" />
            </span>
            <DialogHeader className="items-center">
              <DialogTitle>Reservation request received</DialogTitle>
              <DialogDescription>
                Your reference is <span className="text-foreground font-semibold">{confirmation}</span>
                . We&apos;ve held the {vehicleName} for your dates and will confirm shortly. No charge
                until it&apos;s confirmed.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reserve the {vehicleName}</DialogTitle>
              <DialogDescription>
                Fill in your details and we&apos;ll confirm your reservation shortly.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-destructive text-xs">{errors.firstName.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-destructive text-xs">{errors.lastName.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
                <Input id="whatsapp" {...register("whatsapp")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pickupDate">Pickup date</Label>
                <Input id="pickupDate" type="date" {...register("pickupDate")} />
                {errors.pickupDate && (
                  <p className="text-destructive text-xs">{errors.pickupDate.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="returnDate">Return date</Label>
                <Input id="returnDate" type="date" {...register("returnDate")} />
                {errors.returnDate && (
                  <p className="text-destructive text-xs">{errors.returnDate.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pickupCity">Pickup city</Label>
                <Input id="pickupCity" {...register("pickupCity")} />
                {errors.pickupCity && (
                  <p className="text-destructive text-xs">{errors.pickupCity.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="returnCity">Return city (optional)</Label>
                <Input id="returnCity" {...register("returnCity")} />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="flightNumber">Flight number (optional)</Label>
                <Input id="flightNumber" {...register("flightNumber")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="age">Driver age (optional)</Label>
                <Input id="age" type="number" {...register("age")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="licenseCountry">License country (optional)</Label>
                <Input id="licenseCountry" {...register("licenseCountry")} />
              </div>

              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea id="message" rows={3} {...register("message")} />
              </div>

              {quote && (
                <div className="bg-muted/50 col-span-2 flex items-center justify-between rounded-md border px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {quote.days} {quote.days === 1 ? "day" : "days"} × {formatCurrency(dailyPrice ?? 0)}
                  </span>
                  <span className="font-display text-lg font-semibold">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              )}

              <DialogFooter className="col-span-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Sending…" : "Submit reservation request"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
