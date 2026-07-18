import { and, desc, eq, gte, sql } from "drizzle-orm";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/index";
import { qrScan } from "@/db/schemas";
import { forbidden, notFound, ok, unauthorized } from "@/lib/http";
import { getOwnedCode } from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";
import { getUserPlan } from "@/lib/subscription";

type Ctx = { params: Promise<{ qrId: string }> };

function rangeDays(request: Request): number {
  const raw = Number(new URL(request.url).searchParams.get("days"));
  if (!Number.isFinite(raw)) return 30;
  return Math.min(Math.max(Math.trunc(raw), 1), 365);
}

/** Per-code analytics. Paid plans only; must own the code. */
export async function GET(request: Request, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  const plan = await getUserPlan(current.id);
  if (!plan.limits.analytics) {
    return forbidden("Analytics is available on paid plans. Upgrade to Pro.");
  }

  const { qrId } = await params;
  const code = await getOwnedCode(qrId, current.id);
  if (!code) return notFound("Code not found");

  const days = rangeDays(request);
  const since = new Date(Date.now() - days * 86_400_000);

  const scoped = and(eq(qrScan.qrCodeId, code.id), gte(qrScan.createdAt, since));

  // count scans grouped by an enum/text column
  const breakdown = async (column: AnyPgColumn) =>
    (
      await db
        .select({ key: column, count: sql<number>`count(*)` })
        .from(qrScan)
        .where(scoped)
        .groupBy(column)
        .orderBy(desc(sql`count(*)`))
    ).map((r) => ({ key: r.key as string | null, count: Number(r.count) }));

  const series = await db
    .select({
      day: sql<string>`date_trunc('day', ${qrScan.createdAt})::date`,
      scans: sql<number>`count(*)`,
    })
    .from(qrScan)
    .where(scoped)
    .groupBy(sql`date_trunc('day', ${qrScan.createdAt})`)
    .orderBy(sql`date_trunc('day', ${qrScan.createdAt})`);

  const [byDevice, byOs, byBrowser, byCountry, byReferrer] = await Promise.all([
    breakdown(qrScan.deviceType),
    breakdown(qrScan.os),
    breakdown(qrScan.browser),
    breakdown(qrScan.country),
    breakdown(qrScan.referrer),
  ]);

  return ok({
    code: {
      id: code.id,
      title: code.title,
      shortCode: code.shortCode,
      scanCount: code.scanCount,
      lastScannedAt: code.lastScannedAt,
    },
    rangeDays: days,
    series: series.map((r) => ({ day: r.day, scans: Number(r.scans) })),
    breakdowns: {
      device: byDevice,
      os: byOs,
      browser: byBrowser,
      country: byCountry,
      referrer: byReferrer.slice(0, 10),
    },
  });
}
