"use client";

import { useMemo, useState, useTransition } from "react";
import { MoreHorizontal, Plus, Trash2, Wrench, Pencil } from "lucide-react";
import { toast } from "sonner";

import { deleteMaintenanceAction } from "@/actions/maintenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_TYPE_OPTIONS } from "@/validators/maintenance";
import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import type { MaintenanceDTO, MaintenanceStatusValue, VehiclePick } from "./types";

const TYPE_LABEL = Object.fromEntries(MAINTENANCE_TYPE_OPTIONS.map((o) => [o.value, o.label]));
const STATUS_META: Record<
  MaintenanceStatusValue,
  { label: string; variant: "secondary" | "warning" | "success" | "destructive" }
> = {
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
};

export function MaintenanceView({
  records,
  vehicles,
  canManage,
}: {
  records: MaintenanceDTO[];
  vehicles: VehiclePick[];
  canManage: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | MaintenanceStatusValue>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceDTO | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => records.filter((r) => statusFilter === "ALL" || r.status === statusFilter),
    [records, statusFilter],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteMaintenanceAction(target.id);
      if (result.ok) toast.success("Maintenance deleted");
      else toast.error(result.error);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {MAINTENANCE_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Button onClick={openCreate} disabled={vehicles.length === 0}>
            <Plus /> Log maintenance
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance logged"
          description="Track oil changes, inspections, repairs, and insurance/registration renewals per vehicle."
          action={
            canManage && vehicles.length > 0 ? (
              <Button onClick={openCreate}>
                <Plus /> Log maintenance
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                    No records match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.vehicleLabel}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-muted-foreground text-xs">{TYPE_LABEL[r.type] ?? r.type}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {r.scheduledDate ? formatDate(r.scheduledDate) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.cost != null ? formatCurrency(r.cost) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_META[r.status].variant}>{STATUS_META[r.status].label}</Badge>
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(r);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(r)}>
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {canManage && (
        <>
          <MaintenanceFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            record={editing}
            vehicles={vehicles}
          />
          <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete this record?</DialogTitle>
                <DialogDescription>
                  {deleteTarget && `“${deleteTarget.title}” will be permanently removed.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
                  {pending ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
