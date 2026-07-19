import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Thin typed wrapper over the Cashfree Subscriptions REST API.
 *
 * Env:
 *   CASHFREE_ENV            "sandbox" | "production"  (default sandbox)
 *   CASHFREE_CLIENT_ID
 *   CASHFREE_CLIENT_SECRET
 *   CASHFREE_API_VERSION    (default "2023-08-01")
 *   CASHFREE_WEBHOOK_SECRET (falls back to CASHFREE_CLIENT_SECRET)
 *
 * NOTE: exact request/response field names should be reconciled with the
 * Cashfree docs for your account's API version during the final live test;
 * response parsing below is defensive about that.
 */

function baseUrl(): string {
  return process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

function authHeaders(): Record<string, string> {
  return {
    "x-client-id": process.env.CASHFREE_CLIENT_ID ?? "",
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET ?? "",
    "x-api-version": process.env.CASHFREE_API_VERSION ?? "2025-01-01",
    "content-type": "application/json",
  };
}

export class CashfreeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

async function cashfreeFetch<T>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new CashfreeError(
      `Cashfree ${init.method} ${path} failed (${res.status})`,
      res.status,
      body,
    );
  }
  return body as T;
}

export type CreateSubscriptionParams = {
  /** merchant-side subscription id we control and store as cfSubscriptionId */
  subscriptionId: string;
  planId: string;
  // customer_phone is required by Cashfree
  customer: { id: string; name: string; email: string; phone: string };
  returnUrl: string;
};

export type CashfreeSubscription = {
  cfSubscriptionId: string | null;
  subscriptionId: string;
  status: string | null;
  /** session id consumed by the Cashfree JS/mobile SDK subscriptionsCheckout() */
  sessionId: string | null;
  raw: Record<string, unknown>;
};

function parseSubscription(raw: Record<string, unknown>): CashfreeSubscription {
  return {
    cfSubscriptionId:
      (raw.cf_subscription_id as string | undefined)?.toString() ?? null,
    subscriptionId: (raw.subscription_id as string) ?? "",
    status: (raw.subscription_status as string) ?? null,
    sessionId: (raw.subscription_session_id as string | undefined) ?? null,
    raw,
  };
}

export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<CashfreeSubscription> {
  const raw = await cashfreeFetch<Record<string, unknown>>(
    "/pg/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        subscription_id: params.subscriptionId,
        plan_details: { plan_id: params.planId },
        customer_details: {
          customer_id: params.customer.id,
          customer_name: params.customer.name,
          customer_email: params.customer.email,
          customer_phone: params.customer.phone,
        },
        subscription_meta: {
          return_url: params.returnUrl,
          notification_channel: ["EMAIL", "SMS"],
        },
      }),
    },
  );
  return parseSubscription(raw);
}

export async function getSubscription(
  subscriptionId: string,
): Promise<CashfreeSubscription> {
  const raw = await cashfreeFetch<Record<string, unknown>>(
    `/pg/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
  return parseSubscription(raw);
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await cashfreeFetch(
    `/pg/subscriptions/${encodeURIComponent(subscriptionId)}/manage`,
    { method: "POST", body: JSON.stringify({ action: "CANCEL" }) },
  );
}

/**
 * Verify a Cashfree webhook: signature = base64(HMAC-SHA256(timestamp + rawBody, secret)).
 * Returns false on any mismatch or missing secret.
 */
export function verifyWebhookSignature(
  timestamp: string | null,
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  if (!secret || !timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Map a Cashfree subscription status to our internal enum.
 *  States per the Subscriptions API lifecycle. */
export function mapSubscriptionStatus(
  status: string | null | undefined,
): "incomplete" | "active" | "past_due" | "canceled" | "paused" | null {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "INITIALIZED":
    case "BANK_APPROVAL_PENDING":
      return "incomplete";
    case "ON_HOLD":
    case "CARD_EXPIRED":
      return "past_due";
    case "PAUSED":
    case "CUSTOMER_PAUSED":
      return "paused";
    case "CANCELLED":
    case "CUSTOMER_CANCELLED":
    case "COMPLETED":
    case "EXPIRED":
    case "LINK_EXPIRED":
      return "canceled";
    default:
      return null;
  }
}
