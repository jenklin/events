import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seoul.redheli.com/gallery'

export async function POST(req: Request) {
  const cookieStore = cookies()

  // Create Supabase clients at runtime to ensure correct credentials
  // Using service role key for server-side operations (bypasses RLS policies)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Auth client with SSR support for proper PKCE code verifier handling
  const supabaseAuth = createServerClient(
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
  const { email, albumId } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    // Check email across all three registration sources
    // Using .maybeSingle() instead of .single() to handle 0 results gracefully
    const [seoulReg, betaReg, hoverReg] = await Promise.all([
      // Seoul registrations - uses full_name (Supabase Auth convention)
      supabaseAdmin
        .from('events_registrations')
        .select('email, full_name')
        .eq('email', email.toLowerCase())
        .eq('event_name', 'Seoul Red Helicopter Event')
        .maybeSingle(),

      // Beta/Dragonfly registrations - uses name (schema.org standard)
      supabaseAdmin
        .from('beta_users')
        .select('email, name')
        .eq('email', email.toLowerCase())
        .maybeSingle(),

      // Hover registrations - uses full_name (Supabase Auth convention)
      supabaseAdmin
        .from('hover_users')
        .select('email, full_name')
        .eq('email', email.toLowerCase())
        .maybeSingle()
    ])

    // Debug logging
    console.log('Seoul query:', seoulReg.error ? `Error: ${seoulReg.error.message}` : `Found: ${seoulReg.data}`)
    console.log('Beta query:', betaReg.error ? `Error: ${betaReg.error.message}` : `Found: ${betaReg.data}`)
    console.log('Hover query:', hoverReg.error ? `Error: ${hoverReg.error.message}` : `Found: ${hoverReg.data}`)

    // Check if email found in any source
    const userRecord = seoulReg.data || betaReg.data || hoverReg.data

    if (!userRecord) {
      console.log('No user found in any table for:', email.toLowerCase())
      return NextResponse.json(
        { error: 'Email not found. Please register for the event first.' },
        { status: 404 }
      )
    }

    // Get user name - handle both naming conventions
    // events_registrations uses full_name (Supabase Auth convention)
    // beta_users/hover_users use name (schema.org standard)
    const userName = ('full_name' in userRecord ? userRecord.full_name : userRecord.name) || 'User'

    // Use Supabase Auth to send magic link
    // The redirect URL will be our gallery album page
    const redirectTo = `${APP_URL}/auth/callback?albumId=${albumId || 'ffd8e9fc-cea4-4c8c-9918-9af167a7304d'}`

    try {
      const { error: authError } = await supabaseAuth.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true, // Create user if doesn't exist in auth.users
          data: {
            // Store metadata about which platform they registered from
            albumId: albumId || 'ffd8e9fc-cea4-4c8c-9918-9af167a7304d',
            full_name: userName
          }
        }
      })

      if (authError) {
        console.error('Supabase Auth error:', authError)
        return NextResponse.json(
          { error: 'Failed to send magic link. Please try again.' },
          { status: 500 }
        )
      }

      console.log('Magic link sent via Supabase to:', email)

      return NextResponse.json({
        success: true,
        message: 'Magic link sent to your email'
      })
    } catch (authError) {
      console.error('Magic link error:', authError)
      return NextResponse.json(
        { error: 'Failed to send magic link. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
