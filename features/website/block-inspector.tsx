"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, type Locale } from "@/i18n/config";
import {
  STAT_ICONS,
  newBlockId,
  type Block,
  type ButtonConfig,
  type LinkTarget,
  type LocalizedRichText,
  type LocalizedText,
  type StatIcon,
} from "@/validators/website-blocks";

/**
 * Per-block-type properties panel. Extending the builder with a new block
 * type: add a `case` here alongside the schema + view (see
 * validators/website-blocks.ts and components/website/blocks/*).
 */
export function BlockInspector({
  block,
  categories,
  onChange,
}: {
  block: Block;
  categories: { id: string; name: string }[];
  onChange: (next: Block) => void;
}) {
  const t = useTranslations("web");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t(`blockType_${block.type}`)}</p>
        <div className="flex items-center gap-2">
          <Label htmlFor="blk-hidden" className="text-muted-foreground text-xs font-normal">
            {t("hidden")}
          </Label>
          <Switch
            id="blk-hidden"
            checked={block.hidden}
            onCheckedChange={(v) => onChange({ ...block, hidden: v })}
          />
        </div>
      </div>

      {block.type === "hero" && (
        <>
          <LocalizedTextField label={t("eyebrow")} value={block.eyebrow} onChange={(v) => onChange({ ...block, eyebrow: v })} />
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <LocalizedRichTextField label={t("fieldSubtitle")} value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
          <ImageUrlField label={t("image")} value={block.imageUrl} onChange={(v) => onChange({ ...block, imageUrl: v })} />
          <ButtonField label={t("primaryButton")} value={block.primaryButton} onChange={(v) => onChange({ ...block, primaryButton: v })} />
          <ButtonField label={t("secondaryButton")} value={block.secondaryButton} onChange={(v) => onChange({ ...block, secondaryButton: v })} />
        </>
      )}

      {block.type === "richText" && (
        <>
          <LocalizedTextField label={t("heading")} value={block.heading} onChange={(v) => onChange({ ...block, heading: v })} />
          <LocalizedRichTextField label={t("body")} value={block.body} onChange={(v) => onChange({ ...block, body: v })} />
          <div className="grid gap-1.5">
            <Label>{t("alignment")}</Label>
            <Select value={block.alignment} onValueChange={(v) => onChange({ ...block, alignment: v as "start" | "center" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="start">{t("alignStart")}</SelectItem>
                <SelectItem value="center">{t("alignCenter")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {block.type === "image" && (
        <>
          <ImageUrlField label={t("image")} value={block.imageUrl} onChange={(v) => onChange({ ...block, imageUrl: v })} />
          <LocalizedTextField label={t("altText")} value={block.alt} onChange={(v) => onChange({ ...block, alt: v })} />
          <LocalizedTextField label={t("caption")} value={block.caption} onChange={(v) => onChange({ ...block, caption: v })} />
        </>
      )}

      {block.type === "cta" && (
        <>
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <LocalizedRichTextField label={t("fieldSubtitle")} value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
          <ButtonField label={t("button")} value={block.button} onChange={(v) => onChange({ ...block, button: v })} />
        </>
      )}

      {block.type === "vehicleGrid" && (
        <>
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <LocalizedRichTextField label={t("fieldSubtitle")} value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
          <div className="grid gap-1.5">
            <Label>{t("source")}</Label>
            <Select value={block.source} onValueChange={(v) => onChange({ ...block, source: v as typeof block.source })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">{t("sourceFeatured")}</SelectItem>
                <SelectItem value="latest">{t("sourceLatest")}</SelectItem>
                <SelectItem value="all">{t("sourceAll")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("vehicleType")}</Label>
            <Select value={block.vehicleType} onValueChange={(v) => onChange({ ...block, vehicleType: v as typeof block.vehicleType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("all")}</SelectItem>
                <SelectItem value="CAR">{t("cars")}</SelectItem>
                <SelectItem value="MOTORCYCLE">{t("motorcycles")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {categories.length > 0 && (
            <div className="grid gap-1.5">
              <Label>{t("categories")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const active = block.categoryIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...block,
                          categoryIds: active
                            ? block.categoryIds.filter((id) => id !== c.id)
                            : [...block.categoryIds, c.id],
                        })
                      }
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>{t("sort")}</Label>
            <Select value={block.sort} onValueChange={(v) => onChange({ ...block, sort: v as typeof block.sort })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
                <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("limit")}</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={block.limit}
              onChange={(e) => onChange({ ...block, limit: Math.max(1, Math.min(24, Number(e.target.value) || 1)) })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-normal">{t("showViewAllButton")}</Label>
            <Switch checked={block.showViewAllButton} onCheckedChange={(v) => onChange({ ...block, showViewAllButton: v })} />
          </div>
        </>
      )}

      {block.type === "faq" && (
        <>
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <div className="space-y-3">
            <Label>{t("items")}</Label>
            {block.items.map((item, idx) => (
              <div key={item.id} className="space-y-2 rounded-md border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...block, items: block.items.filter((i) => i.id !== item.id) })}
                    className="text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <LocalizedTextField
                  label={t("question")}
                  value={item.question}
                  onChange={(v) =>
                    onChange({ ...block, items: block.items.map((i) => (i.id === item.id ? { ...i, question: v } : i)) })
                  }
                />
                <LocalizedRichTextField
                  label={t("answer")}
                  value={item.answer}
                  onChange={(v) =>
                    onChange({ ...block, items: block.items.map((i) => (i.id === item.id ? { ...i, answer: v } : i)) })
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                onChange({
                  ...block,
                  items: [
                    ...block.items,
                    { id: newBlockId(), question: emptyText(), answer: emptyRich() },
                  ],
                })
              }
            >
              <Plus /> {t("addQuestion")}
            </Button>
          </div>
        </>
      )}

      {block.type === "reviews" && (
        <>
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <div className="grid gap-1.5">
            <Label>{t("limit")}</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={block.limit}
              onChange={(e) => onChange({ ...block, limit: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
            />
          </div>
        </>
      )}

      {block.type === "spacer" && (
        <div className="grid gap-1.5">
          <Label>{t("height")}</Label>
          <Select value={block.height} onValueChange={(v) => onChange({ ...block, height: v as typeof block.height })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["none", "sm", "md", "lg", "xl"] as const).map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {block.type === "stats" && (
        <>
          <LocalizedTextField label={t("fieldTitle")} value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
          <LocalizedRichTextField label={t("fieldSubtitle")} value={block.subtitle} onChange={(v) => onChange({ ...block, subtitle: v })} />
          <div className="space-y-3">
            <Label>{t("statItems")}</Label>
            {block.items.map((item, idx) => (
              <div key={item.id} className="space-y-2 rounded-md border p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...block, items: block.items.filter((i) => i.id !== item.id) })}
                    className="text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label>{t("statValue")}</Label>
                    <Input
                      value={item.value}
                      placeholder="150+"
                      onChange={(e) =>
                        onChange({
                          ...block,
                          items: block.items.map((i) => (i.id === item.id ? { ...i, value: e.target.value } : i)),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t("statIcon")}</Label>
                    <Select
                      value={item.icon}
                      onValueChange={(v) =>
                        onChange({
                          ...block,
                          items: block.items.map((i) => (i.id === item.id ? { ...i, icon: v as StatIcon } : i)),
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAT_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <LocalizedTextField
                  label={t("statLabel")}
                  value={item.label}
                  onChange={(v) =>
                    onChange({ ...block, items: block.items.map((i) => (i.id === item.id ? { ...i, label: v } : i)) })
                  }
                />
              </div>
            ))}
            {block.items.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  onChange({
                    ...block,
                    items: [...block.items, { id: newBlockId(), value: "", label: emptyText(), icon: "car" }],
                  })
                }
              >
                <Plus /> {t("addStat")}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function emptyText(): LocalizedText {
  return { fr: "", ar: "", en: "" };
}
function emptyRich(): LocalizedRichText {
  return { fr: "", ar: "", en: "" };
}

function LocalizedTextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {locales.map((locale: Locale) => (
        <Input
          key={locale}
          value={value[locale]}
          placeholder={localeNames[locale]}
          onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
        />
      ))}
    </div>
  );
}

function LocalizedRichTextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedRichText;
  onChange: (v: LocalizedRichText) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {locales.map((locale: Locale) => (
        <Textarea
          key={locale}
          value={value[locale]}
          placeholder={localeNames[locale]}
          rows={2}
          onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
        />
      ))}
    </div>
  );
}

function ImageUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        placeholder="https://..."
        onChange={(e) => onChange(e.target.value.trim() ? e.target.value.trim() : null)}
      />
    </div>
  );
}

const LINK_KINDS: LinkTarget["kind"][] = [
  "none",
  "vehicles",
  "vehicle",
  "category",
  "page",
  "contact",
  "whatsapp",
  "phone",
  "email",
  "anchor",
  "external",
];

function LinkTargetField({ value, onChange }: { value: LinkTarget; onChange: (v: LinkTarget) => void }) {
  const t = useTranslations("web");
  const needsValue = value.kind === "vehicle" || value.kind === "category" || value.kind === "page";
  const needsAnchor = value.kind === "anchor";
  const needsUrl = value.kind === "external";

  return (
    <div className="space-y-1.5">
      <Select
        value={value.kind}
        onValueChange={(kind) => {
          const next = kind as LinkTarget["kind"];
          if (next === "vehicle" || next === "category" || next === "page") onChange({ kind: next, slug: "" });
          else if (next === "anchor") onChange({ kind: next, id: "" });
          else if (next === "external") onChange({ kind: next, url: "" });
          else onChange({ kind: next } as LinkTarget);
        }}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {LINK_KINDS.map((k) => (
            <SelectItem key={k} value={k}>
              {t(`linkKind_${k}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {needsValue && "slug" in value && (
        <Input
          value={value.slug}
          placeholder={t("linkSlugPlaceholder")}
          onChange={(e) => onChange({ ...value, slug: e.target.value } as LinkTarget)}
        />
      )}
      {needsAnchor && "id" in value && (
        <Input value={value.id} placeholder="section-id" onChange={(e) => onChange({ ...value, id: e.target.value } as LinkTarget)} />
      )}
      {needsUrl && "url" in value && (
        <Input
          value={value.url}
          placeholder="https://..."
          onChange={(e) => onChange({ ...value, url: e.target.value } as LinkTarget)}
        />
      )}
    </div>
  );
}

function ButtonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ButtonConfig;
  onChange: (v: ButtonConfig) => void;
}) {
  const t = useTranslations("web");
  return (
    <div className="space-y-2 rounded-md border p-2.5">
      <p className="text-xs font-medium">{label}</p>
      <LocalizedTextField label={t("buttonLabel")} value={value.label} onChange={(v) => onChange({ ...value, label: v })} />
      <div className="grid gap-1.5">
        <Label>{t("buttonLink")}</Label>
        <LinkTargetField value={value.link} onChange={(link) => onChange({ ...value, link })} />
      </div>
      <div className="grid gap-1.5">
        <Label>{t("buttonStyle")}</Label>
        <Select value={value.style} onValueChange={(v) => onChange({ ...value, style: v as ButtonConfig["style"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">{t("styPrimary")}</SelectItem>
            <SelectItem value="secondary">{t("stySecondary")}</SelectItem>
            <SelectItem value="outline">{t("styOutline")}</SelectItem>
            <SelectItem value="ghost">{t("styGhost")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
