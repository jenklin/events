import { NextResponse } from 'next/server'
import { cfImagesCreateDirectUpload, cfStreamCreateDirectUpload } from '@/lib/cf'
import { requireEditor } from '@/lib/authz'
export async function POST(req: Request, { params }: { params: { albumId: string } }) {
  try { await requireEditor(params.albumId) } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { type, filename } = await req.json()
  if (!type || !filename) return NextResponse.json({ error: 'type and filename required' }, { status: 400 })
  if (type === 'image') {
    const res = await cfImagesCreateDirectUpload(filename)
    return NextResponse.json({ provider: 'cloudflare-images', upload_url: res.uploadURL, provider_id: res.id })
  } else if (type === 'video') {
    const res = await cfStreamCreateDirectUpload()
    return NextResponse.json({ provider: 'cloudflare-stream', upload_url: res.uploadURL, provider_id: res.uid })
  }
  return NextResponse.json({ error: 'invalid type' }, { status: 400 })
}
