import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session on each matched request, then applies auth
 * routing:
 *   - signed-in users never see /login or /signup → sent to the dashboard
 *   - signed-out users can't open /app/* → sent to /login
 * Real per-table enforcement is RLS; this is just navigation. Redirects carry
 * the refreshed auth cookies so tokens stay fresh across the bounce.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) res.cookies.set(cookie);
    return res;
  };

  if (isAuthPage && user) return redirectTo("/app/dashboard");
  if (pathname.startsWith("/app") && !user) return redirectTo("/login");

  return response;
}

export const config = {
  matcher: ["/login", "/signup", "/app/:path*"],
};
