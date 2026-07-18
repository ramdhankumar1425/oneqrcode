import { eq } from "drizzle-orm";
import { db } from "@/index";
import { user } from "@/db/schemas";
import { badRequest, ok, unauthorized } from "@/lib/http";
import { isHeardFrom, isUseCase } from "@/lib/onboarding";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  const [row] = await db
    .select({
      heardFrom: user.heardFrom,
      useCase: user.useCase,
      onboardingCompletedAt: user.onboardingCompletedAt,
    })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1);

  return ok({
    completed: row?.onboardingCompletedAt != null,
    heardFrom: row?.heardFrom ?? null,
    useCase: row?.useCase ?? null,
  });
}

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { heardFrom, useCase } = (body ?? {}) as {
    heardFrom?: unknown;
    useCase?: unknown;
  };

  if (!isHeardFrom(heardFrom)) {
    return badRequest("Invalid or missing 'heardFrom'");
  }
  if (!isUseCase(useCase)) {
    return badRequest("Invalid or missing 'useCase'");
  }

  const [row] = await db
    .update(user)
    .set({
      heardFrom,
      useCase,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(user.id, current.id))
    .returning({
      heardFrom: user.heardFrom,
      useCase: user.useCase,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });

  return ok({
    completed: row.onboardingCompletedAt != null,
    heardFrom: row.heardFrom,
    useCase: row.useCase,
  });
}
