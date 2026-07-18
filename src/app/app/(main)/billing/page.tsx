import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { getAppContext } from "@/lib/app-context";
import { isPlanId } from "@/lib/plans";
import { BillingPanel } from "@/components/app/billing-panel";

export default async function BillingPage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  const [sub] = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, ctx.user.id),
        inArray(subscription.status, ["active", "trialing", "incomplete"]),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  const currentPlanId = isPlanId(ctx.plan.id) ? ctx.plan.id : "free";

  return (
    <div>
      <h1 className="text-display text-3xl">Billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your plan and subscription.
      </p>

      <div className="mt-8">
        <BillingPanel
          currentPlanId={currentPlanId}
          subStatus={sub?.status ?? null}
          periodEnd={sub?.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null}
        />
      </div>
    </div>
  );
}
