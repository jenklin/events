import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get site content by keys or category
// Supports album-specific content with fallback to global defaults
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keys = searchParams.get('keys')?.split(',')  // e.g., ?keys=gallery_login_title,gallery_login_subtitle
  const category = searchParams.get('category')  // e.g., ?category=gallery
  const albumId = searchParams.get('albumId')  // e.g., ?albumId=abc123...

  try {
    let contentMap: Record<string, string> = {}

    // If albumId is provided, fetch album-specific content first
    if (albumId) {
      let albumQuery = supabaseAdmin
        .from('site_content')
        .select('key, value, description')
        .eq('album_id', albumId)

      if (keys) {
        albumQuery = albumQuery.in('key', keys)
      } else if (category) {
        albumQuery = albumQuery.eq('category', category)
      }

      const { data: albumData, error: albumError } = await albumQuery

      if (!albumError && albumData) {
        // Add album-specific content to map
        albumData.forEach(item => {
          contentMap[item.key] = item.value
        })
      }
    }

    // Fetch global defaults for any missing keys
    let globalQuery = supabaseAdmin
      .from('site_content')
      .select('key, value, description')
      .is('album_id', null)  // Only global content

    if (keys) {
      globalQuery = globalQuery.in('key', keys)
    } else if (category) {
      globalQuery = globalQuery.eq('category', category)
    }

    const { data: globalData, error: globalError } = await globalQuery

    if (globalError) {
      console.error('Content query error:', globalError)
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }

    // Add global defaults for keys not found in album-specific content
    globalData?.forEach(item => {
      if (!contentMap[item.key]) {
        contentMap[item.key] = item.value
      }
    })

    return NextResponse.json({ content: contentMap })

  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
