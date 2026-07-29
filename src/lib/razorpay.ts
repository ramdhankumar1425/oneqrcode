import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Thin typed wrapper over the Razorpay Subscriptions REST API (fetch-based, no SDK).
 *
 * Env:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 *   RAZORPAY_PLAN_ID_PRO   (the Razorpay Plan id, referenced from plans.ts via env)
 */

const BASE_URL = "https://api.razorpay.com/v1";

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "RazorpayError";
  }
}

async function razorpayFetch<T>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new RazorpayError(
      `Razorpay ${init.method} ${path} failed (${res.status})`,
      res.status,
      body,
    );
  }
  return body as T;
}

export type RazorpaySubscription = {
  id: string;
  status: string | null;
  shortUrl: string | null;
  raw: Record<string, unknown>;
};

function parseSubscription(
  raw: Record<string, unknown>,
): RazorpaySubscription {
  return {
    id: (raw.id as string) ?? "",
    status: (raw.status as string) ?? null,
    shortUrl: (raw.short_url as string | undefined) ?? null,
    raw,
  };
}

export type CreateSubscriptionParams = {
  planId: string;
  /** number of billing cycles Razorpay will attempt (monthly → 120 ≈ 10 years) */
  totalCount?: number;
  notes?: Record<string, string>;
};

export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<RazorpaySubscription> {
  const raw = await razorpayFetch<Record<string, unknown>>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: params.totalCount ?? 120,
      quantity: 1,
      customer_notify: 1,
      notes: params.notes ?? {},
    }),
  });
  return parseSubscription(raw);
}

export async function fetchSubscription(
  subscriptionId: string,
): Promise<RazorpaySubscription> {
  const raw = await razorpayFetch<Record<string, unknown>>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
  return parseSubscription(raw);
}

/**
 * Cancel a subscription. `atCycleEnd` (default) keeps it active until the paid
 * period ends, then stops renewals — so a customer who's already been charged
 * keeps access for the rest of the cycle. Pass false to cancel immediately
 * (used for unpaid/incomplete subscriptions).
 */
export async function cancelSubscription(
  subscriptionId: string,
  atCycleEnd = true,
): Promise<void> {
  await razorpayFetch(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancel_at_cycle_end: atCycleEnd ? 1 : 0 }),
    },
  );
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verify the Checkout success handshake for a subscription:
 * signature = HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, key_secret).
 */
export function verifyPaymentSignature(params: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${params.paymentId}|${params.subscriptionId}`)
    .digest("hex");
  return safeEqualHex(expected, params.signature);
}

/** Verify a Razorpay webhook: signature = HMAC_SHA256(rawBody, webhook_secret). */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Map a Razorpay subscription status to our internal enum. */
export function mapSubscriptionStatus(
  status: string | null | undefined,
): "incomplete" | "active" | "past_due" | "canceled" | "paused" | null {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "active";
    case "created":
    case "authenticated":
      return "incomplete";
    case "pending":
    case "halted":
      return "past_due";
    case "paused":
      return "paused";
    case "cancelled":
    case "completed":
    case "expired":
      return "canceled";
    default:
      return null;
  }
}
