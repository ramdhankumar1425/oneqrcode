import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/index";
import { qrCode } from "@/db/schemas";
import { getAppContext } from "@/lib/app-context";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { ArrowUpRight, Plus, QrCode, Scan } from "@/components/ui/icons";

export default async function DashboardPage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  // independent reads — run them in one wall-clock round-trip, not two
  const [[stats], recent] = await Promise.all([
    db
      .select({
        activeDynamic: sql<number>`count(*) filter (where ${qrCode.type} = 'dynamic' and ${qrCode.archivedAt} is null)`,
        activeTotal: sql<number>`count(*) filter (where ${qrCode.archivedAt} is null)`,
        totalScans: sql<number>`coalesce(sum(${qrCode.scanCount}), 0)`,
      })
      .from(qrCode)
      .where(eq(qrCode.userId, ctx.user.id)),
    db
      .select()
      .from(qrCode)
      .where(and(eq(qrCode.userId, ctx.user.id), isNull(qrCode.archivedAt)))
      .orderBy(desc(qrCode.createdAt))
      .limit(5),
  ]);

  const activeDynamic = Number(stats?.activeDynamic ?? 0);
  const limit = ctx.plan.limits.qrCodes;
  const atLimit = limit != null && activeDynamic >= limit;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">
            Hi, {ctx.user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your codes.
          </p>
        </div>
        {atLimit && ctx.plan.id === "free" ? (
          <div className="flex items-center gap-2">
            <Button disabled title="Dynamic-code limit reached">
              <Plus size={16} /> New code
            </Button>
            <Button variant="accent" href="/app/billing">
              Upgrade <ArrowUpRight size={15} />
            </Button>
          </div>
        ) : (
          <Button href="/app/codes/new">
            <Plus size={16} /> New code
          </Button>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Dynamic codes"
          icon={<QrCode size={12} />}
          value={limit != null ? `${activeDynamic} / ${limit}` : String(activeDynamic)}
        />
        <StatCard
          label="Total scans"
          icon={<Scan size={12} />}
          value={Number(stats?.totalScans ?? 0).toLocaleString("en-US")}
        />
        <StatCard
          label="Plan"
          icon={<QrCode size={12} />}
          value={ctx.plan.name}
        />
      </div>

      {atLimit && ctx.plan.id === "free" && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-forest-900 bg-lime-300 p-5">
          <div>
            <p className="font-semibold">You&apos;ve hit your dynamic-code limit.</p>
            <p className="text-sm text-forest-900/80">
              Upgrade to Pro for unlimited dynamic codes and full analytics —
              or{" "}
              <Link href="/app/codes/new" className="underline">
                create a static code
              </Link>{" "}
              (always free).
            </p>
          </div>
          <Button href="/app/billing">
            Upgrade <ArrowUpRight size={15} />
          </Button>
        </Card>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Recent codes</h2>
        <Link
          href="/app/codes"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {recent.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Eyebrow>No codes yet</Eyebrow>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first permanent QR code — print it once and point it
              anywhere.
            </p>
            <Button href="/app/codes/new">
              <Plus size={15} /> New code
            </Button>
          </Card>
        ) : (
          recent.map((code) => (
            <Link key={code.id} href={`/app/codes/${code.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-float">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{code.title}</span>
                    <Badge variant={code.type === "static" ? "outline" : "soft"}>
                      {code.type}
                    </Badge>
                    <Badge variant={code.isActive ? "success" : "warning"}>
                      {code.isActive ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {code.type === "dynamic" ? `/r/${code.shortCode} → ` : ""}
                    {code.destinationUrl}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <Scan size={14} />
                  {code.scanCount.toLocaleString("en-US")}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
