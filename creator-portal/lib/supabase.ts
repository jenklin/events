import { createClient } from '@supabase/supabase-js';

// Next patches global fetch and can serve supabase-js REST reads from its Data
// Cache even on force-dynamic routes, freezing event content at the first
// render after a deploy. Opt every Supabase request out explicitly.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

/**
 * Get Supabase admin client with service role key
 * Only call this at request time, not at module load time
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: { fetch: noStoreFetch },
  });
}

/**
 * Get Supabase client with anon key (for client-side or public API routes)
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: noStoreFetch },
  });
}
