"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { PLANS, type PlanId } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Hint, Input, Label } from "@/components/ui/input";
import { ArrowUpRight, Check } from "@/components/ui/icons";
import {
  cancelActiveSubscription,
  resumeSubscriptionAuthorization,
  startSubscription,
} from "@/lib/actions/billing";
import { openSubscriptionCheckout } from "@/lib/cashfree-sdk";

function formatPrice(paise: number): string {
  if (paise === 0) return "₹0";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function BillingPanel({
  currentPlanId,
  subStatus,
  periodEnd,
}: {
  currentPlanId: PlanId;
  subStatus: string | null;
  periodEnd: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  const proActive =
    currentPlanId === "pro" &&
    (subStatus === "active" || subStatus === "trialing");
  const proPending = subStatus === "incomplete";

  async function upgrade() {
    setErr(null);
    setLoading(true);
    const result = await startSubscription("pro", phone);
    if (!result.ok) {
      setLoading(false);
      setErr(result.error);
      return;
    }
    // hand the session to Cashfree's hosted checkout (payment method + mandate)
    try {
      await openSubscriptionCheckout(result.sessionId);
    } catch {
      setLoading(false);
      setErr("Couldn't open the payment page. Please try again.");
    }
  }

  async function completeSetup() {
    setErr(null);
    setLoading(true);
    const result = await resumeSubscriptionAuthorization();
    if (!result.ok) {
      setLoading(false);
      setErr(result.error);
      router.refresh();
      return;
    }
    if (result.sessionId) {
      try {
        await openSubscriptionCheckout(result.sessionId);
      } catch {
        setLoading(false);
        setErr("Couldn't open the payment page. Please try again.");
      }
      return;
    }
    // already activated
    setLoading(false);
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel your subscription? You'll drop to the Free plan.")) return;
    setLoading(true);
    await cancelActiveSubscription();
    setLoading(false);
    router.refresh();
  }

  const plans: PlanId[] = ["free", "pro"];

  return (
    <div>
      {err && (
        <Hint error className="mb-4">
          {err}
        </Hint>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {plans.map((id) => {
          const plan = PLANS[id];
          const isCurrent =
            (id === "free" && currentPlanId === "free") ||
            (id === "pro" && proActive);
          return (
            <Card
              key={id}
              className={cn(
                "relative",
                isCurrent && "border-forest-900 ring-2 ring-forest-900",
              )}
            >
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-display text-xl">{plan.name}</h3>
                  {isCurrent && <Badge variant="accent">Current</Badge>}
                  {id === "pro" && proPending && (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.interval && (
                    <span className="font-mono text-xs uppercase text-muted-foreground">
                      / {plan.interval}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-accent">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {id === "pro" && !proActive && !proPending && (
                  <div className="flex flex-col gap-3">
                    <Field>
                      <Label htmlFor="phone">Mobile number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        maxLength={10}
                      />
                      <Hint>Required by the bank to set up the mandate.</Hint>
                    </Field>
                    <Button onClick={upgrade} disabled={loading}>
                      {loading ? "Starting…" : "Upgrade to Pro"}{" "}
                      <ArrowUpRight size={15} />
                    </Button>
                  </div>
                )}
                {id === "pro" && proPending && (
                  <div className="flex flex-col gap-2">
                    <Hint>
                      Your subscription is created, but the recurring-payment
                      mandate isn&apos;t authorized with your bank yet. Add a
                      payment method to finish.
                    </Hint>
                    <Button onClick={completeSetup} disabled={loading}>
                      {loading ? "Opening…" : "Add payment method"}{" "}
                      <ArrowUpRight size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancel}
                      disabled={loading}
                      className="text-danger hover:bg-danger-soft"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {id === "pro" && proActive && (
                  <div className="flex flex-col gap-2">
                    {periodEnd && (
                      <Hint>
                        Renews {new Date(periodEnd).toLocaleDateString()}
                      </Hint>
                    )}
                    <Button variant="outline" onClick={cancel} disabled={loading}>
                      {loading ? "Working…" : "Cancel subscription"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
