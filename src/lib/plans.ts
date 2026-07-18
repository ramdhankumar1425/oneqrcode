/**
 * Plan catalog — source of truth for pricing, limits, and features.
 * Lives in code, not the database. The `subscription.plan` column stores only
 * a PlanId string, validated against this catalog.
 *
 * Cashfree plan ids come from env so they can differ per environment
 * (test vs prod) without code changes.
 */

export type PlanId = "free" | "pro" | "business";

export type PlanLimits = {
  /** max active (non-archived) QR codes; null = unlimited */
  qrCodes: number | null;
  /** access to the full analytics dashboard (paid feature) */
  analytics: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  /** price in minor units (paise), per interval */
  price: number;
  currency: "INR";
  interval: "month" | null; // null = free / no billing cycle
  /** Cashfree plan id, or null for free (no gateway subscription) */
  cfPlanId: string | null;
  limits: PlanLimits;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "INR",
    interval: null,
    cfPlanId: null,
    limits: {
      qrCodes: 1,
      analytics: false,
    },
    features: [
      "1 dynamic QR code",
      "1,000 scans / month",
      "Basic scan counts",
      "oqr.to short link",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 90_000, // ₹900.00
    currency: "INR",
    interval: "month",
    cfPlanId: process.env.CASHFREE_PLAN_ID_PRO ?? null,
    limits: {
      qrCodes: 25,
      analytics: true,
    },
    features: [
      "25 dynamic QR codes",
      "Unlimited scans",
      "Full analytics dashboard",
      "Custom short slugs",
      "SVG & print-ready exports",
      "Email support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 290_000, // ₹2,900.00
    currency: "INR",
    interval: "month",
    cfPlanId: process.env.CASHFREE_PLAN_ID_BUSINESS ?? null,
    limits: {
      qrCodes: null,
      analytics: true,
    },
    features: [
      "Unlimited QR codes",
      "Bulk create & import",
      "Priority support",
    ],
  },
};

/** Plans that carry a real billing cycle (i.e. create a subscription row). */
export const PAID_PLAN_IDS = ["pro", "business"] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro" || value === "business";
}

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

/** Resolve a subscription row's plan; falls back to free when there's no row. */
export function planForSubscription(plan: string | null | undefined): Plan {
  return plan && isPlanId(plan) ? PLANS[plan] : PLANS.free;
}
