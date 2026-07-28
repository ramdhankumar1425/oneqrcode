"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidateDestination } from "@/lib/cache";
import {
  countActiveDynamicCodes,
  generateShortCode,
  getOwnedCode,
  isShortCodeTaken,
  isValidHttpUrl,
  isValidSlug,
} from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";
import { getUserPlan } from "@/lib/subscription";

export type ActionError = { ok: false; error: string };

/** Whether the user can still create a dynamic code under their plan limit. */
export async function getDynamicAllowance(): Promise<{
  limited: boolean;
  reached: boolean;
  planName: string;
}> {
  const current = await getCurrentUser();
  if (!current) return { limited: false, reached: false, planName: "Free" };

  const plan = await getUserPlan();
  if (plan.limits.qrCodes == null) {
    return { limited: false, reached: false, planName: plan.name };
  }
  const count = await countActiveDynamicCodes();
  return {
    limited: true,
    reached: count >= plan.limits.qrCodes,
    planName: plan.name,
  };
}

type DesignInput = {
  foregroundColor?: string;
  backgroundColor?: string;
  logoUrl?: string | null;
};

export async function createCode(input: {
  title: string;
  destinationUrl: string;
  type: "dynamic" | "static";
  shortCode?: string;
  design?: DesignInput;
}): Promise<{ ok: true; id: string } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Give your code a name." };
  if (!isValidHttpUrl(input.destinationUrl)) {
    return { ok: false, error: "Enter a valid destination URL (including https://)." };
  }

  const type = input.type === "static" ? "static" : "dynamic";
  const supabase = await createClient();

  // plan limit applies to dynamic codes only; static is unlimited everywhere
  if (type === "dynamic") {
    const plan = await getUserPlan();
    if (plan.limits.qrCodes != null) {
      const activeCount = await countActiveDynamicCodes(supabase);
      if (activeCount >= plan.limits.qrCodes) {
        return {
          ok: false,
          error: `Your ${plan.name} plan allows ${plan.limits.qrCodes} active dynamic code(s). Upgrade or archive one to add more.`,
        };
      }
    }
  }

  let shortCode: string;
  if (input.shortCode) {
    if (!isValidSlug(input.shortCode)) {
      return { ok: false, error: "Short code: 3–32 chars — letters, numbers, hyphens." };
    }
    if (await isShortCodeTaken(input.shortCode, supabase)) {
      return { ok: false, error: "That short code is already taken." };
    }
    shortCode = input.shortCode;
  } else {
    shortCode = await generateShortCode(supabase);
  }

  const { data: code, error } = await supabase
    .from("qr_code")
    .insert({
      user_id: current.id,
      title,
      short_code: shortCode,
      destination_url: input.destinationUrl,
      type,
    })
    .select("id")
    .single();

  if (error || !code) {
    return { ok: false, error: "Couldn't create the code. Please try again." };
  }

  await supabase.from("qr_redirect").insert({
    qr_code_id: code.id,
    destination_url: input.destinationUrl,
  });

  const d = input.design;
  if (d && (d.foregroundColor || d.backgroundColor || d.logoUrl)) {
    await supabase.from("qr_design").insert({
      qr_code_id: code.id,
      foreground_color: d.foregroundColor,
      background_color: d.backgroundColor,
      logo_url: d.logoUrl ?? null,
    });
  }

  revalidatePath("/app/codes");
  return { ok: true, id: code.id as string };
}

export async function updateCode(
  id: string,
  input: {
    title?: string;
    destinationUrl?: string;
    isActive?: boolean;
  },
): Promise<{ ok: true } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const supabase = await createClient();
  const code = await getOwnedCode(id, supabase);
  if (!code) return { ok: false, error: "Code not found" };
  if (code.archived_at) return { ok: false, error: "This code is archived." };

  const updates: Record<string, unknown> = {};
  let destinationChanged = false;
  let activeChanged = false;

  if (input.title !== undefined) {
    if (!input.title.trim()) return { ok: false, error: "Name can't be empty." };
    updates.title = input.title.trim();
  }
  if (input.destinationUrl !== undefined) {
    if (!isValidHttpUrl(input.destinationUrl)) {
      return { ok: false, error: "Enter a valid destination URL." };
    }
    if (input.destinationUrl !== code.destination_url) {
      updates.destination_url = input.destinationUrl;
      destinationChanged = true;
    }
  }
  if (input.isActive !== undefined && input.isActive !== code.is_active) {
    updates.is_active = input.isActive;
    activeChanged = true;
  }

  if (Object.keys(updates).length === 0) return { ok: true };
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("qr_code")
    .update(updates)
    .eq("id", code.id);
  if (error) return { ok: false, error: "Couldn't save changes. Please try again." };

  if (destinationChanged) {
    await supabase.from("qr_redirect").insert({
      qr_code_id: code.id,
      destination_url: updates.destination_url as string,
    });
  }
  if (destinationChanged || activeChanged) {
    await invalidateDestination(code.short_code);
  }

  revalidatePath("/app/codes");
  revalidatePath(`/app/codes/${id}`);
  return { ok: true };
}

export async function updateDesign(
  id: string,
  input: DesignInput,
): Promise<{ ok: true } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const supabase = await createClient();
  const code = await getOwnedCode(id, supabase);
  if (!code) return { ok: false, error: "Code not found" };

  const { error } = await supabase.from("qr_design").upsert(
    {
      qr_code_id: code.id,
      foreground_color: input.foregroundColor,
      background_color: input.backgroundColor,
      logo_url: input.logoUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "qr_code_id" },
  );
  if (error) return { ok: false, error: "Couldn't save the design. Please try again." };

  revalidatePath(`/app/codes/${id}`);
  return { ok: true };
}

export async function archiveCode(
  id: string,
): Promise<{ ok: true } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const supabase = await createClient();
  const code = await getOwnedCode(id, supabase);
  if (!code) return { ok: false, error: "Code not found" };

  if (!code.archived_at) {
    await supabase
      .from("qr_code")
      .update({ archived_at: new Date().toISOString(), is_active: false })
      .eq("id", code.id);
    await invalidateDestination(code.short_code);
  }

  revalidatePath("/app/codes");
  return { ok: true };
}
