'use client'
import { useEffect, useState } from 'react'
import { PhotoUpload } from './PhotoUpload'
import { AttendeeList } from './AttendeeList'
import { UserMenu } from './UserMenu'
import { Footer } from './Footer'

type Asset = {
  id: string
  type: 'image'|'video'
  provider_id: string
  width: number|null
  height: number|null
  uploader: string|null
  uploaderEmail: string|null
  uploadSource: string
  isUserUpload: boolean
  created_at: string
}
type Album = { id: string; title: string; description: string|null; settings: any }

export default function AlbumViewer({ albumId }: { albumId: string }) {
  const [album, setAlbum] = useState<Album|null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [selected, setSelected] = useState<Asset|null>(null)
  const [role, setRole] = useState<string>('viewer')
  const [showUpload, setShowUpload] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string|null>(null)
  const [filter, setFilter] = useState<'all'|'official'|'community'|'mine'>('all')
  const [content, setContent] = useState({
    albumSubtitle: 'Memories from our time together',
    backButtonText: 'Back to Event Registration',
    uploadButtonText: 'Add Your Photos',
    memoriesTitle: 'Memories & Moments',
    memoriesPlaceholder: 'Share a memory from this moment... (use @mentions to tag others)',
    memoriesButton: 'Share'
  })

  // Navigation helpers
  const currentIndex = selected ? assets.findIndex(a => a.id === selected.id) : -1
  const goToNext = () => {
    if (currentIndex < assets.length - 1) {
      setSelected(assets[currentIndex + 1])
    }
  }
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelected(assets[currentIndex - 1])
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!selected) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, currentIndex, assets])

  useEffect(() => {
    // Get base path from current URL (includes /gallery prefix)
    const basePath = window.location.pathname.split('/a/')[0] || ''

    // Check if user is authenticated and get their email
    fetch(`${basePath}/api/auth/me`)
      .then(r => {
        if (r.ok) {
          setIsAuthenticated(true)
          return r.json()
        }
        setIsAuthenticated(false)
        return null
      })
      .then(data => {
        if (data?.email) {
          setCurrentUserEmail(data.email)
        }
      })
      .catch(() => setIsAuthenticated(false))

    // Fetch album data and check user role
    fetch(`${basePath}/api/albums/${albumId}`)
      .then(r => r.json())
      .then((d) => {
        setAlbum(d)
        const theme = d?.settings?.theme || {}
        if (theme?.brandColor) document.documentElement.style.setProperty('--brand-color', theme.brandColor)
        if (theme?.accentColor) document.documentElement.style.setProperty('--brand-accent', theme.accentColor)

        // Check role from response metadata
        if (d?.userRole) setRole(d.userRole)
      })
      .catch(err => console.error('Failed to load album:', err))

    // Fetch assets
    fetch(`${basePath}/api/albums/${albumId}/assets`)
      .then(r => r.json())
      .then(d => {
        console.log('Assets loaded:', d.items?.length || 0)
        setAssets(d.items || [])
      })
      .catch(err => {
        console.error('Failed to load assets:', err)
        setAssets([])
      })
  }, [albumId])

  // Fetch editable content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const basePath = typeof window !== 'undefined' ? window.location.pathname.split('/a/')[0] : ''
        const res = await fetch(`${basePath}/api/content?category=gallery`)
        if (res.ok) {
          const data = await res.json()
          if (data.content) {
            setContent({
              albumSubtitle: data.content.gallery_album_subtitle || content.albumSubtitle,
              backButtonText: data.content.gallery_back_button_text || content.backButtonText,
              uploadButtonText: data.content.gallery_upload_button_text || content.uploadButtonText,
              memoriesTitle: data.content.memories_section_title || content.memoriesTitle,
              memoriesPlaceholder: data.content.memories_input_placeholder || content.memoriesPlaceholder,
              memoriesButton: data.content.memories_submit_button || content.memoriesButton
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch content:', err)
        // Use defaults if fetch fails
      }
    }
    fetchContent()
  }, [])

  const refreshAssets = () => {
    const basePath = window.location.pathname.split('/a/')[0] || ''
    fetch(`${basePath}/api/albums/${albumId}/assets`)
      .then(r => r.json())
      .then(d => setAssets(d.items || []))
      .catch(err => console.error('Failed to refresh assets:', err))
  }

  // Filter assets based on current filter
  useEffect(() => {
    let filtered = assets

    switch (filter) {
      case 'official':
        filtered = assets.filter(a => !a.isUserUpload)
        break
      case 'community':
        filtered = assets.filter(a => a.isUserUpload)
        break
      case 'mine':
        filtered = assets.filter(a => a.uploaderEmail === currentUserEmail)
        break
      default: // 'all'
        filtered = assets
    }

    setFilteredAssets(filtered)
  }, [assets, filter, currentUserEmail])

  return (
    <div>
      {/* Back navigation button */}
      <div className="mb-4">
        <a
          href={`${typeof window !== 'undefined' ? window.location.pathname.split('/a/')[0] : ''}/login`}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-paradigm-muted hover:text-white transition-colors rounded-lg hover:bg-paradigm-panel"
          aria-label="Back to event registration"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{content.backButtonText}</span>
        </a>
      </div>

      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-paradigm-muted mb-2">{content.albumSubtitle}</p>
          <h1 className="text-2xl font-semibold">{album?.title ?? 'Album'}</h1>
          {album?.description && <p className="text-paradigm-muted">{album.description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {role === 'editor' && (
            <a
              href={`${window.location.pathname.split('/a/')[0]}/a/${albumId}/upload`}
              className="px-4 py-2 bg-paradigm-accent text-white rounded-lg hover:bg-paradigm-accent-light transition text-sm font-medium"
            >
              Upload Photos
            </a>
          )}
          <UserMenu basePath={typeof window !== 'undefined' ? window.location.pathname.split('/a/')[0] : ''} />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{background: `var(--brand-color)`}}/>
            <div className="h-6 w-6 rounded-full" style={{background: `var(--brand-accent)`}}/>
          </div>
        </div>
      </header>

      {/* Who Was There That Night - Community feature */}
      <AttendeeList eventName="Seoul Red Helicopter Event" />

      {/* Photo Filters */}
      {assets.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-paradigm-purple text-white'
                : 'bg-paradigm-panel text-paradigm-text hover:bg-paradigm-dark'
            }`}
          >
            All Photos ({assets.length})
          </button>
          <button
            onClick={() => setFilter('official')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'official'
                ? 'bg-paradigm-purple text-white'
                : 'bg-paradigm-panel text-paradigm-text hover:bg-paradigm-dark'
            }`}
          >
            Official ({assets.filter(a => !a.isUserUpload).length})
          </button>
          <button
            onClick={() => setFilter('community')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'community'
                ? 'bg-paradigm-purple text-white'
                : 'bg-paradigm-panel text-paradigm-text hover:bg-paradigm-dark'
            }`}
          >
            Community ({assets.filter(a => a.isUserUpload).length})
          </button>
          {currentUserEmail && assets.some(a => a.uploaderEmail === currentUserEmail) && (
            <button
              onClick={() => setFilter('mine')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'mine'
                  ? 'bg-paradigm-purple text-white'
                  : 'bg-paradigm-panel text-paradigm-text hover:bg-paradigm-dark'
              }`}
            >
              My Uploads ({assets.filter(a => a.uploaderEmail === currentUserEmail).length})
            </button>
          )}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAssets.map(a => (
          <button key={a.id} onClick={() => setSelected(a)} className="group relative overflow-hidden rounded-xl bg-paradigm-panel shadow-sm">
            {a.type === 'image' ? (
              <img className="h-48 w-full object-cover transition group-hover:scale-105"
                   src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_IMAGES_HASH}/${a.provider_id}/public`}
                   alt="" />
            ) : (
              <div className="h-48 w-full grid place-items-center text-sm text-paradigm-muted">Video</div>
            )}

            {/* Attribution Badge */}
            {a.uploader && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                <div className="flex items-center gap-2 text-white text-xs">
                  <div className="w-5 h-5 rounded-full bg-paradigm-purple flex items-center justify-center text-xs font-semibold">
                    {a.uploader.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium truncate">
                    {a.isUserUpload ? `by ${a.uploader}` : `${a.uploader}`}
                  </span>
                </div>
              </div>
            )}
          </button>
        ))}
      </section>

      {selected && (
        <div className="fixed inset-0 bg-black/90 grid place-items-center p-4" onClick={() => setSelected(null)}>
          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-paradigm-panel/10 hover:bg-paradigm-panel/20 backdrop-blur-sm flex items-center justify-center text-white transition z-50"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {currentIndex < assets.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-paradigm-panel/10 hover:bg-paradigm-panel/20 backdrop-blur-sm flex items-center justify-center text-white transition z-50"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Photo Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm z-50">
            {currentIndex + 1} of {assets.length}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-paradigm-panel/10 hover:bg-paradigm-panel/20 backdrop-blur-sm flex items-center justify-center text-white transition z-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full max-w-5xl rounded-2xl bg-paradigm-panel p-4" onClick={e => e.stopPropagation()}>
            {selected.type === 'image' ? (
              <img className="w-full h-auto rounded-xl" src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_IMAGES_HASH}/${selected.provider_id}/public`} alt="" />
            ) : (
              <video id="player" className="w-full h-auto rounded-xl" controls src={`${window.location.pathname.split('/a/')[0]}/api/stream/${selected.provider_id}`} />
            )}
            <Comments assetId={selected.id} isVideo={selected.type==='video'} content={{
              memoriesTitle: content.memoriesTitle,
              memoriesPlaceholder: content.memoriesPlaceholder,
              memoriesButton: content.memoriesButton
            }} />
          </div>
        </div>
      )}

      {/* Floating Upload Button - Only show to authenticated users */}
      {isAuthenticated && !showUpload && (
        <button
          onClick={() => setShowUpload(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-paradigm-purple to-paradigm-purple-light text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold z-40"
          aria-label="Upload your photos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{content.uploadButtonText}</span>
        </button>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <PhotoUpload
          albumId={albumId}
          onUploadComplete={refreshAssets}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Footer with version */}
      <Footer />
    </div>
  )
}

function Comments({ assetId, isVideo, content }: {
  assetId: string,
  isVideo: boolean,
  content: {
    memoriesTitle: string,
    memoriesPlaceholder: string,
    memoriesButton: string
  }
}) {
  const [items, setItems] = useState<any[]>([])
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [t, setT] = useState<number|''>('')
  const [replyTo, setReplyTo] = useState<string|undefined>(undefined)

  // Get base path for API calls
  const basePath = typeof window !== 'undefined' ? (window.location.pathname.split('/a/')[0] || '') : ''

  // Auto-populate user name from session
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const res = await fetch(`${basePath}/api/auth/me`)
        if (res.ok) {
          const data = await res.json()
          if (data.name) {
            setName(data.name)
          }
        }
      } catch (err) {
        console.log('Could not fetch user name:', err)
      }
    }
    fetchUserName()
  }, [basePath])

  useEffect(() => { refresh(); subscribe(); return () => unsub(); }, [assetId])
  const refresh = async () => {
    try {
      const d = await fetch(`${basePath}/api/assets/${assetId}/comments`).then(r => r.json())
      setItems(d.items || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
      setItems([])
    }
  }

  const submit = async () => {
    const mentions = Array.from(body.matchAll(/@([A-Za-z0-9_\-]+)/g)).map(m => m[1])
    await fetch(`${basePath}/api/assets/${assetId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, author_name: name || 'Guest', parent_id: replyTo, markers: isVideo && t !== '' ? { t: Number(t) } : undefined, mentions })
    })
    setBody(''); setReplyTo(undefined); await refresh()
  }


  const threaded = nest(items)

  // --- Realtime subscription (Supabase) ---
  let _sub: any = null
  function unsub() {
    try { _sub && _sub.unsubscribe && _sub.unsubscribe() } catch {}
  }
  function subscribe() {
    try {
      // lazy import to keep SSR clean
      const { supabaseBrowser } = require('@/lib/supabaseBrowser')
      const supa = supabaseBrowser()
      _sub = supa
        .channel('comments-' + assetId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `asset_id=eq.${assetId}` }, (_payload: any) => {
          refresh()
        })
        .subscribe()
    } catch (e) { /* noop for dev */ }
  }


  return (
    <div className="mt-4">
      <h3 className="font-medium">{content.memoriesTitle}</h3>
      <div className="space-y-2 my-2">
        {threaded.map((c: any) => (
          <CommentNode key={c.id} c={c} onReply={(id:string)=>setReplyTo(id)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="border rounded px-2 py-1 text-sm"/>
        {isVideo && <input value={t} onChange={e=>setT(e.target.value as any)} placeholder="t (sec)" className="w-24 border rounded px-2 py-1 text-sm" />}
        <input value={body} onChange={e=>setBody(e.target.value)} placeholder={content.memoriesPlaceholder} className="flex-1 border rounded px-2 py-1 text-sm"/>
        <button onClick={submit} className="rounded bg-[var(--brand-accent)] text-white px-3 py-1 text-sm">{content.memoriesButton}</button>
      </div>
      {replyTo && <div className="text-xs text-paradigm-muted mt-1">Replying… <button className="underline" onClick={()=>setReplyTo(undefined)}>cancel</button></div>}
    </div>
  )
}

function nest(items:any[]) {
  const byId: Record<string, any> = {}
  items.forEach(i => byId[i.id] = { ...i, children: [] })
  const roots:any[] = []
  items.forEach(i => {
    if (i.parent_id && byId[i.parent_id]) byId[i.parent_id].children.push(byId[i.id])
    else roots.push(byId[i.id])
  })
  return roots
}

function CommentNode({ c, onReply }: { c:any, onReply:(id:string)=>void }) {
  return (
    <div className="rounded-lg bg-paradigm-deep-black p-2">
      <div className="text-xs text-paradigm-muted flex gap-2 items-center">
        <span>{c.author_name ?? 'User'}</span>
        {c.markers?.t != null && <span>• t={Math.round(c.markers.t)}s</span>}
      </div>
      <div className="whitespace-pre-wrap">{c.body}</div>
      {Array.isArray(c.children) && c.children.length > 0 && (
        <div className="mt-2 space-y-2 pl-3 border-l">
          {c.children.map((ch:any) => <CommentNode key={ch.id} c={ch} onReply={onReply} />)}
        </div>
      )}
      <button onClick={()=>onReply(c.id)} className="mt-1 text-xs underline">Reply</button>
    </div>
  )
}
