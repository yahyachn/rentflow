"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  FileText,
  List as ListIcon,
  MoreHorizontal,
  Search,
  Star,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";

import { updateReservationStatusAction } from "@/actions/reservations";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BookingTimeline } from "./booking-timeline";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RESERVATION_TRANSITIONS } from "@/validators/reservation";
import { RecordPaymentDialog } from "@/features/payments/record-payment-dialog";
import { NewReservationDialog } from "./new-reservation-dialog";
import { CouponsView } from "@/features/coupons/coupons-view";
import type { CouponDTO } from "@/features/coupons/types";
import { ReviewsView } from "@/features/reviews/reviews-view";
import type { ReviewDTO } from "@/features/reviews/types";
import type {
  CustomerOption,
  ReservationDTO,
  ReservationStatusValue,
  VehicleOption,
} from "./types";

const STATUS_VARIANT: Record<
  ReservationStatusValue,
  "warning" | "default" | "accent" | "success" | "destructive" | "secondary"
> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ONGOING: "accent",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
};

const STATUS_ORDER: ReservationStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const REASON_STATES = new Set(["CANCELLED", "NO_SHOW"]);

export function ReservationsView({
  reservations,
  vehicles,
  customers,
  coupons,
  reviews,
  canManage,
  canApprove,
  canInvoice,
}: {
  reservations: ReservationDTO[];
  vehicles: VehicleOption[];
  customers: CustomerOption[];
  coupons: CouponDTO[];
  reviews: ReviewDTO[];
  canManage: boolean;
  canApprove: boolean;
  canInvoice: boolean;
}) {
  const t = useTranslations("res");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReservationStatusValue>("ALL");
  const [newOpen, setNewOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reasonTarget, setReasonTarget] = useState<{ r: ReservationDTO; next: string } | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [paymentTarget, setPaymentTarget] = useState<ReservationDTO | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (q) {
        const haystack = `${r.reservationNumber} ${r.customerName} ${r.vehicleLabel}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reservations, query, statusFilter]);

  function applyStatus(id: string, next: string, note?: string) {
    startTransition(async () => {
      const result = await updateReservationStatusAction(id, next, note);
      if (result.ok) toast.success(t("updated"));
      else toast.error(result.error);
      setReasonTarget(null);
      setReason("");
    });
  }

  function onTransition(r: ReservationDTO, next: string) {
    if (REASON_STATES.has(next)) {
      setReason("");
      setReasonTarget({ r, next });
    } else {
      applyStatus(r.id, next);
    }
  }

  // A user who can neither approve nor cancel gets no row actions.
  const canAct = canApprove || canManage;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="list">
              <ListIcon /> {t("tabList")}
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <CalendarRange /> {t("tabTimeline")}
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="coupons">
                <TicketPercent /> {t("tabCoupons")}
              </TabsTrigger>
            )}
            {canManage && (
              <TabsTrigger value="reviews">
                <Star /> {t("tabReviews")}
              </TabsTrigger>
            )}
          </TabsList>
          {canManage && (
            <Button
              onClick={() => setNewOpen(true)}
              disabled={vehicles.length === 0}
              className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
            >
              <CalendarPlus /> {t("new")}
            </Button>
          )}
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`s${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      {reservations.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={t("emptyTitle")}
          description={vehicles.length === 0 ? t("emptyNoVehicle") : t("emptyDefault")}
          action={
            canManage && vehicles.length > 0 ? (
              <Button onClick={() => setNewOpen(true)}>
                <CalendarPlus /> {t("new")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colReservation")}</TableHead>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("colVehicle")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("colDates")}</TableHead>
                <TableHead>{t("colTotal")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    {t("noMatch")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const nextStates = RESERVATION_TRANSITIONS[r.status] ?? [];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/reservations/${r.id}`} className="hover:text-primary hover:underline">
                          {r.reservationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">{r.vehicleLabel}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-muted-foreground text-sm">
                          {formatDate(r.pickupDate)} → {formatDate(r.returnDate)}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {t("days", { count: r.durationDays })}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <div>{formatCurrency(r.totalPrice)}</div>
                        {r.paymentStatus === "PAID" && (
                          <Badge variant="success" className="mt-1">
                            {t("paid")}
                          </Badge>
                        )}
                        {r.paymentStatus === "PARTIALLY_PAID" && (
                          <Badge variant="warning" className="mt-1">
                            {t("partial")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>{t(`s${r.status}`)}</Badge>
                      </TableCell>
                      <TableCell>
                        {(canAct && nextStates.length > 0) || canInvoice ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">{t("actions")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canAct &&
                                nextStates.map((next) => (
                                  <DropdownMenuItem
                                    key={next}
                                    variant={REASON_STATES.has(next) ? "destructive" : "default"}
                                    onClick={() => onTransition(r, next)}
                                  >
                                    <CheckCircle2 /> {t(`t${next}`)}
                                  </DropdownMenuItem>
                                ))}
                              {canInvoice && canAct && nextStates.length > 0 && (
                                <DropdownMenuSeparator />
                              )}
                              {canInvoice && (
                                <DropdownMenuItem onClick={() => setPaymentTarget(r)}>
                                  <CreditCard /> {t("recordPayment")}
                                </DropdownMenuItem>
                              )}
                              {canInvoice && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`/invoice/${r.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <FileText /> {t("invoice")}
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
        </TabsContent>

        <TabsContent value="timeline">
          <BookingTimeline reservations={reservations} vehicles={vehicles} />
        </TabsContent>
        {canManage && (
          <TabsContent value="coupons">
            <CouponsView coupons={coupons} canManage={canManage} />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="reviews">
            <ReviewsView
              reviews={reviews}
              vehicles={vehicles}
              customers={customers}
              canManage={canManage}
            />
          </TabsContent>
        )}
      </Tabs>

      {canManage && (
        <NewReservationDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          vehicles={vehicles}
          customers={customers}
        />
      )}

      <RecordPaymentDialog
        open={paymentTarget != null}
        onOpenChange={(o) => !o && setPaymentTarget(null)}
        reservation={paymentTarget}
      />

      <Dialog open={reasonTarget != null} onOpenChange={(o) => !o && setReasonTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reasonTarget && `${t(`t${reasonTarget.next}`)} ?`}</DialogTitle>
            <DialogDescription>
              {reasonTarget && (
                <>
                  {reasonTarget.r.reservationNumber} · {reasonTarget.r.customerName}. {t("reasonDesc")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="reason">{t("reasonLabel")}</Label>
            <Textarea
              id="reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonTarget(null)} disabled={pending}>
              {t("back")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                reasonTarget && applyStatus(reasonTarget.r.id, reasonTarget.next, reason || undefined)
              }
              disabled={pending}
            >
              {pending ? t("working") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
