"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfileName(name: string): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name can't be empty." };

  const supabase = await createClient();
  // keep auth metadata and the profiles row in sync
  await supabase.auth.updateUser({ data: { name: trimmed } });
  const { error } = await supabase
    .from("profiles")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", current.id);

  if (error) return { ok: false, error: "Couldn't update. Please try again." };

  revalidatePath("/app/profile");
  return { ok: true };
}
