import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAssetUrl, getThumbUrl } from '@/lib/photoUrl'

export async function GET(_: Request, { params }: { params: { albumId: string } }) {
  const { data, error } = await supabaseAdmin.from('assets')
    // Select '*' so this works whether or not the optional `provider` column
    // exists yet: when absent, photoUrl defaults to cloudflare-images; once
    // migrations/add-provider-column.sql is applied (for GCS albums), '*'
    // picks the column up automatically. Selecting `provider` explicitly would
    // 500 with "column assets.provider does not exist" until the migration runs.
    .select('*')
    .eq('album_id', params.albumId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Parse metadata, add uploader info, and resolve provider-agnostic URLs
  // server-side (so GCS signing has credentials and provider logic lives in one
  // place). The client uses a.url / a.thumbUrl directly.
  const items = await Promise.all((data ?? []).map(async asset => ({
    ...asset,
    url: await getAssetUrl(asset),
    thumbUrl: await getThumbUrl(asset),
    uploader: asset.metadata?.uploaded_by_name || null,
    uploaderEmail: asset.metadata?.uploaded_by_email || null,
    uploadSource: asset.metadata?.upload_source || 'admin_upload',
    isUserUpload: asset.metadata?.upload_source === 'user_upload'
  })))

  return NextResponse.json({ items })
}
