import { createHash } from "node:crypto";

/**
 * Server-only Cloudinary helpers. We deliberately avoid the `cloudinary` npm
 * SDK: signed uploads and deletes are a short SHA-1 signature plus a `fetch`,
 * which keeps the dependency footprint lean (in the same spirit as the
 * driver-adapter choice for Prisma — see ARCHITECTURE.md).
 *
 * Security model (signed direct upload):
 *   - The browser uploads the file straight to Cloudinary, never through our
 *     server, so large files don't hit the Next.js Server Action body limit.
 *   - The upload is authorized by a signature minted here from the API secret.
 *     The secret never leaves the server; only the (public) API key, a
 *     timestamp, the folder, and the signature are sent to the client.
 *
 * NEVER import this module from a Client Component — it reads server-only env
 * vars and uses node:crypto.
 */

function config() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  };
}

/** True only when all three Cloudinary env vars are set. The UI uses this to
 * show a setup notice instead of a dead upload button. */
export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = config();
  return Boolean(cloudName && apiKey && apiSecret);
}

/** Cloudinary's signing scheme: sort the signed params, join as
 * `k=v&k=v`, append the API secret, SHA-1, hex-encode. */
function sign(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Mint the params a browser needs to POST one signed upload to
 * `https://api.cloudinary.com/v1_1/<cloudName>/image/upload`. The client must
 * send exactly the signed params (folder + timestamp) alongside file/api_key. */
export function signUpload(folder: string): UploadSignature {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ folder, timestamp }, apiSecret);
  return { cloudName, apiKey, timestamp, folder, signature };
}

/** Best-effort delete of an asset by its public_id (used when a vehicle image
 * is removed/replaced). Failures are swallowed — a leftover asset is not worth
 * failing the surrounding DB write over. */
export async function destroyImage(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = config();
  if (!cloudName || !apiKey || !apiSecret) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, apiSecret);
  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
  });

  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body,
    });
  } catch {
    // ignore — cleanup is best-effort
  }
}
