"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RazorpayError,
  cancelSubscription,
  createSubscription,
  fetchSubscription,
  mapSubscriptionStatus,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { getPlan, isPlanId } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import type { SubscriptionRow } from "@/lib/db-types";

export type ActionError = { ok: false; error: string };

/**
 * Subscription rows are system-managed: users may READ their own (RLS) but must
 * never write them (that would let anyone self-grant Pro). All mutations here go
 * through the service-role client with an explicit user_id, from trusted server
 * actions only.
 */

/**
 * Start a Razorpay subscription for a paid plan. Creates the subscription
 * server-side and returns its id; the client opens Razorpay Checkout with it to
 * collect a payment method and authorize the mandate.
 */
export async function startSubscription(
  planId: string,
): Promise<{ ok: true; subscriptionId: string } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  if (!isPlanId(planId)) return { ok: false, error: "Unknown plan" };
  const plan = getPlan(planId);
  if (plan.interval === null || plan.rzpPlanId === null) {
    return { ok: false, error: "Billing isn't configured for this plan." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("subscription")
    .select("id")
    .eq("user_id", current.id)
    .in("status", ["active", "trialing", "incomplete"])
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "You already have an active or pending subscription." };
  }

  let rzp;
  try {
    rzp = await createSubscription({
      planId: plan.rzpPlanId,
      notes: { user_id: current.id },
    });
  } catch (error) {
    if (error instanceof RazorpayError) {
      return { ok: false, error: "Payment provider error. Please try again." };
    }
    throw error;
  }

  if (!rzp.id) {
    return { ok: false, error: "Couldn't start checkout. Please try again." };
  }

  const { error } = await admin.from("subscription").insert({
    user_id: current.id,
    plan: plan.id,
    status: "incomplete",
    rzp_subscription_id: rzp.id,
    rzp_plan_id: plan.rzpPlanId,
  });
  if (error) {
    return { ok: false, error: "Couldn't start checkout. Please try again." };
  }

  revalidatePath("/app/billing");
  return { ok: true, subscriptionId: rzp.id };
}

/**
 * Confirm the Checkout success handshake. Verifies the signature and, on
 * success, marks the subscription active immediately (the webhook reconciles
 * the authoritative state shortly after).
 */
export async function confirmSubscription(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): Promise<{ ok: true } | ActionError> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const valid = verifyPaymentSignature(input);
  if (!valid) return { ok: false, error: "Payment could not be verified." };

  const admin = createAdminClient();
  await admin
    .from("subscription")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("rzp_subscription_id", input.subscriptionId)
    .eq("user_id", current.id);

  revalidatePath("/app/billing");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

export async function cancelActiveSubscription(): Promise<
  { ok: true } | ActionError
> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscription")
    .select("*")
    .eq("user_id", current.id)
    .in("status", ["active", "trialing", "incomplete"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (!sub) return { ok: false, error: "No active subscription to cancel." };

  try {
    await cancelSubscription(sub.rzp_subscription_id);
  } catch (error) {
    if (error instanceof RazorpayError) {
      return { ok: false, error: "Payment provider error. Please try again." };
    }
    throw error;
  }

  await admin
    .from("subscription")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  revalidatePath("/app/billing");
  return { ok: true };
}

/**
 * Resume a pending (incomplete) subscription: check its state at Razorpay. If it
 * activated in the meantime, sync it; otherwise hand back its id so the client
 * can reopen Checkout to finish authorizing the mandate.
 */
export async function resumeSubscriptionAuthorization(): Promise<
  { ok: true; subscriptionId?: string; activated?: boolean } | ActionError
> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscription")
    .select("*")
    .eq("user_id", current.id)
    .eq("status", "incomplete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (!sub) return { ok: false, error: "No pending subscription to complete." };

  let rzp;
  try {
    rzp = await fetchSubscription(sub.rzp_subscription_id);
  } catch (error) {
    if (error instanceof RazorpayError) {
      return { ok: false, error: "Couldn't reach the payment provider. Try again." };
    }
    throw error;
  }

  const mapped = mapSubscriptionStatus(rzp.status);

  if (mapped === "active") {
    await admin
      .from("subscription")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", sub.id);
    revalidatePath("/app/billing");
    return { ok: true, activated: true };
  }

  if (mapped === "canceled") {
    await admin
      .from("subscription")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    revalidatePath("/app/billing");
    return { ok: false, error: "That checkout expired. Start the upgrade again." };
  }

  // still pending authorization — reopen Checkout with the same subscription id
  return { ok: true, subscriptionId: sub.rzp_subscription_id };
}
