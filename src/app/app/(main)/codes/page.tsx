import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import type { QrCodeRow } from "@/lib/db-types";
import { Badge, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Plus, Scan } from "@/components/ui/icons";

export default async function CodesPage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("qr_code")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  const codes = (data ?? []) as QrCodeRow[];

  const activeDynamic = codes.filter((c) => c.type === "dynamic").length;
  const limit = ctx.plan.limits.qrCodes;
  const atLimit = limit != null && activeDynamic >= limit;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">QR codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {codes.length} active {codes.length === 1 ? "code" : "codes"}
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

      <div className="mt-8 flex flex-col gap-3">
        {codes.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Eyebrow>No codes yet</Eyebrow>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first permanent QR code.
            </p>
            <Button href="/app/codes/new">
              <Plus size={15} /> New code
            </Button>
          </Card>
        ) : (
          codes.map((code) => (
            <Link key={code.id} href={`/app/codes/${code.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-float">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{code.title}</span>
                    <Badge variant={code.type === "static" ? "outline" : "soft"}>
                      {code.type}
                    </Badge>
                    <Badge variant={code.is_active ? "success" : "warning"}>
                      {code.is_active ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {code.type === "dynamic" ? `/r/${code.short_code} → ` : ""}
                    {code.destination_url}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <Scan size={14} />
                  {code.scan_count.toLocaleString("en-US")}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
