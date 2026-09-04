"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, GripVertical, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";

import { publishPageAction, saveDraftBlocksAction } from "@/actions/website";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BLOCK_TYPES, createBlock, type Block, type BlockType } from "@/validators/website-blocks";
import type { PublicVehicle } from "@/services/vehicles";
import type { LinkAgencyContact } from "@/components/website/link-target";
import { BlockInspector } from "@/features/website/block-inspector";
import { EditorPreview } from "@/features/website/editor-preview";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY_MS = 900;

export function PageEditor({
  page,
  agency,
  vehicles,
  categories,
  canPublish,
}: {
  page: {
    id: string;
    title: string;
    slug: string;
    isHome: boolean;
    status: "DRAFT" | "PUBLISHED";
    publishedAt: string | null;
    blocks: Block[];
  };
  agency: LinkAgencyContact;
  vehicles: PublicVehicle[];
  categories: { id: string; name: string }[];
  canPublish: boolean;
}) {
  const t = useTranslations("web");
  const [blocks, setBlocks] = useState<Block[]>(page.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(page.blocks[0]?.id ?? null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishing, setPublishing] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const scheduleSave = useCallback(
    (next: Block[]) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const result = await saveDraftBlocksAction(page.id, next);
        setSaveStatus(result.ok ? "saved" : "error");
      }, AUTOSAVE_DELAY_MS);
    },
    [page.id],
  );

  function updateBlocks(updater: (prev: Block[]) => Block[]) {
    setBlocks((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    updateBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  }

  function duplicateBlock(id: string) {
    updateBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy: Block = { ...prev[idx], id: createBlock(prev[idx].type).id };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function deleteBlock(id: string) {
    updateBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function toggleHidden(id: string) {
    updateBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b)));
  }

  function updateSelectedBlock(next: Block) {
    updateBlocks((prev) => prev.map((b) => (b.id === next.id ? next : b)));
  }

  async function publish() {
    setPublishing(true);
    const result = await publishPageAction(page.id);
    setPublishing(false);
    if (result.ok) toast.success(t("published"));
    else toast.error(result.error);
  }

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const publicHref = page.slug ? `/${page.slug}` : "/";

  return (
    <div className="flex h-[calc(100svh-6.5rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{page.title}</p>
          <p className="text-muted-foreground text-xs">
            {saveStatus === "saving" && t("saving")}
            {saveStatus === "saved" && t("saved")}
            {saveStatus === "error" && <span className="text-destructive">{t("saveError")}</span>}
            {saveStatus === "idle" &&
              (page.status === "PUBLISHED" ? (
                <Badge variant="success">{t("published")}</Badge>
              ) : (
                <Badge variant="outline">{t("draft")}</Badge>
              ))}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="mr-2 flex items-center gap-0.5 rounded-md border p-0.5">
            <Button
              type="button"
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop preview"
            >
              <Monitor className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile preview"
            >
              <Smartphone className="size-3.5" />
            </Button>
          </div>
          <a href={publicHref} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline" size="sm">
              <Eye /> {t("viewLive")}
            </Button>
          </a>
          {canPublish && (
            <Button type="button" size="sm" onClick={publish} disabled={publishing}>
              {t("publish")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[260px_1fr_320px]">
        <div className="flex flex-col overflow-y-auto rounded-lg border bg-card p-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {blocks.map((block) => (
                  <SortableBlockRow
                    key={block.id}
                    id={block.id}
                    label={t(`blockType_${block.type}`)}
                    hidden={block.hidden}
                    selected={block.id === selectedId}
                    onSelect={() => setSelectedId(block.id)}
                    onToggleHidden={() => toggleHidden(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="mt-2 w-full">
                <Plus /> {t("addSection")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {BLOCK_TYPES.map((type) => (
                <DropdownMenuItem key={type} onSelect={() => addBlock(type)}>
                  {t(`blockType_${type}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-muted/30 overflow-y-auto rounded-lg border p-4">
          <div className={cn("bg-background mx-auto transition-all", device === "mobile" ? "max-w-sm" : "max-w-full")}>
            <EditorPreview
              blocks={blocks}
              agency={agency}
              vehicles={vehicles}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        <div className="overflow-y-auto rounded-lg border bg-card p-4">
          {selected ? (
            <BlockInspector block={selected} categories={categories} onChange={updateSelectedBlock} />
          ) : (
            <p className="text-muted-foreground text-sm">{t("selectSection")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableBlockRow({
  id,
  label,
  hidden,
  selected,
  onSelect,
  onToggleHidden,
  onDuplicate,
  onDelete,
}: {
  id: string;
  label: string;
  hidden: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md border px-1.5 py-1.5 text-sm",
        selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab touch-none px-0.5"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className={cn("min-w-0 flex-1 truncate text-left", hidden && "text-muted-foreground line-through")}
      >
        {label}
      </button>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={onToggleHidden} className="text-muted-foreground p-1" aria-label="Toggle visibility">
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <button type="button" onClick={onDuplicate} className="text-muted-foreground p-1" aria-label="Duplicate">
          <Copy className="size-3.5" />
        </button>
        <button type="button" onClick={onDelete} className="text-destructive p-1" aria-label="Delete">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
