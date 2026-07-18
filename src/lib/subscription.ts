import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { type Plan, planForSubscription } from "@/lib/plans";

/** Resolve a user's effective plan from their active/trialing subscription. */
export async function getUserPlan(userId: string): Promise<Plan> {
  const [activeSub] = await db
    .select({ plan: subscription.plan })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, ["active", "trialing"]),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return planForSubscription(activeSub?.plan);
}
