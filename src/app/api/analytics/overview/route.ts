import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/index";
import { qrCode, qrScan } from "@/db/schemas";
import { forbidden, ok, unauthorized } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { getUserPlan } from "@/lib/subscription";

function rangeDays(request: Request): number {
  const raw = Number(new URL(request.url).searchParams.get("days"));
  if (!Number.isFinite(raw)) return 30;
  return Math.min(Math.max(Math.trunc(raw), 1), 365);
}

/** Account-level analytics. Paid plans only. */
export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  const plan = await getUserPlan(current.id);
  if (!plan.limits.analytics) {
    return forbidden("Analytics is available on paid plans. Upgrade to Pro.");
  }

  const days = rangeDays(request);
  const since = new Date(Date.now() - days * 86_400_000);

  const [totals] = await db
    .select({
      activeCodes: sql<number>`count(*) filter (where ${qrCode.archivedAt} is null)`,
      totalScans: sql<number>`coalesce(sum(${qrCode.scanCount}), 0)`,
    })
    .from(qrCode)
    .where(eq(qrCode.userId, current.id));

  const series = await db
    .select({
      day: sql<string>`date_trunc('day', ${qrScan.createdAt})::date`,
      scans: sql<number>`count(*)`,
    })
    .from(qrScan)
    .innerJoin(qrCode, eq(qrScan.qrCodeId, qrCode.id))
    .where(and(eq(qrCode.userId, current.id), gte(qrScan.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${qrScan.createdAt})`)
    .orderBy(sql`date_trunc('day', ${qrScan.createdAt})`);

  const topCodes = await db
    .select({
      id: qrCode.id,
      title: qrCode.title,
      shortCode: qrCode.shortCode,
      scanCount: qrCode.scanCount,
    })
    .from(qrCode)
    .where(and(eq(qrCode.userId, current.id), isNull(qrCode.archivedAt)))
    .orderBy(desc(qrCode.scanCount))
    .limit(5);

  return ok({
    rangeDays: days,
    totals: {
      activeCodes: Number(totals?.activeCodes ?? 0),
      totalScans: Number(totals?.totalScans ?? 0),
    },
    series: series.map((r) => ({ day: r.day, scans: Number(r.scans) })),
    topCodes,
  });
}
