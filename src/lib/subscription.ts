import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type Plan, planForSubscription } from "@/lib/plans";

/** Resolve the current user's effective plan from their active subscription.
 *  RLS scopes the query to the logged-in user. Memoized per request. */
export const getUserPlan = cache(async (): Promise<Plan> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription")
    .select("plan")
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return planForSubscription(data?.plan as string | undefined);
});
