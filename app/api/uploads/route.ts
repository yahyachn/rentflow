import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireUser, userHasPermission } from "@/lib/tenant";

/**
 * Local-disk upload fallback: this product ships without requiring a
 * Cloudinary account (see lib/cloudinary.ts#isCloudinaryConfigured — an
 * agency can skip that setup entirely and images are just saved to disk
 * instead). `features/fleet/image-uploader.tsx` uses this route whenever
 * Cloudinary isn't configured.
 *
 * Trade-off worth knowing: this writes to the local filesystem
 * (`public/uploads/`), which works for a normal server/VPS deployment but
 * NOT for a serverless/ephemeral-filesystem host (e.g. Vercel) — Cloudinary
 * (or another object store) is still the right choice there.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  if (!(await userHasPermission("fleet.manage"))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const ext = ACCEPTED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", user.agencyId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${user.agencyId}/${filename}` });
}
