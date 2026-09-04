"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { assignRoleAction, createTeamMemberAction, setMemberStatusAction } from "@/actions/team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { createTeamMemberSchema } from "@/validators/team";
import { formatDate, initials } from "@/lib/utils";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  roleId: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<TeamMember["status"], "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  INVITED: "secondary",
  SUSPENDED: "destructive",
};

export function TeamManager({
  members,
  roles,
  currentUserId,
}: {
  members: TeamMember[];
  roles: { id: string; name: string }[];
  currentUserId: string;
}) {
  const t = useTranslations("set");
  const [rows, setRows] = useState(members);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [createPending, startCreateTransition] = useTransition();
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const [createError, setCreateError] = useState<string | null>(null);

  function submitCreate() {
    const parsed = createTeamMemberSchema.safeParse(createForm);
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? t("tmInvalid"));
      return;
    }
    startCreateTransition(async () => {
      const result = await createTeamMemberAction(parsed.data);
      if (result.ok) {
        toast.success(t("tmCreated"));
        setCreateOpen(false);
        setCreateForm({ name: "", email: "", password: "", roleId: "" });
        setCreateError(null);
        window.location.reload();
      } else {
        setCreateError(result.error);
      }
    });
  }

  function changeRole(member: TeamMember, roleId: string) {
    const prev = member.roleId;
    setRows((r) => r.map((m) => (m.id === member.id ? { ...m, roleId } : m)));
    setPendingId(member.id);
    startTransition(async () => {
      const result = await assignRoleAction(member.id, roleId);
      if (result.ok) {
        toast.success(t("tmRoleUpdated"));
      } else {
        setRows((r) => r.map((m) => (m.id === member.id ? { ...m, roleId: prev } : m)));
        toast.error(result.error);
      }
      setPendingId(null);
    });
  }

  function toggleStatus(member: TeamMember) {
    const next = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setPendingId(member.id);
    startTransition(async () => {
      const result = await setMemberStatusAction(member.id, next);
      if (result.ok) {
        setRows((r) => r.map((m) => (m.id === member.id ? { ...m, status: next } : m)));
        toast.success(next === "ACTIVE" ? t("tmReactivated") : t("tmSuspendedToast"));
      } else {
        toast.error(result.error);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm">
              <Plus /> {t("tmNewMember")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("tmNewMember")}</DialogTitle>
              <DialogDescription>{t("tmNewMemberDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="tm-name">{t("tmName")}</Label>
                <Input
                  id="tm-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tm-email">{t("tmEmail")}</Label>
                <Input
                  id="tm-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tm-password">{t("tmPassword")}</Label>
                <Input
                  id="tm-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("tmRole")}</Label>
                <Select
                  value={createForm.roleId}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, roleId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("tmNoRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createError && <p className="text-destructive text-xs">{createError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" onClick={submitCreate} disabled={createPending}>
                {t("tmCreate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("tmMember")}</TableHead>
            <TableHead>{t("tmRole")}</TableHead>
            <TableHead>{t("tmStatus")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("tmJoined")}</TableHead>
            <TableHead className="text-right">{t("tmActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => {
            const isSelf = m.id === currentUserId;
            const busy = pendingId === m.id;
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {m.image && <AvatarImage src={m.image} alt={m.name} />}
                      <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.name}</span>
                        {isSelf && <Badge variant="outline">{t("tmYou")}</Badge>}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={m.roleId ?? ""}
                    onValueChange={(v) => changeRole(m, v)}
                    disabled={isSelf || busy}
                  >
                    <SelectTrigger className="w-36" size="sm">
                      <SelectValue placeholder={t("tmNoRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[m.status]}>{t(`tm${m.status.charAt(0)}${m.status.slice(1).toLowerCase()}`)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                  {formatDate(m.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {!isSelf && (
                    <Button
                      variant={m.status === "ACTIVE" ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleStatus(m)}
                      disabled={busy}
                    >
                      {m.status === "ACTIVE" ? t("tmSuspend") : t("tmActivate")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
