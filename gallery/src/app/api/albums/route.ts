import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromAuthHeader } from '@/lib/adminAuth'

export async function GET(req: Request) {
  const admin = await requireAdminFromAuthHeader(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('albums').select('id,title,description,settings,created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: Request) {
  const admin = await requireAdminFromAuthHeader(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title, description, owner_email, owner_display_name } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  let theme: any = null
  try { if (process.env.EVENT_THEME_JSON_URL) theme = await fetch(process.env.EVENT_THEME_JSON_URL).then(r => r.json()) } catch {}

  // ensure owner user exists
  let owner_id: string | null = null
  if (owner_email) {
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', owner_email).single()
    if (existing?.id) owner_id = existing.id
    else {
      const { data: created } = await supabaseAdmin.from('users').insert({ email: owner_email, display_name: owner_display_name || null } as any).select('id').single()
      owner_id = created?.id ?? null
    }
  }

  const settings = theme ? { allow_comments: true, allow_downloads: false, theme } : undefined
  const { data: album, error } = await supabaseAdmin.from('albums').insert({
    owner_id, title, description, ...(settings ? { settings } : {})
  } as any).select('id').single()
  if (error || !album) return NextResponse.json({ error: error?.message || 'create failed' }, { status: 500 })

  const token = (await import('crypto')).randomBytes(16).toString('base64url')
  const scope = { role: 'editor', download: true, comments: true }
  const { error: invErr } = await supabaseAdmin.from('link_tokens').insert({ album_id: album.id, token, scope } as any)
  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  const invite_url = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
  return NextResponse.json({ album_id: album.id, editor_invite: { token, url: invite_url, scope } }, { status: 201 })
}

export async function PATCH(req: Request) {
  const admin = await requireAdminFromAuthHeader(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { albumId, allow_comments, allow_downloads } = await req.json()
  if (!albumId) return NextResponse.json({ error: 'albumId required' }, { status: 400 })
  const { data: current } = await supabaseAdmin.from('albums').select('settings').eq('id', albumId).single()
  const settings = { ...(current?.settings || {}), allow_comments: !!allow_comments, allow_downloads: !!allow_downloads }
  const { error } = await supabaseAdmin.from('albums').update({ settings }).eq('id', albumId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
