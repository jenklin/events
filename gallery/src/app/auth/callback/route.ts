import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://events.cloudpeers.com/gallery'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const albumId = searchParams.get('albumId') || 'ffd8e9fc-cea4-4c8c-9918-9af167a7304d'

  console.log('Callback - code:', code?.substring(0, 10) + '...', 'albumId:', albumId)

  if (!code) {
    console.error('Missing code parameter')
    return NextResponse.redirect(`${APP_URL}/login?error=missing_code`)
  }

  const cookieStore = cookies()

  // Create Supabase client with SSR support for proper PKCE handling
  const supabase = createServerClient(
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

  try {
    // Exchange code for session - Supabase automatically manages session cookies
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !user) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${APP_URL}/login?error=invalid_code`)
    }

    console.log('Authenticated user:', user.email)

    // Supabase has automatically set session cookies
    // Just redirect to the album page
    return NextResponse.redirect(`${APP_URL}/a/${albumId}`)

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${APP_URL}/login?error=callback_failed`)
  }
}
