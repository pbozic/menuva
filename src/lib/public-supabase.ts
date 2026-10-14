import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Anonymous client for public pages (no cookies). Null when Supabase isn't configured. */
export function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
