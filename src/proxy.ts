import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge auth routing (optimistic — checks cookie presence only, no DB):
 *  - signed-in users never see /login or /signup → sent to the dashboard
 *  - signed-out users can't open /app/* → sent to /login
 * Real session validation still happens in the /app layout and server actions.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = getSessionCookie(request) != null;

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }
  if (pathname.startsWith("/app") && !hasSession) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/app/:path*"],
};
