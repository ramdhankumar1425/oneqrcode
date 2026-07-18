import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { cancelSubscription, CashfreeError } from "@/lib/cashfree";
import { badRequest, ok, unauthorized } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

/** Cancel the user's active/pending subscription. */
export async function POST() {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

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

  if (!sub) return badRequest("No active subscription to cancel");

  try {
    await cancelSubscription(sub.cfSubscriptionId);
  } catch (error) {
    if (error instanceof CashfreeError) {
      return NextResponse.json(
        { error: "Cashfree could not cancel the subscription", details: error.body },
        { status: 502 },
      );
    }
    throw error;
  }

  // reflect immediately; the webhook will also confirm CANCELLED
  const [row] = await db
    .update(subscription)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(subscription.id, sub.id))
    .returning();

  return ok({ subscription: row });
}
