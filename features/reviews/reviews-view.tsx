"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteReviewAction, setReviewPublishedAction } from "@/actions/reviews";
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
import { cn, formatDate } from "@/lib/utils";
import { ReviewFormDialog } from "./review-form-dialog";
import type { ReviewDTO } from "./types";
import type { CustomerOption, VehicleOption } from "@/features/reservations/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5",
            n <= rating ? "fill-warning text-warning" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

export function ReviewsView({
  reviews,
  vehicles,
  customers,
  canManage,
}: {
  reviews: ReviewDTO[];
  vehicles: VehicleOption[];
  customers: CustomerOption[];
  canManage: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewDTO | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pending, startDeleteTransition] = useTransition();

  function togglePublish(r: ReviewDTO) {
    setPendingId(r.id);
    startTransition(async () => {
      const result = await setReviewPublishedAction(r.id, !r.isPublished);
      if (result.ok) toast.success(r.isPublished ? "Unpublished" : "Published");
      else toast.error(result.error);
      setPendingId(null);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startDeleteTransition(async () => {
      const result = await deleteReviewAction(target.id);
      if (result.ok) toast.success("Review deleted");
      else toast.error(result.error);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> Add review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Add customer reviews and publish the best ones to your public site."
          action={
            canManage ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus /> Add review
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Stars rating={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm">{r.comment ?? "—"}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm">{r.vehicleLabel}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground text-sm">{r.customerName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isPublished ? "success" : "secondary"}>
                      {r.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" disabled={pendingId === r.id}>
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => togglePublish(r)}>
                            <Star /> {r.isPublished ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(r)}>
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
          <ReviewFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            vehicles={vehicles}
            customers={customers}
          />
          <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete this review?</DialogTitle>
                <DialogDescription>This can&apos;t be undone.</DialogDescription>
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
