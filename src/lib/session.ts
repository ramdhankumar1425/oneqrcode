import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Full better-auth session ({ session, user }) or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** The signed-in user, or null. */
export async function getCurrentUser() {
  const result = await getSession();
  return result?.user ?? null;
}
