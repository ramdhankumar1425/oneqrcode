import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — BYPASSES Row Level Security. Server-only.
 * Use exclusively for the two system paths that have no logged-in user:
 * the public /r/[shortCode] redirect and the Razorpay webhook. Never import
 * this into client code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
