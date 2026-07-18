import { desc, eq } from "drizzle-orm";
import { db } from "@/index";
import { qrCode, qrDesign, qrRedirect } from "@/db/schemas";
import { invalidateDestination } from "@/lib/cache";
import { badRequest, notFound, ok, unauthorized } from "@/lib/http";
import { getOwnedCode, isValidHttpUrl } from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

/** Single code with its design and recent destination history. */
export async function GET(_request: Request, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();
  const { id } = await params;

  const code = await getOwnedCode(id, current.id);
  if (!code) return notFound("Code not found");

  const [design] = await db
    .select()
    .from(qrDesign)
    .where(eq(qrDesign.qrCodeId, code.id))
    .limit(1);

  const redirects = await db
    .select()
    .from(qrRedirect)
    .where(eq(qrRedirect.qrCodeId, code.id))
    .orderBy(desc(qrRedirect.createdAt))
    .limit(20);

  return ok({ code, design: design ?? null, redirects });
}

type PatchBody = {
  title?: unknown;
  destinationUrl?: unknown;
  isActive?: unknown;
  type?: unknown;
};

export async function PATCH(request: Request, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();
  const { id } = await params;

  const code = await getOwnedCode(id, current.id);
  if (!code) return notFound("Code not found");
  if (code.archivedAt) return badRequest("Cannot edit an archived code");

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const updates: Partial<typeof qrCode.$inferInsert> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return badRequest("'title' must be a non-empty string");
    }
    updates.title = body.title.trim();
  }

  let destinationChanged = false;
  if (body.destinationUrl !== undefined) {
    if (
      typeof body.destinationUrl !== "string" ||
      !isValidHttpUrl(body.destinationUrl)
    ) {
      return badRequest("'destinationUrl' must be a valid http(s) URL");
    }
    if (body.destinationUrl !== code.destinationUrl) {
      updates.destinationUrl = body.destinationUrl;
      destinationChanged = true;
    }
  }

  let activeChanged = false;
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return badRequest("'isActive' must be a boolean");
    }
    if (body.isActive !== code.isActive) {
      updates.isActive = body.isActive;
      activeChanged = true;
    }
  }

  if (body.type !== undefined) {
    if (body.type !== "dynamic" && body.type !== "static") {
      return badRequest("'type' must be 'dynamic' or 'static'");
    }
    updates.type = body.type;
  }

  if (Object.keys(updates).length === 0) {
    return ok({ code });
  }

  const [updated] = await db
    .update(qrCode)
    .set(updates)
    .where(eq(qrCode.id, code.id))
    .returning();

  // record the change in history
  if (destinationChanged) {
    await db.insert(qrRedirect).values({
      qrCodeId: code.id,
      destinationUrl: updated.destinationUrl,
    });
  }

  // any change to where a scan lands (or whether it lands) must clear the cache
  if (destinationChanged || activeChanged) {
    await invalidateDestination(code.shortCode);
  }

  return ok({ code: updated });
}

/** Soft-delete: archive the code (printed codes are never physically removed). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();
  const { id } = await params;

  const code = await getOwnedCode(id, current.id);
  if (!code) return notFound("Code not found");

  if (!code.archivedAt) {
    await db
      .update(qrCode)
      .set({ archivedAt: new Date(), isActive: false })
      .where(eq(qrCode.id, code.id));
    await invalidateDestination(code.shortCode);
  }

  return ok({ archived: true });
}
