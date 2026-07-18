import { desc, eq, isNull, and } from "drizzle-orm";
import { db } from "@/index";
import { qrCode, qrDesign, qrRedirect } from "@/db/schemas";
import { badRequest, created, forbidden, ok, unauthorized } from "@/lib/http";
import {
  countActiveDynamicCodes,
  generateShortCode,
  isShortCodeTaken,
  isValidHttpUrl,
  isValidSlug,
} from "@/lib/qr";
import { getUserPlan } from "@/lib/subscription";
import { getCurrentUser } from "@/lib/session";

/** List the current user's codes (active by default; ?archived=1 to include). */
export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  const includeArchived =
    new URL(request.url).searchParams.get("archived") === "1";

  const where = includeArchived
    ? eq(qrCode.userId, current.id)
    : and(eq(qrCode.userId, current.id), isNull(qrCode.archivedAt));

  const rows = await db
    .select()
    .from(qrCode)
    .where(where)
    .orderBy(desc(qrCode.createdAt));

  return ok({ codes: rows });
}

type CreateBody = {
  title?: unknown;
  destinationUrl?: unknown;
  type?: unknown;
  shortCode?: unknown;
  design?: {
    foregroundColor?: unknown;
    backgroundColor?: unknown;
    logoUrl?: unknown;
  };
};

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("'title' is required");

  if (typeof body.destinationUrl !== "string" || !isValidHttpUrl(body.destinationUrl)) {
    return badRequest("'destinationUrl' must be a valid http(s) URL");
  }
  const destinationUrl = body.destinationUrl;

  const type = body.type === "static" ? "static" : "dynamic";

  // plan limit applies to dynamic codes only; static codes are unlimited everywhere
  if (type === "dynamic") {
    const plan = await getUserPlan(current.id);
    if (plan.limits.qrCodes != null) {
      const activeCount = await countActiveDynamicCodes(current.id);
      if (activeCount >= plan.limits.qrCodes) {
        return forbidden(
          `Your ${plan.name} plan allows ${plan.limits.qrCodes} active dynamic code(s). Upgrade or archive one to add more.`,
        );
      }
    }
  }

  // short code: custom slug (validated + unique) or generated
  let shortCode: string;
  if (body.shortCode !== undefined && body.shortCode !== "") {
    if (typeof body.shortCode !== "string" || !isValidSlug(body.shortCode)) {
      return badRequest(
        "'shortCode' must be 3–32 chars: lowercase letters, numbers, hyphens",
      );
    }
    if (await isShortCodeTaken(body.shortCode)) {
      return badRequest("That short code is already taken");
    }
    shortCode = body.shortCode;
  } else {
    shortCode = await generateShortCode();
  }

  const [code] = await db
    .insert(qrCode)
    .values({ userId: current.id, title, shortCode, destinationUrl, type })
    .returning();

  // seed destination history so the timeline starts at creation
  await db.insert(qrRedirect).values({ qrCodeId: code.id, destinationUrl });

  // optional design overrides
  const design = body.design;
  if (design) {
    await db.insert(qrDesign).values({
      qrCodeId: code.id,
      foregroundColor:
        typeof design.foregroundColor === "string"
          ? design.foregroundColor
          : undefined,
      backgroundColor:
        typeof design.backgroundColor === "string"
          ? design.backgroundColor
          : undefined,
      logoUrl: typeof design.logoUrl === "string" ? design.logoUrl : undefined,
    });
  }

  return created({ code });
}
