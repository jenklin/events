import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }

    _supabaseAdmin = createClient(url, key, { auth: { persistSession: false } })
  }
  return _supabaseAdmin
}

// Create client at module level, but gracefully handle build-time absence of keys
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build'

export const supabaseAdmin = createClient(url, key, { auth: { persistSession: false } })
