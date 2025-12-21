import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// User upload confirmation - creates asset record with uploader metadata
export async function POST(req: Request) {
  const cookieStore = cookies()

  // Check if user is authenticated
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
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )

  try {
    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { album_id, provider_id, type, original_filename, width, height } = body || {}

    if (!album_id || !provider_id || !type) {
      return NextResponse.json(
        { error: 'album_id, provider_id, type required' },
        { status: 400 }
      )
    }

    // Create asset record with uploader metadata
    const { data, error } = await supabaseAdmin.from('assets').insert({
      album_id,
      provider_id,
      type,
      original_filename,
      width,
      height,
      captured_at: new Date().toISOString(),
      // Uploader metadata - store in metadata JSON field or separate columns
      metadata: {
        uploaded_by_email: user.email,
        uploaded_by_name: user.user_metadata?.full_name || user.email,
        upload_source: 'user_upload',
        uploaded_at: new Date().toISOString()
      }
    } as any).select('id').single()

    if (error) {
      console.error('Asset creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ asset_id: data.id }, { status: 201 })
  } catch (error) {
    console.error('User upload confirm error:', error)
    return NextResponse.json({ error: 'Failed to confirm upload' }, { status: 500 })
  }
}
