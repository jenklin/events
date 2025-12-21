'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function AdminPage() {
  const supa = supabaseClient()
  const [session, setSession] = useState<any>(null)
  const [albums, setAlbums] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')

  useEffect(() => {
    supa.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const authHeader = async () => {
    const { data } = await supa.auth.getSession()
    const token = data.session?.access_token
    return (token ? { 'Authorization': 'Bearer ' + token } : {}) as Record<string, string>
  }

  const load = async () => {
    const res = await fetch('/api/albums', { headers: await authHeader() })
    const j = await res.json()
    if (res.ok) setAlbums(j.items); else alert(j.error || 'error')
  }

  const createAlbum = async () => {
    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ title, owner_email: owner })
    })
    const j = await res.json()
    if (res.ok) { alert('Created. Editor invite: ' + j.editor_invite.url); load() }
    else alert(j.error || 'error')
  }

  const toggle = async (albumId: string, field: 'allow_comments'|'allow_downloads', value: boolean) => {
    const a = albums.find(x => x.id === albumId)
    const payload = { albumId, allow_comments: field==='allow_comments' ? value : a.settings?.allow_comments, allow_downloads: field==='allow_downloads' ? value : a.settings?.allow_downloads }
    const res = await fetch('/api/albums', { method: 'PATCH', headers: { 'Content-Type':'application/json', ...(await authHeader()) }, body: JSON.stringify(payload) })
    if (res.ok) load(); else alert('update failed')
  }

  const issueInvite = async (albumId: string, role: 'viewer'|'editor') => {
    const res = await fetch('/api/invites/issue', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ albumId, scope:{ role } }) })
    const j = await res.json()
    if (res.ok) alert(role + ' invite: ' + j.url); else alert(j.error || 'error')
  }

  const signOut = async () => { await supa.auth.signOut() }

  if (!session) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-neutral-600">You must sign in.</p>
        <Link href="/admin/login" className="underline">Go to login</Link>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="text-sm flex items-center gap-3">
          <span>{session?.user?.email}</span>
          <button onClick={signOut} className="rounded bg-neutral-800 text-white px-2 py-1 text-xs">Sign out</button>
        </div>
      </div>

      <section className="space-y-2">
        <button onClick={load} className="rounded bg-black text-white px-3 py-1 text-sm">Load Albums</button>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Create Album</h2>
        <div className="flex gap-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="border rounded px-2 py-1 text-sm" />
          <input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Owner email (optional)" className="border rounded px-2 py-1 text-sm" />
          <button onClick={createAlbum} className="rounded bg-brand-accent text-white px-3 py-1 text-sm">Create</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Albums</h2>
        <div className="grid gap-3">
          {albums.map(a => (
            <div key={a.id} className="rounded-xl border p-3 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-neutral-500">{a.id}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/a/${a.id}`} className="rounded bg-blue-600 text-white px-3 py-1 text-xs font-medium hover:bg-blue-700">View Album</Link>
                  <Link href={`/a/${a.id}/upload`} className="rounded bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700">Upload</Link>
                  <button onClick={()=>issueInvite(a.id, 'viewer')} className="rounded bg-neutral-800 text-white px-2 py-1 text-xs">Viewer Invite</button>
                  <button onClick={()=>issueInvite(a.id, 'editor')} className="rounded bg-neutral-800 text-white px-2 py-1 text-xs">Editor Invite</button>
                </div>
              </div>
              <div className="mt-2 flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!a.settings?.allow_comments} onChange={e=>toggle(a.id,'allow_comments', e.target.checked)} />
                  Allow comments
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!a.settings?.allow_downloads} onChange={e=>toggle(a.id,'allow_downloads', e.target.checked)} />
                  Allow downloads (viewer)
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
