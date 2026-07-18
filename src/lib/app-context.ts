import { eq } from "drizzle-orm";
import { db } from "@/index";
import { user as userTable } from "@/db/schemas";
import { type Plan } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { getUserPlan } from "@/lib/subscription";

export type AppContext = {
  user: { id: string; name: string; email: string; image: string | null };
  plan: Plan;
  onboardingCompleted: boolean;
};

/** Server-side context for /app pages: identity, plan, and onboarding status. */
export async function getAppContext(): Promise<AppContext | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const [profile] = await db
    .select({ onboardingCompletedAt: userTable.onboardingCompletedAt })
    .from(userTable)
    .where(eq(userTable.id, current.id))
    .limit(1);

  const plan = await getUserPlan(current.id);

  return {
    user: {
      id: current.id,
      name: current.name,
      email: current.email,
      image: current.image ?? null,
    },
    plan,
    onboardingCompleted: profile?.onboardingCompletedAt != null,
  };
}
