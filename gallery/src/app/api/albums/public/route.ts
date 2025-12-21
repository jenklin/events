import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  // Fetch all non-private albums for public display
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select('id,title,description,created_at,settings')
    .eq('is_private', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get asset counts for each album
  const albumsWithCounts = await Promise.all(
    (data ?? []).map(async (album) => {
      const { count } = await supabaseAdmin
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('album_id', album.id)

      // Get a preview image
      const { data: assets } = await supabaseAdmin
        .from('assets')
        .select('provider_id,type')
        .eq('album_id', album.id)
        .eq('type', 'image')
        .limit(1)

      return {
        ...album,
        asset_count: count || 0,
        preview_image: assets?.[0]?.provider_id || null
      }
    })
  )

  return NextResponse.json({ items: albumsWithCounts })
}
