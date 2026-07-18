import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { ok, unauthorized } from "@/lib/http";
import { planForSubscription } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

/** Dashboard bootstrap: identity + plan + onboarding status in one call. */
export async function GET() {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  // active/trialing subscription (if any) determines the paid plan; else free
  const [activeSub] = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, current.id),
        inArray(subscription.status, ["active", "trialing"]),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  const plan = planForSubscription(activeSub?.plan);

  const u = current as typeof current & {
    heardFrom?: string | null;
    useCase?: string | null;
    onboardingCompletedAt?: Date | string | null;
  };

  return ok({
    user: {
      id: current.id,
      name: current.name,
      email: current.email,
      image: current.image ?? null,
    },
    onboarding: {
      completed: u.onboardingCompletedAt != null,
      heardFrom: u.heardFrom ?? null,
      useCase: u.useCase ?? null,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      limits: plan.limits,
      status: activeSub?.status ?? null,
      currentPeriodEnd: activeSub?.currentPeriodEnd ?? null,
    },
  });
}
