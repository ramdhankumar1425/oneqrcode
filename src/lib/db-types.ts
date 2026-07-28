/**
 * Hand-written row types for the tables we query through supabase-js.
 * Column names are snake_case to match Postgres (supabase-js returns raw rows).
 */

export type QrType = "dynamic" | "static";

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  heard_from: string | null;
  use_case: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QrCodeRow = {
  id: string;
  user_id: string;
  title: string;
  short_code: string;
  destination_url: string;
  type: QrType;
  is_active: boolean;
  archived_at: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QrDesignRow = {
  id: string;
  qr_code_id: string;
  foreground_color: string;
  background_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type QrRedirectRow = {
  id: string;
  qr_code_id: string;
  destination_url: string;
  created_at: string;
};

export type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "paused";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  rzp_subscription_id: string;
  rzp_plan_id: string;
  rzp_customer_id: string | null;
  created_at: string;
  updated_at: string;
};
