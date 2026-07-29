/**
 * Plan catalog — source of truth for pricing, limits, and features.
 * Lives in code, not the database. The `subscription.plan` column stores only
 * a PlanId string, validated against this catalog.
 *
 * Razorpay plan ids come from env so they can differ per environment
 * (test vs live) without code changes.
 */

export type PlanId = "free" | "pro";

export type PlanLimits = {
  /** max active (non-archived) QR codes; null = unlimited */
  qrCodes: number | null;
  /** access to the full analytics dashboard (paid feature) */
  analytics: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  /** current price in minor units (paise), per interval */
  price: number;
  /** pre-discount price in paise, shown struck-through; null = no discount */
  originalPrice: number | null;
  currency: "INR";
  interval: "month" | null; // null = free / no billing cycle
  /** Razorpay plan id, or null for free (no gateway subscription) */
  rzpPlanId: string | null;
  limits: PlanLimits;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    originalPrice: null,
    currency: "INR",
    interval: null,
    rzpPlanId: null,
    limits: {
      qrCodes: 1,
      analytics: false,
    },
    features: [
      "1 dynamic QR code",
      "Unlimited static codes",
      "1,000 scans / month",
      "Basic scan counts",
      "oqr.to short link",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19_900, // ₹199.00 (discounted)
    originalPrice: 39_900, // ₹399.00
    currency: "INR",
    interval: "month",
    rzpPlanId: process.env.RAZORPAY_PLAN_ID_PRO ?? null,
    limits: {
      qrCodes: null,
      analytics: true,
    },
    features: [
      "Unlimited dynamic QR codes",
      "Unlimited static codes",
      "Unlimited scans",
      "Full analytics dashboard",
      "Custom short slugs",
      "SVG & print-ready exports",
      "Email support",
    ],
  },
};

/** Plans that carry a real billing cycle (i.e. create a subscription row). */
export const PAID_PLAN_IDS = ["pro"] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro";
}

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

/** Discount percentage vs the original price, or null when there's no discount. */
export function discountPercent(plan: Plan): number | null {
  if (!plan.originalPrice || plan.originalPrice <= plan.price) return null;
  return Math.round(
    ((plan.originalPrice - plan.price) / plan.originalPrice) * 100,
  );
}

/** Resolve a subscription row's plan; falls back to free when there's no row. */
export function planForSubscription(plan: string | null | undefined): Plan {
  return plan && isPlanId(plan) ? PLANS[plan] : PLANS.free;
}
