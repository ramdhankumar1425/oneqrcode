import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type Plan } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { getUserPlan } from "@/lib/subscription";

export type AppContext = {
  user: { id: string; name: string; email: string; image: string | null };
  plan: Plan;
  onboardingCompleted: boolean;
};

/** Server-side context for /app pages: identity, plan, and onboarding status.
 *  Memoized per request so the layout and page don't re-run these queries. */
export const getAppContext = cache(async (): Promise<AppContext | null> => {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = await createClient();

  // independent reads — run them in one wall-clock round-trip, not two
  const [{ data: profile }, plan] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, onboarding_completed_at")
      .eq("id", current.id)
      .maybeSingle(),
    getUserPlan(),
  ]);

  return {
    user: {
      id: current.id,
      name: (profile?.name as string) || current.name,
      email: current.email,
      image: current.image,
    },
    plan,
    onboardingCompleted: profile?.onboarding_completed_at != null,
  };
});
