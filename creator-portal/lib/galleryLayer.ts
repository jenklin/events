/**
 * The event's gallery as a Tesseract layer partner — Phase 1b of the event-story spec
 * (docs/TESSERACT_EVENT_STORY_SPEC_2026-08-29.md §5d-bis; partner contract
 * SPATIAL_LAYER_PARTNER_SPEC v1.4). Pure selection: given a published event, its album,
 * the album's assets and the requesting person's email, return ONE Layer Contract object
 * whose `media[]` holds only what is theirs to compose, and a `withheld[]` naming everything
 * else with a reason. Bytes stay with the provider; this returns URLs only.
 *
 * Ownership rule (decision 2026-08-23, reaffirmed 2026-08-30): a person composes their OWN
 * uploads; the host composes the host's own uploads. Every other guest's media is withheld
 * `not_owned` — visible in the gallery, absent from the story — until a subject-consent roster
 * exists. No requester (anonymous export) ⇒ nothing is owned ⇒ everything withheld.
 */

export interface GalleryAlbumRow { id: string; event_id: string | null; title?: string | null; is_private?: boolean | null }
export interface GalleryAssetRow {
  id: string;
  album_id: string;
  type?: string | null;              // image | video
  provider?: string | null;          // cloudflare-images (default) | cloudflare-stream | gcs
  provider_id: string;
  captured_at?: string | null;
  created_at?: string | null;
  original_filename?: string | null;
  uploader_email?: string | null;    // guest upload (column form)
  uploader_name?: string | null;
  metadata?: { uploaded_by_email?: string; uploaded_by_name?: string; upload_source?: string } | null;
}
export interface GalleryEventContext {
  rowId: string;
  title: string;
  date?: string;
  venueName: string;
  coordinates: { lat: number; lng: number };
  hostEmail?: string | null;
}
export interface GalleryLayerInput {
  event: GalleryEventContext;
  album: GalleryAlbumRow;
  assets: GalleryAssetRow[];
  /** The exporting person's email, resolved server-side from `owner_ref`; null = anonymous. */
  requesterEmail: string | null;
  /** Cloudflare Images delivery hash (NEXT_PUBLIC_CF_IMAGES_HASH); absent ⇒ image assets are withheld `provider_not_configured`. */
  cfImagesHash?: string | null;
  distanceM?: number;
}

export type WithheldReason = 'not_owned' | 'provider_not_configured' | 'provider_unavailable' | 'unsupported_kind';
export interface WithheldEntry { layer_id: string; kind: string; reason: WithheldReason; attribution?: string }

export interface GalleryLayerResponse {
  has_layer: true;
  layer_id: string;
  entity_type: 'Event';
  content_type: 'experiential';
  sovereignty_class: 'externalizable';
  summary: string;
  coordinate: { lat: number; lng: number };
  anchor: { lat: number; lng: number; source: 'manual'; distance_m?: number };
  time?: { at: string; precision: 'exact' };
  provenance: 'attested';
  attribution: { owner: 'cloudpeers-events'; contributor?: string };
  location_name: string;
  media: Array<{ kind: 'image' | 'video'; url: string; mime: string; role: 'gallery'; provenance: 'attested'; caption?: string; ttl_s?: number }>;
  withheld: WithheldEntry[];
}

const norm = (e: unknown) => (typeof e === 'string' ? e.trim().toLowerCase() : '');

export function uploaderOf(a: GalleryAssetRow): { email: string; name?: string } | null {
  const email = norm(a.uploader_email) || norm(a.metadata?.uploaded_by_email);
  if (!email) return null;
  return { email, name: a.uploader_name ?? a.metadata?.uploaded_by_name ?? undefined };
}

/** Is this asset the requester's own? Guest uploads carry an uploader; host uploads carry none and belong to the host. */
export function isOwn(a: GalleryAssetRow, requesterEmail: string | null, hostEmail?: string | null): boolean {
  const req = norm(requesterEmail);
  if (!req) return false;
  const up = uploaderOf(a);
  if (up) return up.email === req;
  return norm(hostEmail) === req;
}

export function providerUrl(a: GalleryAssetRow, cfImagesHash?: string | null): { ok: true; url: string; mime: string; kind: 'image' | 'video' } | { ok: false; reason: WithheldReason } {
  const provider = a.provider || 'cloudflare-images';
  const kind = a.type === 'video' ? 'video' : a.type === 'image' || !a.type ? 'image' : null;
  if (!kind) return { ok: false, reason: 'unsupported_kind' };
  switch (provider) {
    case 'cloudflare-stream':
      return { ok: true, kind: 'video', url: `https://videodelivery.net/${a.provider_id}/manifest/video.m3u8`, mime: 'application/vnd.apple.mpegurl' };
    case 'cloudflare-images':
      if (!cfImagesHash) return { ok: false, reason: 'provider_not_configured' };
      return { ok: true, kind: 'image', url: `https://imagedelivery.net/${cfImagesHash}/${a.provider_id}/public`, mime: 'image/jpeg' };
    case 'gcs':
    default:
      // The events service holds no GCS signer; the gallery app does. Named, not silent.
      return { ok: false, reason: 'provider_unavailable' };
  }
}

export function selectGalleryLayer(input: GalleryLayerInput): { has_layer: false; reason: string } | GalleryLayerResponse {
  const { event, album, assets, requesterEmail, cfImagesHash } = input;
  if (!assets.length) return { has_layer: false, reason: 'no_assets' };
  const media: GalleryLayerResponse['media'] = [];
  const withheld: WithheldEntry[] = [];
  let contributor: string | undefined;
  for (const a of assets) {
    const kindGuess = a.type === 'video' ? 'video' : 'image';
    if (!isOwn(a, requesterEmail, event.hostEmail)) {
      withheld.push({ layer_id: a.id, kind: kindGuess, reason: 'not_owned', ...(uploaderOf(a)?.name ? { attribution: uploaderOf(a)!.name } : {}) });
      continue;
    }
    const u = providerUrl(a, cfImagesHash);
    if (!u.ok) { withheld.push({ layer_id: a.id, kind: kindGuess, reason: u.reason }); continue; }
    contributor = contributor ?? uploaderOf(a)?.name ?? (norm(event.hostEmail) === norm(requesterEmail) ? 'the host' : undefined);
    media.push({ kind: u.kind, url: u.url, mime: u.mime, role: 'gallery', provenance: 'attested', ...(a.original_filename ? { caption: a.original_filename } : {}) });
  }
  const own = media.length;
  const total = assets.length;
  return {
    has_layer: true,
    layer_id: `gallery:${album.id}`,
    entity_type: 'Event',
    content_type: 'experiential',
    sovereignty_class: 'externalizable',
    summary: `${event.title} — ${own} of ${total} gallery ${total === 1 ? 'item' : 'items'} ${own === 1 ? 'is' : 'are'} yours to compose`.slice(0, 280),
    coordinate: event.coordinates,
    anchor: { ...event.coordinates, source: 'manual', ...(typeof input.distanceM === 'number' ? { distance_m: Math.round(input.distanceM) } : {}) },
    ...(event.date ? { time: { at: event.date, precision: 'exact' as const } } : {}),
    provenance: 'attested',
    attribution: { owner: 'cloudpeers-events', ...(contributor ? { contributor } : {}) },
    location_name: event.venueName || event.title,
    media,
    withheld,
  };
}

export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
