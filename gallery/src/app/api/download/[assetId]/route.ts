import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireViewer } from '@/lib/authz'
import { getAssetUrl } from '@/lib/photoUrl'

export async function GET(_: Request, { params }: { params: { assetId: string } }) {
  const { data: asset, error } = await supabaseAdmin.from('assets').select('id,album_id,type,provider,provider_id').eq('id', params.assetId).single()
  if (error || !asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const claims = await requireViewer(asset.album_id)
  if (!(claims.download || claims.role === 'editor')) {
    return NextResponse.json({ error: 'Download not permitted' }, { status: 403 })
  }

  // Provider-agnostic: resolves Cloudflare Images, Cloudflare Stream, or a
  // signed GCS URL based on asset.provider (defaults to cloudflare-images).
  let url = await getAssetUrl(asset)

  // For Cloudflare Images add the download hint so the browser saves the file.
  const provider = asset.provider || 'cloudflare-images'
  if (provider === 'cloudflare-images') {
    url += (url.includes('?') ? '&' : '?') + 'download=true'
  }

  return NextResponse.redirect(url)
}
