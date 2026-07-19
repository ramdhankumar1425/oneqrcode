CREATE TYPE "browser" AS ENUM('chrome', 'firefox', 'safari', 'edge', 'other');--> statement-breakpoint
CREATE TYPE "device_type" AS ENUM('desktop', 'mobile', 'tablet');--> statement-breakpoint
CREATE TYPE "os" AS ENUM('windows', 'macos', 'linux', 'android', 'ios', 'other');--> statement-breakpoint
CREATE TYPE "qr_type" AS ENUM('dynamic', 'static');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('pending', 'success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM('incomplete', 'active', 'past_due', 'canceled', 'trialing', 'paused');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"heard_from" text,
	"use_case" text,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_code" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"short_code" text NOT NULL UNIQUE,
	"destination_url" text NOT NULL,
	"type" "qr_type" DEFAULT 'dynamic'::"qr_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp,
	"scan_count" bigint DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_design" (
	"id" text PRIMARY KEY,
	"qr_code_id" text NOT NULL UNIQUE,
	"foreground_color" text DEFAULT '#0c1f15' NOT NULL,
	"background_color" text DEFAULT '#ffffff' NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_redirect" (
	"id" text PRIMARY KEY,
	"qr_code_id" text NOT NULL,
	"destination_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_scan" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "qr_scan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"qr_code_id" text NOT NULL,
	"ip_hash" text NOT NULL,
	"country" text,
	"device_type" "device_type" DEFAULT 'desktop'::"device_type" NOT NULL,
	"os" "os" DEFAULT 'other'::"os" NOT NULL,
	"browser" "browser" DEFAULT 'other'::"browser" NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY,
	"subscription_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"payment_type" text,
	"cf_payment_id" text UNIQUE,
	"cf_order_id" text,
	"method" text,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"cf_subscription_id" text NOT NULL UNIQUE,
	"cf_plan_id" text NOT NULL,
	"cf_customer_id" text NOT NULL,
	"cf_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY,
	"source" text DEFAULT 'cashfree' NOT NULL,
	"event_id" text NOT NULL UNIQUE,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"error" text,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "qr_code_user_id_idx" ON "qr_code" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_design_qr_code_id_idx" ON "qr_design" ("qr_code_id");--> statement-breakpoint
CREATE INDEX "qr_redirect_qr_code_id_created_at_idx" ON "qr_redirect" ("qr_code_id","created_at");--> statement-breakpoint
CREATE INDEX "qr_scan_qr_code_id_created_at_idx" ON "qr_scan" ("qr_code_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_subscription_id_idx" ON "payment" ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscription" ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_event" ("type");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_design" ADD CONSTRAINT "qr_design_qr_code_id_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_code"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_redirect" ADD CONSTRAINT "qr_redirect_qr_code_id_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_code"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_qr_code_id_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_code"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;