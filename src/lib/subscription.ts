import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type Plan, planForSubscription } from "@/lib/plans";

/** Resolve the current user's effective plan from their active subscription.
 *  RLS scopes the query to the logged-in user. Memoized per request.
 *
 *  A subscription scheduled to cancel at period end (cancel_at_period_end) stays
 *  on its paid plan until current_period_end passes — access is not lost the
 *  moment they cancel. The period cutoff is a safety net in case the provider's
 *  end-of-cycle webhook is late; normal renewals keep status active via webhook. */
export const getUserPlan = cache(async (): Promise<Plan> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription")
    .select("plan, cancel_at_period_end, current_period_end")
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return planForSubscription(undefined);

  const periodEnd = data.current_period_end
    ? new Date(data.current_period_end as string).getTime()
    : null;
  if (data.cancel_at_period_end && periodEnd != null && periodEnd < Date.now()) {
    // scheduled cancellation and the paid period has elapsed → back to free
    return planForSubscription(undefined);
  }

  return planForSubscription(data.plan as string | undefined);
});
