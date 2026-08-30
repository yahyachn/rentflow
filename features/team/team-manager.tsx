"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignRoleAction, setMemberStatusAction } from "@/actions/team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_META: Record<
  TeamMember["status"],
  { label: string; variant: "success" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  INVITED: { label: "Invited", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
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
  const [rows, setRows] = useState(members);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function changeRole(member: TeamMember, roleId: string) {
    const prev = member.roleId;
    setRows((r) => r.map((m) => (m.id === member.id ? { ...m, roleId } : m)));
    setPendingId(member.id);
    startTransition(async () => {
      const result = await assignRoleAction(member.id, roleId);
      if (result.ok) {
        toast.success("Role updated");
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
        toast.success(next === "ACTIVE" ? "Member reactivated" : "Member suspended");
      } else {
        toast.error(result.error);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                        {isSelf && <Badge variant="outline">You</Badge>}
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
                      <SelectValue placeholder="No role" />
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
                  <Badge variant={STATUS_META[m.status].variant}>
                    {STATUS_META[m.status].label}
                  </Badge>
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
                      {m.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
