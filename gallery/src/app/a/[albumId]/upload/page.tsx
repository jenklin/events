'use client'
import { useState } from 'react'
export default function UploadPage({ params }: { params: { albumId: string } }) {
  const [file, setFile] = useState<File|null>(null)
  const [status, setStatus] = useState<string>('')
  const onUpload = async () => {
    if (!file) return
    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'unknown'
    if (type === 'unknown') { setStatus('Unsupported file'); return }
    setStatus('Requesting upload URL...')
    const res = await fetch(`/api/albums/${params.albumId}/upload-url`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type, filename: file.name }) })
    const j = await res.json()
    if (!res.ok) { setStatus('Error: ' + j.error); return }
    setStatus('Uploading to provider...')
    await fetch(j.upload_url, { method: 'POST', body: file })
    setStatus('Confirming asset...')
    const confirm = await fetch(`/api/assets/confirm`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ album_id: params.albumId, provider_id: j.provider_id, type, original_filename: file.name }) })
    if (!confirm.ok) { setStatus('Confirm failed'); return }
    setStatus('Done!')
  }
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Upload to album (editors only)</h1>
      <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button onClick={onUpload} className="rounded bg-black text-white px-3 py-1 text-sm">Upload</button>
      <div className="text-sm text-neutral-600">{status}</div>
    </main>
  )
}
