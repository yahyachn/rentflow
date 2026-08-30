"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createMaintenanceAction, updateMaintenanceAction } from "@/actions/maintenance";
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
import {
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  maintenanceSchema,
} from "@/validators/maintenance";
import type { MaintenanceDTO, VehiclePick } from "./types";

interface FormValues {
  vehicleId: string;
  type: string;
  status: string;
  title: string;
  scheduledDate: string;
  completedDate: string;
  cost: string;
  mileageAt: string;
  description: string;
  notes: string;
}

const isoToDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function defaultsFrom(record: MaintenanceDTO | null): FormValues {
  return {
    vehicleId: record?.vehicleId ?? "",
    type: record?.type ?? "OIL_CHANGE",
    status: record?.status ?? "SCHEDULED",
    title: record?.title ?? "",
    scheduledDate: isoToDateInput(record?.scheduledDate ?? null),
    completedDate: isoToDateInput(record?.completedDate ?? null),
    cost: record?.cost != null ? String(record.cost) : "",
    mileageAt: record?.mileageAt != null ? String(record.mileageAt) : "",
    description: record?.description ?? "",
    notes: record?.notes ?? "",
  };
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  record,
  vehicles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: MaintenanceDTO | null;
  vehicles: VehiclePick[];
}) {
  const isEdit = record != null;
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultsFrom(record) });

  useEffect(() => {
    if (open) reset(defaultsFrom(record));
  }, [open, record, reset]);

  function submit(values: FormValues) {
    const parsed = maintenanceSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") setError(key as keyof FormValues, { message: issue.message });
      }
      return;
    }
    startTransition(async () => {
      const result = isEdit
        ? await updateMaintenanceAction(record.id, parsed.data)
        : await createMaintenanceAction(parsed.data);
      if (result.ok) {
        toast.success(isEdit ? "Maintenance updated" : "Maintenance logged");
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
          <DialogTitle>{isEdit ? "Edit maintenance" : "Log maintenance"}</DialogTitle>
          <DialogDescription>Track service, repairs, and renewals for a vehicle.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Vehicle</Label>
            <Controller
              control={control}
              name="vehicleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {err("vehicleId")}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g. 40,000 km service" />
            {err("title")}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                      {MAINTENANCE_TYPE_OPTIONS.map((o) => (
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
                      {MAINTENANCE_STATUS_OPTIONS.map((o) => (
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
              <Label htmlFor="scheduledDate">Scheduled date</Label>
              <Input id="scheduledDate" type="date" {...register("scheduledDate")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="completedDate">Completed date</Label>
              <Input id="completedDate" type="date" {...register("completedDate")} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="cost">Cost (MAD)</Label>
              <Input id="cost" type="number" step="0.01" {...register("cost")} />
              {err("cost")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mileageAt">Mileage (km)</Label>
              <Input id="mileageAt" type="number" {...register("mileageAt")} />
              {err("mileageAt")}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Log maintenance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
