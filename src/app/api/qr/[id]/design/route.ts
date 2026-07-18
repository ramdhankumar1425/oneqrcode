import { eq } from "drizzle-orm";
import { db } from "@/index";
import { qrDesign } from "@/db/schemas";
import { badRequest, notFound, ok, unauthorized } from "@/lib/http";
import { getOwnedCode } from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type DesignBody = {
  foregroundColor?: unknown;
  backgroundColor?: unknown;
  logoUrl?: unknown;
};

/** Upsert the code's design (one row per code). */
export async function PATCH(request: Request, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();
  const { id } = await params;

  const code = await getOwnedCode(id, current.id);
  if (!code) return notFound("Code not found");

  let body: DesignBody;
  try {
    body = (await request.json()) as DesignBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const values: Partial<typeof qrDesign.$inferInsert> = {};

  if (body.foregroundColor !== undefined) {
    if (typeof body.foregroundColor !== "string" || !HEX_RE.test(body.foregroundColor)) {
      return badRequest("'foregroundColor' must be a hex color");
    }
    values.foregroundColor = body.foregroundColor;
  }
  if (body.backgroundColor !== undefined) {
    if (typeof body.backgroundColor !== "string" || !HEX_RE.test(body.backgroundColor)) {
      return badRequest("'backgroundColor' must be a hex color");
    }
    values.backgroundColor = body.backgroundColor;
  }
  if (body.logoUrl !== undefined) {
    if (body.logoUrl !== null && typeof body.logoUrl !== "string") {
      return badRequest("'logoUrl' must be a string or null");
    }
    values.logoUrl = (body.logoUrl as string | null) ?? null;
  }

  const [design] = await db
    .insert(qrDesign)
    .values({ qrCodeId: code.id, ...values })
    .onConflictDoUpdate({
      target: qrDesign.qrCodeId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();

  return ok({ design });
}
