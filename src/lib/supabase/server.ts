import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * User-scoped Supabase client for RSC / Server Actions / Route Handlers.
 * Reads the logged-in user's auth cookies, so every query runs as that user and
 * RLS enforces ownership. Cookie writes are best-effort (they throw in pure RSC
 * render — that's fine; the proxy/middleware refreshes the session).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component render — safe to ignore
          }
        },
      },
    },
  );
}
