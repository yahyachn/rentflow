"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink, FileText, Home, Plus } from "lucide-react";
import { toast } from "sonner";

import { createPageAction, updateBrandColorsAction } from "@/actions/website";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createPageSchema } from "@/validators/website";
import { formatDate, slugify } from "@/lib/utils";

export type PageSummary = {
  id: string;
  slug: string;
  title: string;
  isHome: boolean;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  publishedAt: string | null;
};

export function WebsiteOverview({
  pages,
  agency,
  canEdit,
  canPublish,
}: {
  pages: PageSummary[];
  agency: { primaryColor: string; accentColor: string };
  canEdit: boolean;
  canPublish: boolean;
}) {
  const t = useTranslations("web");
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: "", slug: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState(agency);

  function handleTitleChange(title: string) {
    setForm((f) => ({ title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  function submitCreate() {
    const parsed = createPageSchema.safeParse(form);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? t("invalid");
      setError(message);
      toast.error(message);
      return;
    }
    startTransition(async () => {
      const result = await createPageAction(parsed.data);
      if (result.ok) {
        toast.success(t("pageCreated"));
        setCreateOpen(false);
        setForm({ title: "", slug: "" });
        setSlugTouched(false);
        window.location.reload();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function saveColors() {
    startTransition(async () => {
      const result = await updateBrandColorsAction(colors);
      if (result.ok) toast.success(t("themeSaved"));
      else toast.error(result.error);
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        {canEdit && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> {t("newPage")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("newPage")}</DialogTitle>
                <DialogDescription>{t("newPageDesc")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="page-title">{t("pageTitle")}</Label>
                  <Input id="page-title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="page-slug">{t("pageSlug")}</Label>
                  <Input
                    id="page-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    placeholder="about, services/airport-transfer"
                  />
                  <p className="text-muted-foreground text-xs">{t("pageSlugHint")}</p>
                </div>
                {error && <p className="text-destructive text-xs">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" onClick={submitCreate} disabled={pending}>
                  {t("create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pagesTitle")}</CardTitle>
          <CardDescription>{t("pagesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/dashboard/website/${page.id}`}
              className="hover:bg-muted/60 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {page.isHome ? (
                  <Home className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{page.title}</p>
                  <p className="text-muted-foreground truncate text-xs">/{page.slug}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={page.status === "PUBLISHED" ? "success" : "outline"}>
                  {page.status === "PUBLISHED" ? t("published") : t("draft")}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {formatDate(new Date(page.updatedAt), { month: "short", day: "numeric" })}
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("themeTitle")}</CardTitle>
          <CardDescription>{t("themeDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="primary-color">{t("primaryColor")}</Label>
              <div className="flex items-center gap-2">
                <input
                  id="primary-color"
                  type="color"
                  value={colors.primaryColor}
                  disabled={!canEdit}
                  onChange={(e) => setColors((c) => ({ ...c, primaryColor: e.target.value }))}
                  className="border-input size-9 shrink-0 rounded-md border p-0.5 disabled:opacity-50"
                />
                <Input
                  value={colors.primaryColor}
                  disabled={!canEdit}
                  onChange={(e) => setColors((c) => ({ ...c, primaryColor: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="accent-color">{t("accentColor")}</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent-color"
                  type="color"
                  value={colors.accentColor}
                  disabled={!canEdit}
                  onChange={(e) => setColors((c) => ({ ...c, accentColor: e.target.value }))}
                  className="border-input size-9 shrink-0 rounded-md border p-0.5 disabled:opacity-50"
                />
                <Input
                  value={colors.accentColor}
                  disabled={!canEdit}
                  onChange={(e) => setColors((c) => ({ ...c, accentColor: e.target.value }))}
                />
              </div>
            </div>
          </div>
          {canEdit && (
            <Button type="button" size="sm" onClick={saveColors} disabled={pending}>
              {t("saveTheme")}
            </Button>
          )}
        </CardContent>
      </Card>

      {!canPublish && (
        <p className="text-muted-foreground text-xs">{t("publishRestricted")}</p>
      )}

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground inline-flex items-center gap-1.5 text-xs hover:underline"
      >
        {t("viewLiveSite")} <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
