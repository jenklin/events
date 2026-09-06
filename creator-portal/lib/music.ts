/**
 * Music helpers for guest song requests (karaoke playlist).
 *
 * Providers:
 *  - YouTube: URL parsing + oEmbed (no key) and Data API v3 search when
 *    YOUTUBE_API_KEY is set (Secret Manager → runtime env; see deploy.sh).
 *  - Spotify: URL parsing + oEmbed (no key) and Web API search when
 *    SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are set (client-credentials flow).
 *
 * Nothing here needs a database change: requests live on
 * rsvp_responses.music_contribution.songRequests[].
 */

export type SongProvider = 'youtube' | 'spotify' | 'manual';

export interface SongRequest {
  id: string;
  title: string;
  artist?: string;
  provider: SongProvider;
  url?: string;
  externalId?: string; // YouTube videoId / Spotify trackId
  thumbnail?: string;
  requestedAt: string;
}

export interface SongResult {
  title: string;
  artist?: string;
  provider: SongProvider;
  url?: string;
  externalId?: string;
  thumbnail?: string;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const SP_ID = /^[A-Za-z0-9]{22}$/;

/** Recognise a pasted YouTube / Spotify link (or spotify:track: URI). */
export function parseMusicUrl(raw: string): { provider: SongProvider; externalId: string; url: string } | null {
  const s = (raw || '').trim();
  if (!s) return null;

  const sp = s.match(/^spotify:track:([A-Za-z0-9]{22})$/);
  if (sp) return { provider: 'spotify', externalId: sp[1], url: `https://open.spotify.com/track/${sp[1]}` };

  let u: URL;
  try {
    u = new URL(s.startsWith('http') ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\.|^music\./, '');

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    if (YT_ID.test(id)) return { provider: 'youtube', externalId: id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = u.searchParams.get('v');
    const short = u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    const id = v || (short ? short[1] : '');
    if (YT_ID.test(id)) return { provider: 'youtube', externalId: id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (host === 'open.spotify.com' || host === 'spotify.com' || host === 'spotify.link') {
    const m = u.pathname.match(/\/track\/([A-Za-z0-9]{22})/);
    if (m && SP_ID.test(m[1])) return { provider: 'spotify', externalId: m[1], url: `https://open.spotify.com/track/${m[1]}` };
  }
  return null;
}

/** Title / thumbnail for a pasted link — public oEmbed endpoints, no credentials. */
export async function resolveOEmbed(url: string, provider: SongProvider): Promise<SongResult | null> {
  const endpoint =
    provider === 'youtube'
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
      : provider === 'spotify'
        ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
        : null;
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    return {
      provider,
      url,
      title: j.title || '',
      artist: provider === 'youtube' ? j.author_name || undefined : undefined,
      thumbnail: j.thumbnail_url || undefined,
    };
  } catch {
    return null;
  }
}

export function configuredSearchProviders(): SongProvider[] {
  const out: SongProvider[] = [];
  if (process.env.YOUTUBE_API_KEY) out.push('youtube');
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) out.push('spotify');
  return out;
}

export async function searchYouTube(q: string, limit = 6): Promise<SongResult[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: String(limit),
    q,
    key,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.items || [])
    .filter((it: any) => it?.id?.videoId)
    .map((it: any) => ({
      provider: 'youtube' as const,
      externalId: it.id.videoId,
      url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      title: decodeHtml(it.snippet?.title || ''),
      artist: decodeHtml(it.snippet?.channelTitle || ''),
      thumbnail: it.snippet?.thumbnails?.default?.url,
    }));
}

let spotifyToken: { value: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (spotifyToken && spotifyToken.expiresAt > Date.now() + 30_000) return spotifyToken.value;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const j = await res.json();
  spotifyToken = { value: j.access_token, expiresAt: Date.now() + (j.expires_in || 3600) * 1000 };
  return spotifyToken.value;
}

export async function searchSpotify(q: string, limit = 6): Promise<SongResult[]> {
  const token = await getSpotifyToken();
  if (!token) return [];
  const params = new URLSearchParams({ type: 'track', limit: String(limit), q });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.tracks?.items || []).map((t: any) => ({
    provider: 'spotify' as const,
    externalId: t.id,
    url: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
    title: t.name,
    artist: (t.artists || []).map((a: any) => a.name).join(', '),
    thumbnail: t.album?.images?.length ? t.album.images[t.album.images.length - 1].url : undefined,
  }));
}

/** Anonymous "play all" playlist — no account or API needed. */
export function youtubePlayAllUrl(videoIds: string[]): string | null {
  const ids = videoIds.filter((id) => YT_ID.test(id)).slice(0, 50);
  return ids.length ? `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}` : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
