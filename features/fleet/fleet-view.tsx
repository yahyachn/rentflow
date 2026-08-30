"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Car,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { archiveVehicleAction, restoreVehicleAction } from "@/actions/fleet";
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
import { cn, formatCurrency } from "@/lib/utils";
import { CategoryManagerDialog } from "./category-manager-dialog";
import type { CategoryDTO, VehicleDTO, VehicleStatusValue } from "./types";
import { VehicleFormDialog } from "./vehicle-form-dialog";

const PAGE_SIZE = 8;

const STATUS_META: Record<
  VehicleStatusValue,
  { label: string; variant: "success" | "warning" | "secondary" | "outline" }
> = {
  AVAILABLE: { label: "Available", variant: "success" },
  BOOKED: { label: "Booked", variant: "warning" },
  MAINTENANCE: { label: "Maintenance", variant: "secondary" },
  HIDDEN: { label: "Hidden", variant: "outline" },
};

const TRANSMISSION_LABEL: Record<string, string> = {
  AUTOMATIC: "Automatic",
  MANUAL: "Manual",
  SEMI_AUTOMATIC: "Semi-auto",
};
const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
};

type SortKey = "vehicle" | "year" | "dailyPrice" | "status";
type StatusFilter = "ACTIVE" | VehicleStatusValue | "ARCHIVED";

export function FleetView({
  vehicles,
  categories,
  canManage,
  cloudinaryConfigured,
}: {
  vehicles: VehicleDTO[];
  categories: CategoryDTO[];
  canManage: boolean;
  cloudinaryConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CAR" | "MOTORCYCLE">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleDTO | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<VehicleDTO | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = vehicles.filter((v) => {
      if (typeFilter !== "ALL" && v.type !== typeFilter) return false;
      if (statusFilter === "ACTIVE" && v.archived) return false;
      if (statusFilter === "ARCHIVED" && !v.archived) return false;
      if (
        statusFilter !== "ACTIVE" &&
        statusFilter !== "ARCHIVED" &&
        (v.archived || v.status !== statusFilter)
      )
        return false;
      if (categoryFilter === "NONE" && v.categoryId) return false;
      if (categoryFilter !== "ALL" && categoryFilter !== "NONE" && v.categoryId !== categoryFilter)
        return false;
      if (q) {
        const haystack =
          `${v.brand} ${v.model} ${v.year} ${v.color ?? ""} ${v.licensePlate ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "vehicle") cmp = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        else if (sortKey === "year") cmp = a.year - b.year;
        else if (sortKey === "dailyPrice") cmp = (a.dailyPrice ?? 0) - (b.dailyPrice ?? 0);
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        return cmp * dir;
      });
    }
    return rows;
  }, [vehicles, query, typeFilter, statusFilter, categoryFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(vehicle: VehicleDTO) {
    setEditing(vehicle);
    setFormOpen(true);
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    const target = archiveTarget;
    startTransition(async () => {
      const result = await archiveVehicleAction(target.id);
      if (result.ok) toast.success("Vehicle archived");
      else toast.error(result.error);
      setArchiveTarget(null);
    });
  }

  function restore(vehicle: VehicleDTO) {
    startTransition(async () => {
      const result = await restoreVehicleAction(vehicle.id);
      if (result.ok) toast.success("Vehicle restored");
      else toast.error(result.error);
    });
  }

  const totalActive = vehicles.filter((v) => !v.archived).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search brand, model, plate…"
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as typeof typeFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="CAR">Cars</SelectItem>
            <SelectItem value="MOTORCYCLE">Motorcycles</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">All active</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="HIDDEN">Hidden</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
            <SelectItem value="NONE">Uncategorized</SelectItem>
          </SelectContent>
        </Select>

        {canManage && (
          <>
            <Button variant="outline" onClick={() => setCategoryOpen(true)}>
              <Tags /> Categories
            </Button>
            <Button onClick={openCreate}>
              <Plus /> Add vehicle
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      {totalActive === 0 && statusFilter === "ACTIVE" && !query ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your first car or motorcycle to start building your fleet."
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus /> Add your first vehicle
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton label="Vehicle" active={sortKey === "vehicle"} dir={sortDir} onClick={() => toggleSort("vehicle")} />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Specs</TableHead>
                <TableHead>
                  <SortButton label="Year" active={sortKey === "year"} dir={sortDir} onClick={() => toggleSort("year")} />
                </TableHead>
                <TableHead>
                  <SortButton label="Daily" active={sortKey === "dailyPrice"} dir={sortDir} onClick={() => toggleSort("dailyPrice")} />
                </TableHead>
                <TableHead>
                  <SortButton label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    No vehicles match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((v) => (
                  <TableRow key={v.id} className={cn(v.archived && "opacity-60")}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md">
                          {v.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- stub accepts arbitrary URLs; Cloudinary + next/image arrive later in Phase 2
                            <img
                              src={v.coverImageUrl}
                              alt={`${v.brand} ${v.model}`}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Car className="text-muted-foreground size-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {v.brand} {v.model}
                            </span>
                            {v.featured && <Badge variant="secondary">Featured</Badge>}
                            {v.archived && <Badge variant="outline">Archived</Badge>}
                          </div>
                          <p className="text-muted-foreground truncate text-xs">
                            {v.type === "CAR" ? "Car" : "Motorcycle"} · {v.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.categoryName ? (
                        <span className="text-sm">{v.categoryName}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-xs">
                        {TRANSMISSION_LABEL[v.transmission]} · {FUEL_LABEL[v.fuel]}
                        {v.seats ? ` · ${v.seats} seats` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{v.year}</TableCell>
                    <TableCell className="tabular-nums">
                      {v.dailyPrice != null ? (
                        formatCurrency(v.dailyPrice)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_META[v.status].variant}>
                        {STATUS_META[v.status].label}
                      </Badge>
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
                            {v.archived ? (
                              <DropdownMenuItem onClick={() => restore(v)} disabled={pending}>
                                <RotateCcw /> Restore
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(v)}>
                                  <Pencil /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setArchiveTarget(v)}
                                >
                                  <Trash2 /> Archive
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {currentPage * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE + PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {canManage && (
        <>
          <VehicleFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            vehicle={editing}
            categories={categories}
            cloudinaryConfigured={cloudinaryConfigured}
          />
          <CategoryManagerDialog
            open={categoryOpen}
            onOpenChange={setCategoryOpen}
            categories={categories}
          />
          <Dialog open={archiveTarget != null} onOpenChange={(o) => !o && setArchiveTarget(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Archive this vehicle?</DialogTitle>
                <DialogDescription>
                  {archiveTarget && (
                    <>
                      &ldquo;{archiveTarget.brand} {archiveTarget.model}&rdquo; will be hidden from
                      your website and lists. This is a soft delete — you can restore it anytime
                      from the Archived filter.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setArchiveTarget(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmArchive} disabled={pending}>
                  {pending ? "Archiving…" : "Archive"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1 font-medium transition-colors"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" />
      )}
    </button>
  );
}
