import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

/**
 * The signed-in user (validated against Supabase Auth), or null.
 * Wrapped in React cache() so the layout and page in one request share a single
 * getUser() call. `name` falls back to auth metadata; profiles.name is the
 * authoritative editable value (see getAppContext).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name: (meta.name as string) ?? (meta.full_name as string) ?? "",
    image: (meta.avatar_url as string) ?? null,
  };
});
