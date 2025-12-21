import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireViewer } from '@/lib/authz'

export async function GET(_: Request, { params }: { params: { assetId: string } }) {
  const { data: asset } = await supabaseAdmin.from('assets').select('album_id').eq('id', params.assetId).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  // Allow reading comments without authentication (anyone who can view the album can read comments)
  const { data, error } = await supabaseAdmin.from('comments')
    .select('id,body,author_name,created_at,parent_id,markers,mentions')
    .eq('asset_id', params.assetId).order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: Request, { params }: { params: { assetId: string } }) {
  const body = await req.json()
  if (!body?.body) return NextResponse.json({ error: 'Body required' }, { status: 400 })
  const { data: asset } = await supabaseAdmin.from('assets').select('album_id').eq('id', params.assetId).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  const claims = await requireViewer(asset.album_id)
  if (!claims.allowComments) return NextResponse.json({ error: 'Comments disabled' }, { status: 403 })
  const mentions = Array.isArray(body.mentions) ? body.mentions : []
  const { error } = await supabaseAdmin.from('comments').insert({
    asset_id: params.assetId, body: body.body, author_name: body.author_name || 'Guest',
    parent_id: body.parent_id || null, markers: body.markers || null, mentions
  } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
