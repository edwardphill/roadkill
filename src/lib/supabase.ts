import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase's "publishable" (or legacy "anon") key. It is meant to ship to browsers;
// row-level security in supabase/schema.sql is what protects the data.
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Unset: the app runs in demo mode, saving to this browser only (see store.ts).
export const supabase: SupabaseClient | null =
  url && key && typeof window !== "undefined" ? createClient(url, key) : null;

export const isDemo = !(url && key);
