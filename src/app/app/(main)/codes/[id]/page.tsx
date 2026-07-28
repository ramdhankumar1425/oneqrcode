import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/session";
import { getOwnedCode } from "@/lib/qr";
import type { QrDesignRow, QrRedirectRow } from "@/lib/db-types";
import { CodeDetail, type CodeDetailData } from "@/components/app/code-detail";

export default async function CodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const code = await getOwnedCode(id, supabase);
  if (!code || code.archived_at) notFound();

  const [{ data: designRow }, { data: redirectRows }] = await Promise.all([
    supabase
      .from("qr_design")
      .select("*")
      .eq("qr_code_id", code.id)
      .maybeSingle(),
    supabase
      .from("qr_redirect")
      .select("destination_url, created_at")
      .eq("qr_code_id", code.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const design = designRow as QrDesignRow | null;
  const redirects = (redirectRows ?? []) as Pick<
    QrRedirectRow,
    "destination_url" | "created_at"
  >[];

  const data: CodeDetailData = {
    id: code.id,
    title: code.title,
    shortCode: code.short_code,
    destinationUrl: code.destination_url,
    type: code.type,
    isActive: code.is_active,
    scanCount: code.scan_count,
    design: design
      ? {
          foregroundColor: design.foreground_color,
          backgroundColor: design.background_color,
          logoUrl: design.logo_url,
        }
      : null,
    redirects: redirects.map((r) => ({
      destinationUrl: r.destination_url,
      createdAt: r.created_at,
    })),
  };

  return <CodeDetail data={data} />;
}
