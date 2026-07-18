"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/index";
import { qrCode, qrDesign, qrRedirect } from "@/db/schemas";
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

  const plan = await getUserPlan(current.id);
  if (plan.limits.qrCodes == null) {
    return { limited: false, reached: false, planName: plan.name };
  }
  const count = await countActiveDynamicCodes(current.id);
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

  // plan limit applies to dynamic codes only; static is unlimited everywhere
  if (type === "dynamic") {
    const plan = await getUserPlan(current.id);
    if (plan.limits.qrCodes != null) {
      const activeCount = await countActiveDynamicCodes(current.id);
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
    if (await isShortCodeTaken(input.shortCode)) {
      return { ok: false, error: "That short code is already taken." };
    }
    shortCode = input.shortCode;
  } else {
    shortCode = await generateShortCode();
  }

  const [code] = await db
    .insert(qrCode)
    .values({ userId: current.id, title, shortCode, destinationUrl: input.destinationUrl, type })
    .returning();

  await db.insert(qrRedirect).values({
    qrCodeId: code.id,
    destinationUrl: input.destinationUrl,
  });

  const d = input.design;
  if (d && (d.foregroundColor || d.backgroundColor || d.logoUrl)) {
    await db.insert(qrDesign).values({
      qrCodeId: code.id,
      foregroundColor: d.foregroundColor,
      backgroundColor: d.backgroundColor,
      logoUrl: d.logoUrl ?? undefined,
    });
  }

  revalidatePath("/app/codes");
  return { ok: true, id: code.id };
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

  const code = await getOwnedCode(id, current.id);
  if (!code) return { ok: false, error: "Code not found" };
  if (code.archivedAt) return { ok: false, error: "This code is archived." };

  const updates: Partial<typeof qrCode.$inferInsert> = {};
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
    if (input.destinationUrl !== code.destinationUrl) {
      updates.destinationUrl = input.destinationUrl;
      destinationChanged = true;
    }
  }
  if (input.isActive !== undefined && input.isActive !== code.isActive) {
    updates.isActive = input.isActive;
    activeChanged = true;
  }

  if (Object.keys(updates).length === 0) return { ok: true };

  const [updated] = await db
    .update(qrCode)
    .set(updates)
    .where(eq(qrCode.id, code.id))
    .returning();

  if (destinationChanged) {
    await db.insert(qrRedirect).values({
      qrCodeId: code.id,
      destinationUrl: updated.destinationUrl,
    });
  }
  if (destinationChanged || activeChanged) {
    await invalidateDestination(code.shortCode);
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

  const code = await getOwnedCode(id, current.id);
  if (!code) return { ok: false, error: "Code not found" };

  await db
    .insert(qrDesign)
    .values({
      qrCodeId: code.id,
      foregroundColor: input.foregroundColor,
      backgroundColor: input.backgroundColor,
      logoUrl: input.logoUrl ?? null,
    })
    .onConflictDoUpdate({
      target: qrDesign.qrCodeId,
      set: {
        foregroundColor: input.foregroundColor,
        backgroundColor: input.backgroundColor,
        logoUrl: input.logoUrl ?? null,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/app/codes/${id}`);
  return { ok: true };
}

export async function archiveCode(
  id: string,
): Promise<{ ok: true } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const code = await getOwnedCode(id, current.id);
  if (!code) return { ok: false, error: "Code not found" };

  if (!code.archivedAt) {
    await db
      .update(qrCode)
      .set({ archivedAt: new Date(), isActive: false })
      .where(eq(qrCode.id, code.id));
    await invalidateDestination(code.shortCode);
  }

  revalidatePath("/app/codes");
  return { ok: true };
}
