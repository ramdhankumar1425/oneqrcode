import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheDestination, getCachedDestination } from "@/lib/cache";

/**
 * Public redirect hot path: oqr.to/r/<shortCode>.
 *
 * No logged-in user here, so we use the service-role client (bypasses RLS) to
 * resolve any code by its short_code. Cache-first: a hit means the code is
 * active and we already know where it points, so we skip the database entirely.
 * On a miss we read the row, and only cache (and redirect) when the code is
 * active — so the mere presence of a cache entry implies an active code. The
 * destination-update / archive paths invalidate this key (see lib/cache + the
 * QR update actions).
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

  // 2) cache miss → look up the code (service-role: no user session on this path)
  const supabase = createAdminClient();
  const { data: code } = await supabase
    .from("qr_code")
    .select("id, short_code, destination_url, is_active, archived_at")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (!code || code.archived_at || !code.is_active) {
    return notFound();
  }

  // 3) warm the cache for subsequent scans, then redirect
  await cacheDestination(code.short_code, code.destination_url);
  recordScan(code.short_code, request);
  return redirectTo(code.destination_url);
}

/**
 * TODO(scan-audit): record scan analytics without slowing the redirect.
 *
 * This should run fire-and-forget (do NOT await on the redirect path) and, via
 * the service-role client:
 *   1. Insert a qr_scan row: hashed IP (ip_hash), country (from geo headers),
 *      parsed device_type/os/browser (from user-agent), referrer, and utm_*
 *      params off the request URL.
 *   2. Bump the denormalized counters on qr_code: scan_count += 1 and
 *      last_scanned_at = now (so Free-plan "basic scan counts" work without
 *      querying qr_scan).
 *
 * Prefer offloading to a queue / waitUntil() so redirect latency stays flat.
 * Intentionally a no-op for now.
 */
function recordScan(_shortCode: string, _request: Request): void {
  // no-op — see TODO above
}
