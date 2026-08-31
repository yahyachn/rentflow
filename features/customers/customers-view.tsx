"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { archiveCustomerAction } from "@/actions/customers";
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
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/utils";
import { CustomerFormDialog } from "./customer-form-dialog";
import type { CustomerDTO, CustomerStatusValue } from "./types";

const STATUS_VARIANT: Record<CustomerStatusValue, "secondary" | "success" | "destructive"> = {
  REGULAR: "secondary",
  VIP: "success",
  BLACKLISTED: "destructive",
};

export function CustomersView({
  customers,
  canManage,
}: {
  customers: CustomerDTO[];
  canManage: boolean;
}) {
  const t = useTranslations("cust");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CustomerStatusValue>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CustomerDTO | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (q) {
        const haystack =
          `${c.firstName} ${c.lastName} ${c.email ?? ""} ${c.phone ?? ""} ${c.city ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [customers, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(customer: CustomerDTO) {
    setEditing(customer);
    setFormOpen(true);
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    const target = archiveTarget;
    startTransition(async () => {
      const result = await archiveCustomerAction(target.id);
      if (result.ok) toast.success(t("toastArchived"));
      else toast.error(result.error);
      setArchiveTarget(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2" />
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
            <SelectItem value="REGULAR">{t("sREGULAR")}</SelectItem>
            <SelectItem value="VIP">{t("sVIP")}</SelectItem>
            <SelectItem value="BLACKLISTED">{t("sBLACKLISTED")}</SelectItem>
          </SelectContent>
        </Select>
        {canManage && (
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95"
          >
            <Plus /> {t("addCustomer")}
          </Button>
        )}
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus /> {t("addFirst")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("colContact")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("colLocation")}</TableHead>
                <TableHead>{t("colBookings")}</TableHead>
                <TableHead>{t("colRevenue")}</TableHead>
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
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">
                        {c.firstName} {c.lastName}
                      </div>
                      {c.email && <div className="text-muted-foreground text-xs">{c.email}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">{c.phone ?? "—"}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{c.totalBookings}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(c.totalRevenue)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status]}>{t(`s${c.status}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">{t("actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil /> {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setArchiveTarget(c)}
                            >
                              <Trash2 /> {t("archive")}
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
          <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
          <Dialog
            open={archiveTarget != null}
            onOpenChange={(o) => !o && setArchiveTarget(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("archiveTitle")}</DialogTitle>
                <DialogDescription>
                  {archiveTarget &&
                    t("archiveDesc", {
                      name: `${archiveTarget.firstName} ${archiveTarget.lastName}`,
                    })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setArchiveTarget(null)} disabled={pending}>
                  {t("cancel")}
                </Button>
                <Button variant="destructive" onClick={confirmArchive} disabled={pending}>
                  {pending ? t("archiving") : t("archive")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
