import { getRedis } from "@/lib/redis";

/**
 * Code cache for the public redirect hot path. Keyed by shortCode, stores the
 * code id + destination so a cache hit can both redirect AND record a scan
 * without touching the database. All helpers no-op when Redis isn't configured.
 */

const TTL_SECONDS = 60 * 60 * 24; // 1 day

export type CachedCode = { id: string; destinationUrl: string };

function destKey(shortCode: string) {
  return `qr:dest:${shortCode}`;
}

/** Cached code (id + destination), or null on miss / no Redis. */
export async function getCachedCode(
  shortCode: string,
): Promise<CachedCode | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<CachedCode>(destKey(shortCode));
}

export async function cacheCode(
  shortCode: string,
  code: CachedCode,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(destKey(shortCode), code, { ex: TTL_SECONDS });
}

/** Drop the cached code — call whenever a code's destination or active-state
 *  changes so the next scan re-reads from the database. */
export async function invalidateDestination(shortCode: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(destKey(shortCode));
}
