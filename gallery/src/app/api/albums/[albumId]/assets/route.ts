import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAssetUrl, getThumbUrl } from '@/lib/photoUrl'

export async function GET(_: Request, { params }: { params: { albumId: string } }) {
  const { data, error } = await supabaseAdmin.from('assets')
    // `provider` is optional/backward-compatible (defaults to cloudflare-images
    // in photoUrl when null). See migrations/add-provider-column.sql.
    .select('id,type,provider,provider_id,width,height,metadata,created_at')
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
