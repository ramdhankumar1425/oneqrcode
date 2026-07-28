import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart, type DonutDatum } from "@/components/ui/donut-chart";
import { ArrowUpRight, ChartBar, QrCode, Scan } from "@/components/ui/icons";

const RANGE_DAYS = 14;

const LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  android: "Android",
  ios: "iOS",
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  edge: "Edge",
  other: "Other",
};

const prettify = (key: string) =>
  LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

type BreakdownRow = { dimension: string; label: string; count: number };

function pick(rows: BreakdownRow[], dimension: string): DonutDatum[] {
  return rows
    .filter((r) => r.dimension === dimension)
    .map((r) => ({ label: prettify(r.label), value: Number(r.count) }));
}

export default async function AnalyticsPage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  // free plan → upgrade gate
  if (!ctx.plan.limits.analytics) {
    return (
      <div>
        <h1 className="text-display text-3xl">Analytics</h1>
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-lime-300">
            <ChartBar size={22} />
          </span>
          <div>
            <p className="text-lg font-semibold">Analytics is a Pro feature</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Upgrade to see scans over time, plus device, browser, and country
              breakdowns for every code.
            </p>
          </div>
          <Button href="/app/billing">
            Upgrade to Pro <ArrowUpRight size={15} />
          </Button>
        </Card>
      </div>
    );
  }

  const since = new Date(Date.now() - RANGE_DAYS * 86_400_000).toISOString();
  const supabase = await createClient();

  const [
    { data: totalsRows },
    { data: seriesRows },
    { data: breakdownRows },
    { data: topRows },
  ] = await Promise.all([
    supabase.rpc("analytics_totals"),
    supabase.rpc("analytics_daily", { since }),
    supabase.rpc("analytics_breakdown", { since }),
    supabase
      .from("qr_code")
      .select("id, title, scan_count")
      .is("archived_at", null)
      .order("scan_count", { ascending: false })
      .limit(5),
  ]);

  const totals = (Array.isArray(totalsRows) ? totalsRows[0] : totalsRows) as
    | { active_codes: number; total_scans: number }
    | undefined;
  const series = (seriesRows ?? []) as { day: string; scans: number }[];
  const breakdown = (breakdownRows ?? []) as BreakdownRow[];
  const deviceData = pick(breakdown, "device");
  const osData = pick(breakdown, "os");
  const browserData = pick(breakdown, "browser");
  const topCodes = (topRows ?? []) as {
    id: string;
    title: string;
    scan_count: number;
  }[];

  const chartData = series.map((r) => ({
    label: new Date(r.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: Number(r.scans),
  }));

  return (
    <div>
      <h1 className="text-display text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last {RANGE_DAYS} days across all your codes.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total scans"
          icon={<Scan size={12} />}
          value={Number(totals?.total_scans ?? 0).toLocaleString("en-US")}
        />
        <StatCard
          label="Active codes"
          icon={<QrCode size={12} />}
          value={Number(totals?.active_codes ?? 0).toLocaleString("en-US")}
        />
      </div>

      <Card className="mt-6">
        <CardContent>
          {chartData.length > 0 ? (
            <BarChart title={`Scans — last ${RANGE_DAYS} days`} data={chartData} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Eyebrow>No scans yet</Eyebrow>
              <p className="max-w-xs text-sm text-muted-foreground">
                Scan data appears here once your printed codes start getting
                scanned.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <DonutChart title="Devices" data={deviceData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DonutChart title="Operating systems" data={osData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DonutChart title="Browsers" data={browserData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold tracking-tight">Top codes</h2>
        <div className="mt-3 flex flex-col gap-3">
          {topCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No codes yet.</p>
          ) : (
            topCodes.map((code) => (
              <Link key={code.id} href={`/app/codes/${code.id}`}>
                <Card className="flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-float">
                  <span className="truncate font-medium">{code.title}</span>
                  <Badge variant="soft">
                    {Number(code.scan_count).toLocaleString("en-US")} scans
                  </Badge>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
