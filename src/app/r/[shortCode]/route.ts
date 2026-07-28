import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheCode, getCachedCode } from "@/lib/cache";
import { recordScan } from "@/lib/scan";

/**
 * Public redirect hot path: oqr.to/r/<shortCode>.
 *
 * No logged-in user here, so we use the service-role client (bypasses RLS) to
 * resolve any code by its short_code. Cache-first: a hit means the code is
 * active and we already know its id + destination, so we skip the database
 * entirely — and still record the scan (the cached id makes that a no-DB-read
 * write). On a miss we read the row, and only cache (and redirect) when the code
 * is active, so a cache entry implies an active code. The destination-update /
 * archive paths invalidate this key (see lib/cache + the QR update actions).
 *
 * Scan recording is deferred (see lib/scan → after()), so it never adds latency
 * to the redirect.
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

  // 1) cache hit → record scan + redirect immediately (no DB)
  const cached = await getCachedCode(shortCode);
  if (cached) {
    recordScan(cached.id, request);
    return redirectTo(cached.destinationUrl);
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

  // 3) warm the cache, record the scan, then redirect
  await cacheCode(code.short_code, {
    id: code.id,
    destinationUrl: code.destination_url,
  });
  recordScan(code.id, request);
  return redirectTo(code.destination_url);
}
