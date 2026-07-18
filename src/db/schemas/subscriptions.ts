import { nanoid } from "nanoid";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ---------------------------------- enums --------------------------------- */

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  // created but not yet authorized by the customer (Cashfree INITIALIZED / pending)
  "incomplete",
  "active",
  "past_due",
  "canceled",
  "trialing",
  "paused",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

/* ------------------------------ subscription ------------------------------ */
/* Paid plans only — free users have no row. */

export const subscription = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // PlanId string, validated in code against the plan catalog (src/lib/plans.ts)
    plan: text("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull(),

    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at"),

    // Cashfree
    cfSubscriptionId: text("cf_subscription_id").notNull().unique(),
    cfPlanId: text("cf_plan_id").notNull(),
    cfCustomerId: text("cf_customer_id").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("subscription_user_id_idx").on(table.userId)],
);

/* -------------------------------- payment --------------------------------- */

export const payment = pgTable(
  "payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),

    // stored in minor units (paise)
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("pending"),

    // Cashfree
    cfPaymentId: text("cf_payment_id").unique(),
    cfOrderId: text("cf_order_id"),
    method: text("method"),
    paidAt: timestamp("paid_at"),
    failedAt: timestamp("failed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("payment_subscription_id_idx").on(table.subscriptionId)],
);

/* ------------------------------ webhook_event ----------------------------- */
/* Raw provider webhooks — idempotency (dedupe by eventId) + audit. */

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    source: text("source").notNull().default("cashfree"),
    // provider's event/idempotency id — dedupe key for retried deliveries
    eventId: text("event_id").notNull().unique(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at"),
    error: text("error"),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
  },
  (table) => [index("webhook_event_type_idx").on(table.type)],
);
