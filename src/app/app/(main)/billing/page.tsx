import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { isPlanId } from "@/lib/plans";
import { BillingPanel } from "@/components/app/billing-panel";

export default async function BillingPage() {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscription")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .in("status", ["active", "trialing", "incomplete"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
          subStatus={(sub?.status as string | undefined) ?? null}
          periodEnd={(sub?.current_period_end as string | undefined) ?? null}
          cancelAtPeriodEnd={Boolean(sub?.cancel_at_period_end)}
          userName={ctx.user.name}
          userEmail={ctx.user.email}
        />
      </div>
    </div>
  );
}
