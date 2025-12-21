import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'
export async function POST(req: Request) {
  const { albumId, expiresAt, scope } = await req.json()
  if (!albumId) return NextResponse.json({ error: 'albumId required' }, { status: 400 })
  const token = randomBytes(16).toString('base64url')
  const role = scope?.role === 'editor' ? 'editor' : 'viewer'; const sanitizedScope = { role, download: role==='editor' ? (scope?.download !== false) : false, comments: scope?.comments !== false }
  const { error } = await supabaseAdmin.from('link_tokens').insert({ album_id: albumId, token, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null, scope: sanitizedScope } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
  return NextResponse.json({ token, url, scope: sanitizedScope }, { status: 201 })
}
