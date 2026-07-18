import { customAlphabet } from "nanoid";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/index";
import { qrCode } from "@/db/schemas";

// unambiguous alphabet (no 0/O/1/l/I) for human-friendly short links
const SHORT_CODE_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const SHORT_CODE_LENGTH = 7;
const makeCode = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

// custom slugs: 3–32 chars, lowercase letters/numbers/hyphens, no leading/trailing hyphen
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function isValidHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

export async function isShortCodeTaken(shortCode: string): Promise<boolean> {
  const [row] = await db
    .select({ id: qrCode.id })
    .from(qrCode)
    .where(eq(qrCode.shortCode, shortCode))
    .limit(1);
  return row != null;
}

/** Generate a unique random short code, retrying on the rare collision. */
export async function generateShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    if (!(await isShortCodeTaken(code))) return code;
  }
  throw new Error("Could not generate a unique short code");
}

/** Count a user's active (non-archived) codes. */
export async function countActiveCodes(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(qrCode)
    .where(and(eq(qrCode.userId, userId), isNull(qrCode.archivedAt)));
  return row?.value ?? 0;
}

/**
 * Count active *dynamic* codes — the plan limit applies only to these.
 * Static codes encode their destination directly and are unlimited on every plan.
 */
export async function countActiveDynamicCodes(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(qrCode)
    .where(
      and(
        eq(qrCode.userId, userId),
        isNull(qrCode.archivedAt),
        eq(qrCode.type, "dynamic"),
      ),
    );
  return row?.value ?? 0;
}

/** Fetch a code owned by the user, or null (ownership guard). */
export async function getOwnedCode(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(qrCode)
    .where(and(eq(qrCode.id, id), eq(qrCode.userId, userId)))
    .limit(1);
  return row ?? null;
}
