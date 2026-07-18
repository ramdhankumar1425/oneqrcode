import { badRequest, ok, unauthorized } from "@/lib/http";
import { isShortCodeTaken, isValidSlug } from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";

/** Slug availability for the create form: /api/qr/check-slug?code=my-slug */
export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code) return badRequest("Missing 'code' query param");

  if (!isValidSlug(code)) {
    return ok({
      available: false,
      valid: false,
      reason: "3–32 chars: lowercase letters, numbers, hyphens",
    });
  }

  const taken = await isShortCodeTaken(code);
  return ok({ available: !taken, valid: true });
}
