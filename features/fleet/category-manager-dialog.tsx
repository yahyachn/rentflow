"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/fleet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { categorySchema, VEHICLE_TYPE_OPTIONS } from "@/validators/vehicle";
import type { CategoryDTO, VehicleTypeValue } from "./types";

const emptyForm = { name: "", type: "CAR" as VehicleTypeValue, icon: "" };

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDTO[];
}) {
  const t = useTranslations("fleet");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(category: CategoryDTO) {
    setEditingId(category.id);
    setForm({ name: category.name, type: category.type, icon: category.icon ?? "" });
    setError(null);
  }

  function save() {
    const parsed = categorySchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("catFormError"));
      return;
    }
    startTransition(async () => {
      const result = editingId
        ? await updateCategoryAction(editingId, parsed.data)
        : await createCategoryAction(parsed.data);
      if (result.ok) {
        toast.success(editingId ? t("toastCatUpdated") : t("toastCatAdded"));
        resetForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(category: CategoryDTO) {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.ok) {
        toast.success(t("toastCatDeleted"));
        if (editingId === category.id) resetForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("catManageTitle")}</DialogTitle>
          <DialogDescription>{t("catManageDesc")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t("catEmpty")}</p>
          ) : (
            categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{c.name}</span>
                  <Badge variant="outline">
                    {c.type === "CAR" ? t("car") : t("motorcycle")}
                  </Badge>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {t("catVehicles", { count: c.vehicleCount })}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => startEdit(c)}
                    disabled={pending}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-8"
                    onClick={() => remove(c)}
                    disabled={pending}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {editingId ? t("catEditTitle") : t("catAddTitle")}
            </p>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="size-4" /> {t("catCancel")}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cat-name">{t("catName")}</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("catNamePlaceholder")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("catType")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as VehicleTypeValue }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.value === "CAR" ? t("car") : t("motorcycle")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <Button type="button" onClick={save} disabled={pending} className="w-full">
            {editingId ? (
              <>
                <Pencil /> {t("catSaveBtn")}
              </>
            ) : (
              <>
                <Plus /> {t("catAddBtn")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
