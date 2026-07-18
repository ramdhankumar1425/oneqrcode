import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let resolved = false;

/**
 * Lazy Upstash client. Returns null when env isn't configured so callers can
 * degrade gracefully (cache becomes a no-op) instead of crashing the route.
 */
export function getRedis(): Redis | null {
  if (resolved) return client;
  resolved = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    client = null;
    return client;
  }

  client = new Redis({ url, token });
  return client;
}
