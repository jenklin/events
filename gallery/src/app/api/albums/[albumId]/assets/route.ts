import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
export async function GET(_: Request, { params }: { params: { albumId: string } }) {
  const { data, error } = await supabaseAdmin.from('assets')
    .select('id,type,provider_id,width,height,metadata,created_at')
    .eq('album_id', params.albumId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Parse metadata and add uploader info to each asset
  const items = (data ?? []).map(asset => ({
    ...asset,
    uploader: asset.metadata?.uploaded_by_name || null,
    uploaderEmail: asset.metadata?.uploaded_by_email || null,
    uploadSource: asset.metadata?.upload_source || 'admin_upload',
    isUserUpload: asset.metadata?.upload_source === 'user_upload'
  }))

  return NextResponse.json({ items })
}
