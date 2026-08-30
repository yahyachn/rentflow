"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createVehicleAction, updateVehicleAction } from "@/actions/fleet";
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
import { Textarea } from "@/components/ui/textarea";
import {
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  vehicleSchema,
} from "@/validators/vehicle";
import { ImageUploader } from "./image-uploader";
import type { CategoryDTO, VehicleDTO, VehicleImageDTO } from "./types";

const NO_CATEGORY = "none";

/** Form-side value shape: numeric fields are strings (that's what inputs hold);
 * the shared `vehicleSchema` coerces them on submit. */
interface VehicleFormValues {
  type: "CAR" | "MOTORCYCLE";
  brand: string;
  model: string;
  year: string;
  categoryId: string;
  transmission: "AUTOMATIC" | "MANUAL" | "SEMI_AUTOMATIC";
  fuel: "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
  seats: string;
  doors: string;
  horsepower: string;
  engineSize: string;
  color: string;
  licensePlate: string;
  mileage: string;
  depositAmount: string;
  hasAC: boolean;
  hasBluetooth: boolean;
  hasGPS: boolean;
  unlimitedKm: boolean;
  insuranceIncluded: boolean;
  status: "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "HIDDEN";
  featured: boolean;
  description: string;
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
}

const numStr = (n: number | null | undefined) => (n == null ? "" : String(n));

function defaultsFrom(vehicle: VehicleDTO | null): VehicleFormValues {
  return {
    type: vehicle?.type ?? "CAR",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle ? String(vehicle.year) : String(new Date().getFullYear()),
    categoryId: vehicle?.categoryId ?? NO_CATEGORY,
    transmission: vehicle?.transmission ?? "MANUAL",
    fuel: vehicle?.fuel ?? "PETROL",
    seats: numStr(vehicle?.seats),
    doors: numStr(vehicle?.doors),
    horsepower: numStr(vehicle?.horsepower),
    engineSize: vehicle?.engineSize ?? "",
    color: vehicle?.color ?? "",
    licensePlate: vehicle?.licensePlate ?? "",
    mileage: numStr(vehicle?.mileage),
    depositAmount: vehicle ? String(vehicle.depositAmount) : "0",
    hasAC: vehicle?.hasAC ?? true,
    hasBluetooth: vehicle?.hasBluetooth ?? false,
    hasGPS: vehicle?.hasGPS ?? false,
    unlimitedKm: vehicle?.unlimitedKm ?? false,
    insuranceIncluded: vehicle?.insuranceIncluded ?? true,
    status: vehicle?.status ?? "AVAILABLE",
    featured: vehicle?.featured ?? false,
    description: vehicle?.description ?? "",
    dailyPrice: numStr(vehicle?.dailyPrice),
    weeklyPrice: numStr(vehicle?.weeklyPrice),
    monthlyPrice: numStr(vehicle?.monthlyPrice),
  };
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  categories,
  cloudinaryConfigured,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDTO | null;
  categories: CategoryDTO[];
  cloudinaryConfigured: boolean;
}) {
  const isEdit = vehicle != null;
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<VehicleImageDTO[]>(vehicle?.images ?? []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<VehicleFormValues>({ defaultValues: defaultsFrom(vehicle) });

  // Re-seed the form whenever the dialog opens for a different vehicle.
  useEffect(() => {
    if (open) {
      reset(defaultsFrom(vehicle));
      setImages(vehicle?.images ?? []);
    }
  }, [open, vehicle, reset]);

  const type = watch("type");
  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  function submit(values: VehicleFormValues) {
    const parsed = vehicleSchema.safeParse({ ...values, images });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          setError(key as keyof VehicleFormValues, { message: issue.message });
        }
      }
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateVehicleAction(vehicle.id, parsed.data)
        : await createVehicleAction(parsed.data);

      if (result.ok) {
        toast.success(isEdit ? "Vehicle updated" : "Vehicle added");
        onOpenChange(false);
      } else {
        if (result.fieldErrors) {
          for (const [key, message] of Object.entries(result.fieldErrors)) {
            setError(key as keyof VehicleFormValues, { message });
          }
        }
        toast.error(result.error);
      }
    });
  }

  const err = (key: keyof VehicleFormValues) =>
    errors[key] ? <p className="text-destructive text-xs">{errors[key]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this vehicle's details, pricing, and availability."
              : "Add a car or motorcycle to your fleet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-6 px-6 py-5">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      // Drop a category that no longer matches the chosen type.
                      setValue("categoryId", NO_CATEGORY);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPE_OPTIONS.map((o) => (
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
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                      {categoriesForType.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} placeholder="e.g. Dacia" />
              {err("brand")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register("model")} placeholder="e.g. Sandero" />
              {err("model")}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" {...register("year")} />
              {err("year")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register("color")} placeholder="e.g. White" />
              {err("color")}
            </div>
          </div>

          {/* Specs */}
          <div>
            <p className="mb-3 text-sm font-medium">Specifications</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Transmission</Label>
                <Controller
                  control={control}
                  name="transmission"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSION_OPTIONS.map((o) => (
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
                <Label>Fuel</Label>
                <Controller
                  control={control}
                  name="fuel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_OPTIONS.map((o) => (
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
                <Label htmlFor="seats">Seats</Label>
                <Input id="seats" type="number" {...register("seats")} />
                {err("seats")}
              </div>
              {type === "CAR" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="doors">Doors</Label>
                  <Input id="doors" type="number" {...register("doors")} />
                  {err("doors")}
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="horsepower">Horsepower</Label>
                <Input id="horsepower" type="number" {...register("horsepower")} />
                {err("horsepower")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="engineSize">Engine size</Label>
                <Input id="engineSize" {...register("engineSize")} placeholder="e.g. 1.5L" />
                {err("engineSize")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input id="mileage" type="number" {...register("mileage")} />
                {err("mileage")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="licensePlate">License plate</Label>
                <Input id="licensePlate" {...register("licensePlate")} />
                {err("licensePlate")}
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="mb-3 text-sm font-medium">Features</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ["hasAC", "Air conditioning"],
                  ["hasBluetooth", "Bluetooth"],
                  ["hasGPS", "GPS"],
                  ["unlimitedKm", "Unlimited km"],
                  ["insuranceIncluded", "Insurance included"],
                ] as const
              ).map(([name, label]) => (
                <label
                  key={name}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>{label}</span>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="mb-3 text-sm font-medium">Pricing (MAD)</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="dailyPrice">Daily</Label>
                <Input id="dailyPrice" type="number" step="0.01" {...register("dailyPrice")} />
                {err("dailyPrice")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="weeklyPrice">Weekly</Label>
                <Input id="weeklyPrice" type="number" step="0.01" {...register("weeklyPrice")} />
                {err("weeklyPrice")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="monthlyPrice">Monthly</Label>
                <Input id="monthlyPrice" type="number" step="0.01" {...register("monthlyPrice")} />
                {err("monthlyPrice")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="depositAmount">Deposit</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  {...register("depositAmount")}
                />
                {err("depositAmount")}
              </div>
            </div>
          </div>

          {/* Images */}
          <ImageUploader value={images} onChange={setImages} configured={cloudinaryConfigured} />

          {/* Status + visibility */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
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
                      {VEHICLE_STATUS_OPTIONS.map((o) => (
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
              <Label>Visibility</Label>
              <label className="flex h-9 items-center justify-between gap-2 rounded-md border px-3 text-sm">
                <span>Featured on website</span>
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
            {err("description")}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
