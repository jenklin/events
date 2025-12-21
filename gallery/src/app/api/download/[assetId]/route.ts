import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireViewer } from '@/lib/authz'
import { CF_IMAGES_ACCOUNT_HASH } from '@/lib/cf'

export async function GET(_: Request, { params }: { params: { assetId: string } }) {
  const { data: asset, error } = await supabaseAdmin.from('assets').select('id,album_id,type,provider_id').eq('id', params.assetId).single()
  if (error || !asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const claims = await requireViewer(asset.album_id)
  if (!(claims.download || claims.role === 'editor')) {
    return NextResponse.json({ error: 'Download not permitted' }, { status: 403 })
  }

  if (asset.type === 'image') {
    // deliver original/public variant; for stricter security proxy bytes in production
    const url = `https://imagedelivery.net/${CF_IMAGES_ACCOUNT_HASH}/${asset.provider_id}/public?download=true`
    return NextResponse.redirect(url)
  } else {
    // For Stream, route to HLS; for true "file" download, configure Stream signed MP4 downloads
    const url = `https://videodelivery.net/${asset.provider_id}/manifest/video.m3u8`
    return NextResponse.redirect(url)
  }
}
