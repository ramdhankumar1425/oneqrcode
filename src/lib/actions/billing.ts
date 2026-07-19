"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import {
  CashfreeError,
  cancelSubscription,
  createSubscription,
  getSubscription,
  mapSubscriptionStatus,
} from "@/lib/cashfree";
import { getPlan, isPlanId } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

export type ActionError = { ok: false; error: string };

const PHONE_RE = /^[6-9]\d{9}$/;

/**
 * Start a Cashfree subscription for a paid plan. Returns the checkout
 * session id, which the client hands to the Cashfree JS SDK
 * (subscriptionsCheckout) to collect a payment method and authorize the mandate.
 */
export async function startSubscription(
  planId: string,
  phone: string,
): Promise<{ ok: true; sessionId: string } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  if (!isPlanId(planId)) return { ok: false, error: "Unknown plan" };
  const plan = getPlan(planId);
  if (plan.interval === null || plan.cfPlanId === null) {
    return { ok: false, error: "Billing isn't configured for this plan." };
  }

  const cleanedPhone = phone.replace(/\D/g, "").slice(-10);
  if (!PHONE_RE.test(cleanedPhone)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
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
  const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/app/dashboard?sub=${merchantSubscriptionId}`;

  let cf;
  try {
    cf = await createSubscription({
      subscriptionId: merchantSubscriptionId,
      planId: plan.cfPlanId,
      customer: {
        id: current.id,
        name: current.name,
        email: current.email,
        phone: cleanedPhone,
      },
      returnUrl,
    });
  } catch (error) {
    if (error instanceof CashfreeError) {
      return { ok: false, error: "Payment provider error. Please try again." };
    }
    throw error;
  }

  if (!cf.sessionId) {
    return { ok: false, error: "Couldn't start checkout. Please try again." };
  }

  await db.insert(subscription).values({
    userId: current.id,
    plan: plan.id,
    status: "incomplete",
    cfSubscriptionId: merchantSubscriptionId,
    cfPlanId: plan.cfPlanId,
    cfCustomerId: current.id,
    cfSessionId: cf.sessionId,
  });

  revalidatePath("/app/billing");
  return { ok: true, sessionId: cf.sessionId };
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

/**
 * Resume a pending (incomplete) subscription: fetch its current state from
 * Cashfree. If it activated in the meantime, sync it; otherwise hand back the
 * authorization link so the user can add a payment method / approve the mandate.
 */
export async function resumeSubscriptionAuthorization(): Promise<
  { ok: true; sessionId?: string; activated?: boolean } | ActionError
> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const [sub] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, current.id),
        eq(subscription.status, "incomplete"),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  if (!sub) return { ok: false, error: "No pending subscription to complete." };

  let cf;
  try {
    cf = await getSubscription(sub.cfSubscriptionId);
  } catch (error) {
    if (error instanceof CashfreeError) {
      return { ok: false, error: "Couldn't reach the payment provider. Try again." };
    }
    throw error;
  }

  const mapped = mapSubscriptionStatus(cf.status);

  // activated since we last saw it (webhook may not have landed yet) — sync
  if (mapped === "active") {
    await db
      .update(subscription)
      .set({ status: "active" })
      .where(eq(subscription.id, sub.id));
    revalidatePath("/app/billing");
    return { ok: true, activated: true };
  }

  // terminal (link/card expired, cancelled) — the stale row is unusable
  if (mapped === "canceled") {
    await db
      .update(subscription)
      .set({ status: "canceled", canceledAt: new Date() })
      .where(eq(subscription.id, sub.id));
    revalidatePath("/app/billing");
    return {
      ok: false,
      error: "That checkout expired. Start the upgrade again.",
    };
  }

  // still pending authorization — reopen the checkout with the saved session id
  const sessionId = cf.sessionId ?? sub.cfSessionId;
  if (sessionId) return { ok: true, sessionId };

  return {
    ok: false,
    error: "Couldn't resume checkout. Cancel and start the upgrade again.",
  };
}
