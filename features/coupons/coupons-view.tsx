"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCouponAction } from "@/actions/coupons";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponFormDialog } from "./coupon-form-dialog";
import type { CouponDTO } from "./types";

export function CouponsView({
  coupons,
  canManage,
}: {
  coupons: CouponDTO[];
  canManage: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CouponDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponDTO | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteCouponAction(target.id);
      if (result.ok) toast.success("Coupon deleted");
      else toast.error(result.error);
      setDeleteTarget(null);
    });
  }

  function statusBadge(c: CouponDTO) {
    if (!c.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (c.expiresAt && new Date(c.expiresAt) < new Date())
      return <Badge variant="destructive">Expired</Badge>;
    if (c.maxUses != null && c.usedCount >= c.maxUses)
      return <Badge variant="warning">Used up</Badge>;
    return <Badge variant="success">Active</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canManage && (
          <Button onClick={openCreate}>
            <Plus /> New coupon
          </Button>
        )}
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="No coupons yet"
          description="Create percentage or fixed-amount discount codes customers can apply when booking."
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus /> New coupon
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead className="hidden md:table-cell">Valid until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>
                    {c.type === "PERCENTAGE" ? `${c.value}%` : formatCurrency(c.value)}
                    {c.minRentalDays ? (
                      <span className="text-muted-foreground text-xs"> · {c.minRentalDays}+ days</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm">
                      {c.expiresAt ? formatDate(c.expiresAt) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(c)}</TableCell>
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
                              setEditing(c);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(c)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canManage && (
        <>
          <CouponFormDialog open={formOpen} onOpenChange={setFormOpen} coupon={editing} />
          <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete this coupon?</DialogTitle>
                <DialogDescription>
                  {deleteTarget &&
                    `“${deleteTarget.code}” will be removed. Past bookings that used it keep their discount.`}
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
