import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Full better-auth session ({ session, user }) or null.
 * Wrapped in React cache() so the layout and page in a single request share
 * one session validation instead of re-hitting better-auth/the DB each call.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user, or null. */
export const getCurrentUser = cache(async () => {
  const result = await getSession();
  return result?.user ?? null;
});
