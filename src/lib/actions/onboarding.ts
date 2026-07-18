"use server";

import { eq } from "drizzle-orm";
import { db } from "@/index";
import { user } from "@/db/schemas";
import { isHeardFrom, isUseCase } from "@/lib/onboarding";
import { getCurrentUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitOnboarding(input: {
  heardFrom: string;
  useCase: string;
}): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  if (!isHeardFrom(input.heardFrom)) {
    return { ok: false, error: "Please select how you heard about us" };
  }
  if (!isUseCase(input.useCase)) {
    return { ok: false, error: "Please select how you'll use oneqrcode" };
  }

  await db
    .update(user)
    .set({
      heardFrom: input.heardFrom,
      useCase: input.useCase,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(user.id, current.id));

  return { ok: true };
}
