import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/index";
import { qrDesign, qrRedirect } from "@/db/schemas";
import { getCurrentUser } from "@/lib/session";
import { getOwnedCode } from "@/lib/qr";
import { CodeDetail, type CodeDetailData } from "@/components/app/code-detail";

export default async function CodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const code = await getOwnedCode(id, user.id);
  if (!code || code.archivedAt) notFound();

  const [design] = await db
    .select()
    .from(qrDesign)
    .where(eq(qrDesign.qrCodeId, code.id))
    .limit(1);

  const redirects = await db
    .select({
      destinationUrl: qrRedirect.destinationUrl,
      createdAt: qrRedirect.createdAt,
    })
    .from(qrRedirect)
    .where(eq(qrRedirect.qrCodeId, code.id))
    .orderBy(desc(qrRedirect.createdAt))
    .limit(20);

  const data: CodeDetailData = {
    id: code.id,
    title: code.title,
    shortCode: code.shortCode,
    destinationUrl: code.destinationUrl,
    type: code.type as "dynamic" | "static",
    isActive: code.isActive,
    scanCount: code.scanCount,
    design: design
      ? {
          foregroundColor: design.foregroundColor,
          backgroundColor: design.backgroundColor,
          logoUrl: design.logoUrl,
        }
      : null,
    redirects: redirects.map((r) => ({
      destinationUrl: r.destinationUrl,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return <CodeDetail data={data} />;
}
