/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough to blunt abuse of public endpoints (e.g. the website booking
 * form) on a single instance. It resets on restart and is per-process, so a
 * multi-instance deployment should swap this for a shared store (Redis /
 * Upstash) behind the same `rateLimit` signature.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup so the map can't grow without bound.
    if (store.size > 5000) {
      for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}
