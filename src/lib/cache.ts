import { getRedis } from "@/lib/redis";

/**
 * Destination cache for the public redirect hot path. Keyed by shortCode.
 * All helpers no-op when Redis isn't configured.
 */

const TTL_SECONDS = 60 * 60 * 24; // 1 day

function destKey(shortCode: string) {
  return `qr:dest:${shortCode}`;
}

/** Cached destination URL, or null on miss / no Redis. */
export async function getCachedDestination(
  shortCode: string,
): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<string>(destKey(shortCode));
}

export async function cacheDestination(
  shortCode: string,
  destinationUrl: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(destKey(shortCode), destinationUrl, { ex: TTL_SECONDS });
}

/** Drop the cached destination — call whenever a code's destination or
 *  active-state changes so the next scan re-reads from the database. */
export async function invalidateDestination(shortCode: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(destKey(shortCode));
}
