import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getAssetUrl } from '@/lib/photoUrl'

// Always render fresh so newly created event galleries show up immediately.
export const dynamic = 'force-dynamic'

type Album = {
  id: string
  title: string
  description: string | null
  is_private: boolean
  event_id: string | null
  created_at: string
}

/**
 * Gallery index — events.cloudpeers.com/gallery
 * Summarizes every album with its distinct event id + album id, links to /a/<albumId>.
 * Private albums still gate behind magic-link when opened; the index only lists titles.
 */
export default async function GalleryIndex() {
  const { data: albumRows } = await supabaseAdmin
    .from('albums')
    .select('id,title,description,is_private,event_id,created_at')
    .order('created_at', { ascending: false })
  const albums = (albumRows ?? []) as Album[]

  // Resolve linked events (no FK embedding — albums.event_id has no constraint).
  const eventIds = Array.from(new Set(albums.map(a => a.event_id).filter(Boolean))) as string[]
  const eventsById: Record<string, { title: string | null; event_date: string | null }> = {}
  if (eventIds.length) {
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id,title,event_date')
      .in('id', eventIds)
    for (const e of events ?? []) eventsById[e.id] = { title: e.title, event_date: e.event_date }
  }

  // Per-album photo count + a cover (first asset). One pass over assets.
  const { data: assetRows } = await supabaseAdmin
    .from('assets')
    .select('album_id,provider,provider_id,type,created_at')
    .order('created_at', { ascending: true })
  const counts: Record<string, number> = {}
  const firstAsset: Record<string, any> = {}
  for (const a of assetRows ?? []) {
    counts[a.album_id] = (counts[a.album_id] ?? 0) + 1
    if (!firstAsset[a.album_id]) firstAsset[a.album_id] = a
  }
  const coverUrl: Record<string, string> = {}
  await Promise.all(
    Object.entries(firstAsset).map(async ([albumId, a]) => {
      if (a?.type === 'image') {
        try { coverUrl[albumId] = await getAssetUrl(a) } catch {}
      }
    })
  )

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Event Galleries</h1>
        <p className="text-paradigm-muted mt-1">
          Photos from Red Helicopter gatherings. Select an event gallery to view.
        </p>
      </header>

      {albums.length === 0 ? (
        <div className="rounded-2xl bg-paradigm-panel p-10 text-center text-paradigm-muted">
          No galleries yet. Create an event with a photo gallery to see it here.
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map(album => {
            const event = album.event_id ? eventsById[album.event_id] : null
            const count = counts[album.id] ?? 0
            const cover = coverUrl[album.id]
            return (
              <Link
                key={album.id}
                href={`/a/${album.id}`}
                className="group rounded-2xl overflow-hidden bg-paradigm-panel border border-white/5 hover:border-paradigm-purple/50 transition-colors"
              >
                <div className="aspect-[16/10] bg-paradigm-deep-black overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-paradigm-muted text-sm">
                      {count > 0 ? 'Photos' : 'No photos yet'}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-white leading-tight">{album.title}</h2>
                    {album.is_private && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-paradigm-muted">
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-paradigm-muted mt-1">
                    {event?.title ? event.title : album.event_id ? 'Linked event' : 'Standalone gallery'}
                    {' · '}{count} photo{count === 1 ? '' : 's'}
                  </p>
                  <dl className="mt-3 space-y-0.5 text-[11px] font-mono text-paradigm-muted/70">
                    <div className="truncate">album&nbsp;id: {album.id}</div>
                    <div className="truncate">event&nbsp;id: {album.event_id ?? '—'}</div>
                  </dl>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
