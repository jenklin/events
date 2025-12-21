import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export type InviteClaims = { albumId: string; role: 'viewer'|'editor'; allowComments: boolean; download: boolean; email: string }

// Create Supabase client for server-side session checking
function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors during response construction
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors during response construction
          }
        },
      },
    }
  )
}

export async function getInviteClaims(): Promise<InviteClaims | null> {
  const supabase = createSupabaseClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Return claims based on authenticated user
  // All authenticated users get viewer access with comments enabled
  return {
    albumId: 'ffd8e9fc-cea4-4c8c-9918-9af167a7304d', // Default album
    role: 'viewer',
    allowComments: true,
    download: false,
    email: user.email || ''
  }
}

export async function requireEditor(albumId: string) {
  const claims = await getInviteClaims()
  if (!claims || claims.albumId !== albumId || claims.role !== 'editor') throw new Error('forbidden')
}

export async function requireViewer(albumId: string) {
  const claims = await getInviteClaims()
  if (!claims) throw new Error('forbidden')
  return claims
}
