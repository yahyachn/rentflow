"use client";

import { useEffect, useState, useTransition } from "react";
import { Lock, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/actions/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions";

export interface RoleDTO {
  id: string;
  name: string;
  isSystem: boolean;
  permissionKeys: string[];
  memberCount: number;
}

export function RolesManager({ roles }: { roles: RoleDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteRoleAction(target.id);
      if (result.ok) toast.success("Role deleted");
      else toast.error(result.error);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="text-muted-foreground size-4" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  <Badge variant={role.isSystem ? "secondary" : "outline"}>
                    {role.isSystem ? "Built-in" : "Custom"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {role.permissionKeys.length} permissions · {role.memberCount}{" "}
                  {role.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {role.isSystem ? (
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <Lock className="size-3" /> Locked
                </span>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      setEditing(role);
                      setFormOpen(true);
                    }}
                    aria-label={`Edit ${role.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-8"
                    onClick={() => setDeleteTarget(role)}
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={openCreate}>
        <Plus /> New role
      </Button>

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editing} />

      <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this role?</DialogTitle>
            <DialogDescription>
              {deleteTarget &&
                `“${deleteTarget.name}” will be removed. ${
                  deleteTarget.memberCount > 0
                    ? `Its ${deleteTarget.memberCount} member(s) will be left without a role until reassigned.`
                    : ""
                }`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending ? "Deleting…" : "Delete role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDTO | null;
}) {
  const isEdit = role != null;
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setSelected(new Set(role?.permissionKeys ?? []));
      setError(null);
    }
  }, [open, role]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    if (name.trim().length < 2) {
      setError("Enter a role name (2+ characters).");
      return;
    }
    const payload = { name: name.trim(), permissions: [...selected] };
    startTransition(async () => {
      const result = isEdit
        ? await updateRoleAction(role.id, payload)
        : await createRoleAction(payload);
      if (result.ok) {
        toast.success(isEdit ? "Role updated" : "Role created");
        onOpenChange(false);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>Pick a name and the permissions this role grants.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front desk"
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <div className="space-y-3">
            {PERMISSION_GROUPS.map((group) => {
              const perms = PERMISSIONS.filter((p) => p.group === group);
              if (perms.length === 0) return null;
              return (
                <div key={group}>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                    {group}
                  </p>
                  <div className="space-y-1.5">
                    {perms.map((p) => (
                      <label
                        key={p.key}
                        className="hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5"
                      >
                        <Checkbox
                          checked={selected.has(p.key)}
                          onCheckedChange={() => toggle(p.key)}
                          className="mt-0.5"
                        />
                        <span className="text-sm">
                          <span className="font-medium">{p.label}</span>
                          <span className="text-muted-foreground block text-xs">{p.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
