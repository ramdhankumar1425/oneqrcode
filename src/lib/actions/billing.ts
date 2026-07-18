"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { CashfreeError, cancelSubscription, createSubscription } from "@/lib/cashfree";
import { getPlan, isPlanId } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

export type ActionError = { ok: false; error: string };

/** Start a Cashfree subscription for a paid plan; returns the auth link. */
export async function startSubscription(
  planId: string,
): Promise<{ ok: true; authLink: string | null } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  if (!isPlanId(planId)) return { ok: false, error: "Unknown plan" };
  const plan = getPlan(planId);
  if (plan.interval === null || plan.cfPlanId === null) {
    return { ok: false, error: "Billing isn't configured for this plan." };
  }

  const [existing] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, current.id),
        inArray(subscription.status, ["active", "trialing", "incomplete"]),
      ),
    )
    .limit(1);
  if (existing) {
    return { ok: false, error: "You already have an active or pending subscription." };
  }

  const merchantSubscriptionId = `sub_${nanoid()}`;
  const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/app/billing?sub=${merchantSubscriptionId}`;

  try {
    const cf = await createSubscription({
      subscriptionId: merchantSubscriptionId,
      planId: plan.cfPlanId,
      customer: { id: current.id, name: current.name, email: current.email },
      returnUrl,
    });

    await db.insert(subscription).values({
      userId: current.id,
      plan: plan.id,
      status: "incomplete",
      cfSubscriptionId: merchantSubscriptionId,
      cfPlanId: plan.cfPlanId,
      cfCustomerId: current.id,
    });

    revalidatePath("/app/billing");
    return { ok: true, authLink: cf.authLink };
  } catch (error) {
    if (error instanceof CashfreeError) {
      return { ok: false, error: "Payment provider error. Please try again." };
    }
    throw error;
  }
}

export async function cancelActiveSubscription(): Promise<
  { ok: true } | ActionError
> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const [sub] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, current.id),
        inArray(subscription.status, ["active", "trialing", "incomplete"]),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  if (!sub) return { ok: false, error: "No active subscription to cancel." };

  try {
    await cancelSubscription(sub.cfSubscriptionId);
  } catch (error) {
    if (error instanceof CashfreeError) {
      return { ok: false, error: "Payment provider error. Please try again." };
    }
    throw error;
  }

  await db
    .update(subscription)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(subscription.id, sub.id));

  revalidatePath("/app/billing");
  return { ok: true };
}
