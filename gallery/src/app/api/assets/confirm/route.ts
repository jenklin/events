import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireEditor } from '@/lib/authz'
export async function POST(req: Request) {
  const body = await req.json()
  const { album_id, provider_id, type, original_filename, width, height, duration_ms, captured_at } = body || {}
  if (!album_id || !provider_id || !type) return NextResponse.json({ error: 'album_id, provider_id, type required' }, { status: 400 })
  try { await requireEditor(album_id) } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { data, error } = await supabaseAdmin.from('assets').insert({
    album_id, provider_id, type, original_filename, width, height, duration_ms,
    captured_at: captured_at ? new Date(captured_at).toISOString() : null
  } as any).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ asset_id: data.id }, { status: 201 })
}
