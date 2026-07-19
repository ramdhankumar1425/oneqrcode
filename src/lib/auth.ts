import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../index";
import { account, session, user, verification } from "../db/schemas/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // client uses the v1 relations API (no `schema`), so hand the adapter its tables explicitly
    schema: { user, session, account, verification },
  }),

  // cache the session in a signed cookie so getSession doesn't hit the DB on
  // every request (DB-backed setups don't enable this by default)
  session: {
    cookieCache: { enabled: true, maxAge: 300 },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: "offline",
    },
  },

  // onboarding fields — populated post-signup by /api/onboarding, not user input
  user: {
    additionalFields: {
      heardFrom: { type: "string", required: false, input: false },
      useCase: { type: "string", required: false, input: false },
      onboardingCompletedAt: { type: "date", required: false, input: false },
    },
  },

  // must be last — lets server-side auth.api calls set cookies
  plugins: [nextCookies()],
});
