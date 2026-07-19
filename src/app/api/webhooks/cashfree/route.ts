import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/index";
import { payment, subscription, webhookEvent } from "@/db/schemas";
import {
  mapSubscriptionStatus,
  verifyWebhookSignature,
} from "@/lib/cashfree";

// needs Node runtime for node:crypto + raw body
export const runtime = "nodejs";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
      ? Number(v)
      : undefined;

function mapPaymentStatus(
  status: string | undefined,
): "pending" | "success" | "failed" | "refunded" {
  switch ((status ?? "").toUpperCase()) {
    case "SUCCESS":
    case "PAID":
      return "success";
    case "FAILED":
    case "FAILURE":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!verifyWebhookSignature(timestamp, raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = str(payload.type) ?? "unknown";
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const subDetails = (data.subscription_details ??
    data.subscription ??
    {}) as Record<string, unknown>;
  // SUBSCRIPTION_PAYMENT_* events carry payment fields directly on `data`
  const payDetails = (data.payment_details ??
    data.subscription_payment_details ??
    data.payment ??
    data) as Record<string, unknown>;
  const authDetails = (data.authorization_details ?? {}) as Record<
    string,
    unknown
  >;

  const merchantSubId =
    str(subDetails.subscription_id) ?? str(data.subscription_id);
  const subStatus =
    str(subDetails.subscription_status) ?? str(data.subscription_status);
  const nextSchedule =
    str(subDetails.next_schedule_date) ??
    str(subDetails.subscription_next_scheduled_time);

  const cfPaymentId =
    str(payDetails.cf_payment_id) ?? str(payDetails.payment_id);
  const cfOrderId = str(payDetails.cf_order_id);
  const payStatus = str(payDetails.payment_status);
  const payAmount = num(payDetails.payment_amount) ?? num(payDetails.amount);
  const payCurrency = str(payDetails.payment_currency) ?? "INR";
  const paymentType = str(payDetails.payment_type)?.toLowerCase();
  const paymentMethodObj = (payDetails.payment_method ??
    authDetails.payment_method) as Record<string, unknown> | undefined;
  const payMethod =
    str(authDetails.payment_group) ??
    str(payDetails.payment_group) ??
    (paymentMethodObj ? Object.keys(paymentMethodObj)[0] : undefined);
  const refundStatus = str(payDetails.refund_status);

  // idempotency key: prefer a provider id, else a stable composite
  const eventId =
    str(payload.event_id) ??
    str(data.cf_event_id) ??
    `${type}:${timestamp ?? ""}:${cfPaymentId ?? merchantSubId ?? ""}:${subStatus ?? payStatus ?? ""}`;

  // record receipt; if already processed, ack and stop
  const inserted = await db
    .insert(webhookEvent)
    .values({ source: "cashfree", eventId, type, payload })
    .onConflictDoNothing({ target: webhookEvent.eventId })
    .returning({ id: webhookEvent.id });

  if (inserted.length === 0) {
    const [existing] = await db
      .select({ processedAt: webhookEvent.processedAt })
      .from(webhookEvent)
      .where(eq(webhookEvent.eventId, eventId))
      .limit(1);
    if (existing?.processedAt) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // received before but not processed — fall through and retry processing
  }

  try {
    if (merchantSubId) {
      const [sub] = await db
        .select({ id: subscription.id })
        .from(subscription)
        .where(eq(subscription.cfSubscriptionId, merchantSubId))
        .limit(1);

      if (sub) {
        const mapped = mapSubscriptionStatus(subStatus);
        if (mapped) {
          await db
            .update(subscription)
            .set({
              status: mapped,
              ...(nextSchedule
                ? { currentPeriodEnd: new Date(nextSchedule) }
                : {}),
              ...(mapped === "canceled" ? { canceledAt: new Date() } : {}),
            })
            .where(eq(subscription.id, sub.id));
        }

        const upperType = type.toUpperCase();
        const amountPaise =
          payAmount != null ? Math.round(payAmount * 100) : null;

        if (upperType.includes("REFUND")) {
          // refund event → mark the original payment refunded on success
          if (cfPaymentId && (refundStatus ?? "").toUpperCase() === "SUCCESS") {
            await db
              .update(payment)
              .set({ status: "refunded", updatedAt: new Date() })
              .where(eq(payment.cfPaymentId, cfPaymentId));
          }
        } else if (cfPaymentId && payStatus) {
          // any event carrying a payment_status (AUTH_STATUS, PAYMENT_SUCCESS/
          // FAILED/NOTIFICATION_INITIATED, …) → upsert the ledger row so a
          // payment progresses INITIALIZED → SUCCESS/FAILED without duplicating.
          const status = mapPaymentStatus(payStatus);
          const paidAt = status === "success" ? new Date() : null;
          const failedAt = status === "failed" ? new Date() : null;
          await db
            .insert(payment)
            .values({
              subscriptionId: sub.id,
              amount: amountPaise ?? 0,
              currency: payCurrency,
              status,
              paymentType,
              cfPaymentId,
              cfOrderId,
              method: payMethod,
              paidAt,
              failedAt,
            })
            .onConflictDoUpdate({
              target: payment.cfPaymentId,
              set: {
                status,
                ...(amountPaise != null ? { amount: amountPaise } : {}),
                paymentType,
                cfOrderId,
                method: payMethod,
                paidAt,
                failedAt,
                updatedAt: new Date(),
              },
            });
        }
      }
    }

    await db
      .update(webhookEvent)
      .set({ processedAt: new Date(), error: null })
      .where(eq(webhookEvent.eventId, eventId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    // leave processedAt null so Cashfree's retry reprocesses this event
    await db
      .update(webhookEvent)
      .set({ error: error instanceof Error ? error.message : String(error) })
      .where(eq(webhookEvent.eventId, eventId));
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
