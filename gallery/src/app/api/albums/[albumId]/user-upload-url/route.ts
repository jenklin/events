import { NextResponse } from 'next/server'
import { cfImagesCreateDirectUpload } from '@/lib/cf'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { noStoreFetch } from '@/lib/supabase'

// User upload endpoint - allows any authenticated user to upload
export async function POST(req: Request, { params }: { params: { albumId: string } }) {
  const cookieStore = cookies()

  // Check if user is authenticated
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: noStoreFetch },
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

    const { type, filename } = await req.json()

    if (!type || !filename) {
      return NextResponse.json({ error: 'type and filename required' }, { status: 400 })
    }

    // Only support images for now (videos can be added later)
    if (type === 'image') {
      const res = await cfImagesCreateDirectUpload(filename)
      return NextResponse.json({
        provider: 'cloudflare-images',
        upload_url: res.uploadURL,
        provider_id: res.id,
        uploader_email: user.email,
        uploader_name: user.user_metadata?.full_name || user.email
      })
    }

    return NextResponse.json({ error: 'Only images are supported for user uploads' }, { status: 400 })
  } catch (error) {
    console.error('User upload URL error:', error)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }
}
