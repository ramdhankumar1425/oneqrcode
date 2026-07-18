import { nanoid } from "nanoid";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/index";
import { subscription } from "@/db/schemas";
import { createSubscription, CashfreeError } from "@/lib/cashfree";
import { badRequest, created, ok, unauthorized } from "@/lib/http";
import { NextResponse } from "next/server";
import { getPlan, isPlanId, PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

/** The user's current (active/trialing/incomplete) subscription, if any. */
export async function GET() {
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

  return ok({ subscription: sub ?? null });
}

/** Start a subscription for a paid plan; returns the Cashfree authorization link. */
export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return unauthorized();

  let body: { plan?: unknown };
  try {
    body = (await request.json()) as { plan?: unknown };
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body.plan !== "string" || !isPlanId(body.plan)) {
    return badRequest("'plan' must be a valid plan id");
  }
  const plan = getPlan(body.plan);
  if (plan.interval === null || plan.cfPlanId === null) {
    return badRequest(
      plan.id === PLANS.free.id
        ? "The free plan doesn't require a subscription"
        : "Billing isn't configured for this plan",
    );
  }

  // block a second concurrent subscription
  const [existing] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, current.id),
        inArray(subscription.status, ["active", "trialing", "incomplete"]),
      ),
    )
    .limit(1);
  if (existing) {
    return badRequest("You already have an active or pending subscription");
  }

  const merchantSubscriptionId = `sub_${nanoid()}`;
  const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/billing?sub=${merchantSubscriptionId}`;

  let cf;
  try {
    cf = await createSubscription({
      subscriptionId: merchantSubscriptionId,
      planId: plan.cfPlanId,
      customer: {
        id: current.id,
        name: current.name,
        email: current.email,
      },
      returnUrl,
    });
  } catch (error) {
    if (error instanceof CashfreeError) {
      return NextResponse.json(
        { error: "Cashfree could not create the subscription", details: error.body },
        { status: 502 },
      );
    }
    throw error;
  }

  // row starts incomplete; the webhook flips it to active once authorized
  const [row] = await db
    .insert(subscription)
    .values({
      userId: current.id,
      plan: plan.id,
      status: "incomplete",
      cfSubscriptionId: merchantSubscriptionId,
      cfPlanId: plan.cfPlanId,
      cfCustomerId: current.id,
    })
    .returning();

  return created({ subscription: row, authLink: cf.authLink });
}
