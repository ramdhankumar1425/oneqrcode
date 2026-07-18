import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/index";
import { qrCode } from "@/db/schemas";
import { cacheDestination, getCachedDestination } from "@/lib/cache";

/**
 * Public redirect hot path: oqr.to/r/<shortCode>.
 *
 * Cache-first: a hit means the code is active and we already know where it
 * points, so we skip the database entirely. On a miss we read the row, and
 * only cache (and redirect) when the code is active — so the mere presence of
 * a cache entry implies an active code. The destination-update / archive paths
 * invalidate this key (see lib/cache + PATCH/DELETE /api/qr/[id]).
 */

type Ctx = { params: Promise<{ shortCode: string }> };

// 302 (temporary): destinations change, so this redirect must never be cached
// permanently by browsers or intermediaries.
function redirectTo(url: string) {
  return NextResponse.redirect(url, 302);
}

function notFound() {
  return new NextResponse("This code isn’t active.", { status: 404 });
}

export async function GET(request: Request, { params }: Ctx) {
  const { shortCode } = await params;

  // 1) cache hit → redirect immediately
  const cached = await getCachedDestination(shortCode);
  if (cached) {
    recordScan(shortCode, request);
    return redirectTo(cached);
  }

  // 2) cache miss → look up the code
  const [code] = await db
    .select({
      id: qrCode.id,
      shortCode: qrCode.shortCode,
      destinationUrl: qrCode.destinationUrl,
      isActive: qrCode.isActive,
      archivedAt: qrCode.archivedAt,
    })
    .from(qrCode)
    .where(eq(qrCode.shortCode, shortCode))
    .limit(1);

  if (!code || code.archivedAt || !code.isActive) {
    return notFound();
  }

  // 3) warm the cache for subsequent scans, then redirect
  await cacheDestination(code.shortCode, code.destinationUrl);
  recordScan(code.shortCode, request);
  return redirectTo(code.destinationUrl);
}

/**
 * TODO(scan-audit): record scan analytics without slowing the redirect.
 *
 * This should run fire-and-forget (do NOT await on the redirect path) and:
 *   1. Insert a qr_scan row: hashed IP (ipHash), country (from geo headers),
 *      parsed deviceType/os/browser (from user-agent), referrer, and utm_*
 *      params off the request URL.
 *   2. Bump the denormalized counters on qr_code: scanCount += 1 and
 *      lastScannedAt = now (so Free-plan "basic scan counts" work without
 *      querying qr_scan).
 *
 * Prefer offloading to a queue / waitUntil() so redirect latency stays flat.
 * Intentionally a no-op for now.
 */
function recordScan(_shortCode: string, _request: Request): void {
  // no-op — see TODO above
}
