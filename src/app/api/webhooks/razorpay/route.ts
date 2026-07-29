import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSubscriptionStatus, verifyWebhookSignature } from "@/lib/razorpay";

// needs the Node runtime for node:crypto + the raw request body
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
  switch ((status ?? "").toLowerCase()) {
    case "captured":
      return "success";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

function epochToIso(seconds: number | undefined): string | undefined {
  return seconds ? new Date(seconds * 1000).toISOString() : undefined;
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = str(payload.event) ?? "unknown";
  const body = (payload.payload ?? {}) as Record<string, unknown>;
  const subEntity = ((body.subscription as Record<string, unknown>)?.entity ??
    {}) as Record<string, unknown>;
  const payEntity = ((body.payment as Record<string, unknown>)?.entity ??
    {}) as Record<string, unknown>;

  const rzpSubId = str(subEntity.id);
  const subStatus = str(subEntity.status);
  const currentEnd = epochToIso(num(subEntity.current_end));

  const rzpPaymentId = str(payEntity.id);
  const rzpInvoiceId = str(payEntity.invoice_id);
  const payStatus = str(payEntity.status);
  const payAmount = num(payEntity.amount); // already in paise
  const payCurrency = str(payEntity.currency) ?? "INR";
  const payMethod = str(payEntity.method);

  const admin = createAdminClient();

  // idempotency: Razorpay's per-delivery event id, else a stable composite
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `${event}:${rzpPaymentId ?? rzpSubId ?? ""}:${subStatus ?? payStatus ?? ""}`;

  // record receipt; if already processed, ack and stop
  const { data: inserted } = await admin
    .from("webhook_event")
    .insert({ source: "razorpay", event_id: eventId, type: event, payload })
    .select("id")
    .maybeSingle();

  if (!inserted) {
    const { data: existing } = await admin
      .from("webhook_event")
      .select("processed_at")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing?.processed_at) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // received before but not processed — fall through and retry
  }

  try {
    if (rzpSubId) {
      const { data: sub } = await admin
        .from("subscription")
        .select("id, current_period_end")
        .eq("rzp_subscription_id", rzpSubId)
        .maybeSingle();

      if (sub) {
        const mapped = mapSubscriptionStatus(subStatus);
        if (mapped) {
          const now = Date.now();
          const existingEnd = sub.current_period_end
            ? new Date(sub.current_period_end as string)
            : null;
          const incomingEnd = currentEnd ? new Date(currentEnd) : null;
          // paid-through date never moves backward (a cancel event must not
          // shorten a period the customer already paid for)
          const paidThrough =
            incomingEnd && (!existingEnd || incomingEnd > existingEnd)
              ? incomingEnd
              : existingEnd;

          const update: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (
            paidThrough &&
            (!existingEnd || paidThrough.getTime() !== existingEnd.getTime())
          ) {
            update.current_period_end = paidThrough.toISOString();
          }

          if (mapped === "canceled") {
            // cancellation (ours or via the payment method): flag it, but keep
            // the plan active until the paid period actually elapses
            update.cancel_at_period_end = true;
            update.canceled_at = new Date().toISOString();
            update.status =
              paidThrough && paidThrough.getTime() > now ? "active" : "canceled";
          } else {
            update.status = mapped;
          }

          await admin.from("subscription").update(update).eq("id", sub.id);
        }

        // record/refresh the payment ledger row for charge & refund events
        if (rzpPaymentId && payStatus) {
          const status = mapPaymentStatus(payStatus);
          const paidAt =
            status === "success" ? new Date().toISOString() : null;
          const failedAt =
            status === "failed" ? new Date().toISOString() : null;
          await admin.from("payment").upsert(
            {
              subscription_id: sub.id,
              amount: payAmount ?? 0,
              currency: payCurrency,
              status,
              rzp_payment_id: rzpPaymentId,
              rzp_invoice_id: rzpInvoiceId,
              method: payMethod,
              paid_at: paidAt,
              failed_at: failedAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "rzp_payment_id" },
          );
        }
      }
    }

    await admin
      .from("webhook_event")
      .update({ processed_at: new Date().toISOString(), error: null })
      .eq("event_id", eventId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // leave processed_at null so Razorpay's retry reprocesses this event
    await admin
      .from("webhook_event")
      .update({ error: error instanceof Error ? error.message : String(error) })
      .eq("event_id", eventId);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
