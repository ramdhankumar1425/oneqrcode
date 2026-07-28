import { customAlphabet } from "nanoid";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { QrCodeRow } from "@/lib/db-types";

// unambiguous alphabet (no 0/O/1/l/I) for human-friendly short links
const SHORT_CODE_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const SHORT_CODE_LENGTH = 7;
const makeCode = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

// custom slugs: 3–32 chars, lowercase letters/numbers/hyphens, no leading/trailing hyphen
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function isValidHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

type Client = SupabaseClient;

async function client(supabase?: Client): Promise<Client> {
  return supabase ?? ((await createClient()) as Client);
}

/** Whether a short_code exists (across all users — via a SECURITY DEFINER RPC,
 *  because RLS otherwise hides other users' rows). */
export async function isShortCodeTaken(
  shortCode: string,
  supabase?: Client,
): Promise<boolean> {
  const sb = await client(supabase);
  const { data } = await sb.rpc("short_code_taken", { code: shortCode });
  return data === true;
}

/** Generate a unique random short code, retrying on the rare collision. */
export async function generateShortCode(supabase?: Client): Promise<string> {
  const sb = await client(supabase);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    if (!(await isShortCodeTaken(code, sb))) return code;
  }
  throw new Error("Could not generate a unique short code");
}

/** Count the user's active (non-archived) codes. RLS scopes to the user. */
export async function countActiveCodes(supabase?: Client): Promise<number> {
  const sb = await client(supabase);
  const { count } = await sb
    .from("qr_code")
    .select("*", { count: "exact", head: true })
    .is("archived_at", null);
  return count ?? 0;
}

/**
 * Count active *dynamic* codes — the plan limit applies only to these.
 * Static codes encode their destination directly and are unlimited on every plan.
 */
export async function countActiveDynamicCodes(
  supabase?: Client,
): Promise<number> {
  const sb = await client(supabase);
  const { count } = await sb
    .from("qr_code")
    .select("*", { count: "exact", head: true })
    .is("archived_at", null)
    .eq("type", "dynamic");
  return count ?? 0;
}

/** Fetch a code by id. RLS returns null for codes the user doesn't own. */
export async function getOwnedCode(
  id: string,
  supabase?: Client,
): Promise<QrCodeRow | null> {
  const sb = await client(supabase);
  const { data } = await sb
    .from("qr_code")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as QrCodeRow | null) ?? null;
}
