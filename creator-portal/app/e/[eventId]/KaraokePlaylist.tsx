'use client';

/**
 * Karaoke Playlist — guests request songs (YouTube / Spotify link, in-page
 * search when a provider key is configured, or plain title + artist) and
 * everyone sees the shared playlist for the night.
 *
 * Data: GET/POST/DELETE /api/events/[eventId]/songs. A guest is identified by
 * the email on their RSVP; the access gate prefills it when it knows one.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Song {
  id: string;
  title: string;
  artist: string | null;
  provider: 'youtube' | 'spotify' | 'manual';
  url: string | null;
  thumbnail: string | null;
  requestedBy: string;
  mine: boolean;
}

interface Result {
  title: string;
  artist?: string;
  provider: 'youtube' | 'spotify' | 'manual';
  url?: string;
  thumbnail?: string;
}

interface Playlist {
  total: number;
  maxPerGuest: number;
  instructions: string | null;
  searchProviders: string[];
  youtubePlayAllUrl: string | null;
  songs: Song[];
}

interface Props {
  eventId: string;
  verifiedEmail: string | null;
  instructions: string | null;
  maxPerGuest: number;
}

const inputCls =
  'w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors';

function ProviderBadge({ provider, url }: { provider: Song['provider']; url: string | null }) {
  if (provider === 'manual' || !url) return null;
  const label = provider === 'youtube' ? 'YouTube' : 'Spotify';
  const cls =
    provider === 'youtube'
      ? 'bg-red-600/20 text-red-300 border-red-500/30'
      : 'bg-green-600/20 text-green-300 border-green-500/30';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cls} hover:opacity-80`}
    >
      ▶ {label}
    </a>
  );
}

export default function KaraokePlaylist({ eventId, verifiedEmail, instructions, maxPerGuest }: Props) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [email, setEmail] = useState(verifiedEmail || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async (forEmail?: string) => {
    try {
      const e = (forEmail ?? email).trim();
      const res = await fetch(`/api/events/${eventId}/songs${e ? `?email=${encodeURIComponent(e)}` : ''}`, {
        cache: 'no-store',
      });
      if (res.ok) setPlaylist(await res.json());
    } catch (err) {
      console.error('Playlist load failed', err);
    }
  };

  useEffect(() => {
    load(verifiedEmail || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const canSearch = (playlist?.searchProviders?.length || 0) > 0;
  const mine = playlist?.songs.filter((s) => s.mine) || [];
  const limit = playlist?.maxPerGuest || maxPerGuest || 1;
  const atLimit = !!email && mine.length >= limit;

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/songs/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
      if (data.fromUrl && data.results?.[0] && !data.results[0].title) {
        setMessage({ type: 'error', text: "We couldn't read that link's title — add it below and we'll keep the link." });
        setManualTitle('');
      }
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const add = async (payload: { url?: string; title?: string; artist?: string }) => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Enter the email you used to RSVP so we know whose song this is.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestEmail: email.trim(), ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Could not add that song.' });
        return;
      }
      setPlaylist(data);
      setResults([]);
      setSearched(false);
      setQuery('');
      setManualTitle('');
      setManualArtist('');
      setMessage({ type: 'success', text: `Added “${data.song.title}” to the playlist 🎶` });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong — please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (songId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/songs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestEmail: email.trim(), songId }),
      });
      const data = await res.json();
      if (res.ok) setPlaylist(data);
      else setMessage({ type: 'error', text: data.message || 'Could not remove that song.' });
    } finally {
      setBusy(false);
    }
  };

  const looksLikeUrl = /^(https?:\/\/|spotify:|www\.|youtu\.?be|open\.spotify)/i.test(query.trim());
  const showManual = searched && (results.length === 0 || !canSearch) && !looksLikeUrl;
  const manualValue = manualTitle || (showManual ? query : '');

  return (
    <Card id="songs" className="p-6 mt-6 scroll-mt-24">
      <h2 className="text-2xl font-bold text-white mb-2">🎤 Karaoke Playlist</h2>
      {instructions && <p className="text-paradigm-muted whitespace-pre-line mb-6">{instructions}</p>}

      {/* The night's playlist */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-white">
            Tonight&apos;s playlist{playlist ? ` · ${playlist.total} song${playlist.total === 1 ? '' : 's'}` : ''}
          </h3>
          {playlist?.youtubePlayAllUrl && (
            <a
              href={playlist.youtubePlayAllUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-paradigm-purple-light hover:underline whitespace-nowrap"
            >
              ▶ Play all on YouTube
            </a>
          )}
        </div>
        {!playlist ? (
          <p className="text-sm text-paradigm-muted">Loading…</p>
        ) : playlist.songs.length === 0 ? (
          <p className="text-sm text-paradigm-muted">No songs yet — be the first to add one!</p>
        ) : (
          <ol className="space-y-2">
            {playlist.songs.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-paradigm-deep-black/20">
                <span className="w-6 text-right text-sm text-paradigm-muted shrink-0">{i + 1}.</span>
                {s.thumbnail ? (
                  <img src={s.thumbnail} alt="" className="w-12 h-12 rounded object-cover shrink-0" loading="lazy" />
                ) : (
                  <span className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0 text-lg">🎵</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{s.title}</div>
                  <div className="text-xs text-paradigm-muted truncate">
                    {s.artist ? `${s.artist} · ` : ''}requested by {s.requestedBy}
                    {s.mine ? ' (you)' : ''}
                  </div>
                </div>
                <ProviderBadge provider={s.provider} url={s.url} />
                {s.mine && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={busy}
                    className="text-xs text-paradigm-muted hover:text-paradigm-coral-light px-2 py-1"
                    aria-label={`Remove ${s.title}`}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Request a song */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="font-semibold text-white mb-1">Request a song</h3>
        <p className="text-xs text-paradigm-muted mb-4">
          Up to {limit} per guest. {canSearch ? 'Search by title or artist, or paste' : 'Paste'} a YouTube or Spotify link —
          or just type the song name.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-paradigm-text mb-1">Your RSVP email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => email.includes('@') && load()}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputCls}
            />
          </div>

          {atLimit ? (
            <p className="text-sm text-paradigm-muted">
              You&apos;ve added {mine.length} of {limit}. Remove one above to request a different song.
            </p>
          ) : (
            <>
              <form onSubmit={runSearch} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={canSearch ? 'Song title, artist, or paste a link' : 'Paste a YouTube / Spotify link, or type the song name'}
                  className={inputCls}
                />
                <Button type="submit" disabled={searching || !query.trim()} className="h-auto shrink-0 bg-paradigm-purple hover:opacity-90 text-white">
                  {searching ? '…' : looksLikeUrl ? 'Check link' : canSearch ? 'Search' : 'Next'}
                </Button>
              </form>

              {results.length > 0 && (
                <ul className="space-y-2">
                  {results.map((r, i) => (
                    <li key={`${r.provider}-${r.url || i}`} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 bg-paradigm-deep-black/30">
                      {r.thumbnail ? (
                        <img src={r.thumbnail} alt="" className="w-12 h-12 rounded object-cover shrink-0" loading="lazy" />
                      ) : (
                        <span className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0 text-lg">🎵</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">{r.title || '(untitled)'}</div>
                        <div className="text-xs text-paradigm-muted truncate">
                          {r.artist || ''}{r.artist ? ' · ' : ''}{r.provider === 'youtube' ? 'YouTube' : r.provider === 'spotify' ? 'Spotify' : ''}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => add({ url: r.url, title: r.title || manualTitle || undefined, artist: r.artist })}
                        className="shrink-0 bg-paradigm-purple hover:opacity-90 text-white"
                      >
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {(showManual || (searched && results[0] && !results[0].title)) && (
                <div className="p-3 rounded-lg border border-white/10 bg-paradigm-deep-black/20 space-y-2">
                  <p className="text-xs text-paradigm-muted">
                    {results.length === 0 && canSearch ? 'No matches — ' : ''}Add it by name:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualValue}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Song title"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={manualArtist}
                      onChange={(e) => setManualArtist(e.target.value)}
                      placeholder="Artist (optional)"
                      className={inputCls}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={busy || !manualValue.trim()}
                    onClick={() =>
                      add(
                        results[0] && !results[0].title
                          ? { url: results[0].url, title: manualTitle, artist: manualArtist || undefined }
                          : { title: manualValue, artist: manualArtist || undefined }
                      )
                    }
                    className="bg-paradigm-purple hover:opacity-90 text-white"
                  >
                    Add to playlist
                  </Button>
                </div>
              )}
            </>
          )}

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-paradigm-teal/15 text-paradigm-teal-light border border-paradigm-teal/30'
                  : 'bg-destructive/15 text-paradigm-coral-light border border-destructive/30'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
