"use server";

import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      heard_from: input.heardFrom,
      use_case: input.useCase,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id);

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  return { ok: true };
}
