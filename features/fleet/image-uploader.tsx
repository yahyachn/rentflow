"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { getUploadSignatureAction } from "@/actions/fleet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VehicleImageDTO } from "./types";

const MAX_IMAGES = 12;
const MAX_FILE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/** Guarantee exactly one cover: keep an existing flag, else promote the first. */
function withOneCover(list: VehicleImageDTO[]): VehicleImageDTO[] {
  if (list.length === 0) return list;
  if (list.some((img) => img.isCover)) return list;
  return list.map((img, i) => ({ ...img, isCover: i === 0 }));
}

export function ImageUploader({
  value,
  onChange,
  configured,
}: {
  value: VehicleImageDTO[];
  onChange: (images: VehicleImageDTO[]) => void;
  configured: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${file.name}: larger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    // One signature is valid for this whole batch (Cloudinary accepts a
    // recent timestamp), so fetch it once.
    const sig = await getUploadSignatureAction();
    if (!sig.ok) {
      toast.error(sig.error);
      return;
    }

    setUploading((n) => n + accepted.length);
    const uploaded: VehicleImageDTO[] = [];
    for (const file of accepted) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.data.apiKey);
        form.append("timestamp", String(sig.data.timestamp));
        form.append("folder", sig.data.folder);
        form.append("signature", sig.data.signature);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.data.cloudName}/image/upload`,
          { method: "POST", body: form },
        );
        const json = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };

        if (res.ok && json.secure_url) {
          uploaded.push({ url: json.secure_url, publicId: json.public_id ?? null, isCover: false });
        } else {
          toast.error(json.error?.message ?? `Upload failed for ${file.name}.`);
        }
      } catch {
        toast.error(`Upload failed for ${file.name}.`);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }

    if (uploaded.length > 0) onChange(withOneCover([...value, ...uploaded]));
  }

  function setCover(index: number) {
    onChange(value.map((img, i) => ({ ...img, isCover: i === index })));
  }

  function remove(index: number) {
    onChange(withOneCover(value.filter((_, i) => i !== index)));
  }

  const busy = uploading > 0;
  const full = value.length >= MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Images</p>
        <span className="text-muted-foreground text-xs">
          {value.length}/{MAX_IMAGES}
        </span>
      </div>

      {!configured && (
        <p className="bg-muted/50 text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
          Image uploads need Cloudinary configured. Add <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code>CLOUDINARY_API_KEY</code>, and <code>CLOUDINARY_API_SECRET</code> to{" "}
          <code>.env</code> (see the README), then restart the dev server. Existing images are
          still editable below.
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-md border",
                img.isCover && "ring-primary ring-2",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- editor thumbnail; the public site uses next/image */}
              <img src={img.url} alt="" className="size-full object-cover" />

              {img.isCover && (
                <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1 text-[10px] font-medium">
                  Cover
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isCover && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-7"
                    onClick={() => setCover(i)}
                    aria-label="Set as cover"
                    title="Set as cover"
                  >
                    <Star className="size-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="size-7"
                  onClick={() => remove(i)}
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={!configured || busy || full}
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" /> Uploading…
          </>
        ) : value.length > 0 ? (
          <>
            <Upload /> Add more images
          </>
        ) : (
          <>
            <ImagePlus /> Upload images
          </>
        )}
      </Button>
      {value.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Hover an image to set it as the cover or remove it.
        </p>
      )}
    </div>
  );
}
