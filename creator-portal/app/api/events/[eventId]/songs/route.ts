/**
 * Guest song requests → one shared playlist per event (Karaoke Playlist).
 *
 *   GET    /api/events/[eventId]/songs            playlist; `mine` flagged for the signed-in guest
 *   POST   /api/events/[eventId]/songs            { url? | title, artist?, name?, email? }
 *   DELETE /api/events/[eventId]/songs            { songId }  — own requests only
 *
 * Storage: public.event_song_requests (database/migrations/2026-09-08-event-song-requests.sql).
 *
 * Identity: the event's access cookie (HMAC-signed by the server, see
 * lib/eventAccess.ts). Ownership checks use ONLY the cookie's email — never an
 * email from the request body. A guest without an identity yet (shared-password
 * entry on a private event, or an open event) supplies name + email once; the
 * server registers them (allowlist on private events) and sets the signed
 * cookie, exactly as RSVP self-registration does.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ACCESS_COOKIE_OPTIONS,
  accessCookieName,
  isEmailAllowed,
  isPasswordGuest,
  readVerifiedGuestEmail,
  signAccessToken,
} from '@/lib/eventAccess';
import {
  configuredSearchProviders,
  parseMusicUrl,
  resolveOEmbed,
  youtubePlayAllUrl,
} from '@/lib/music';

export const dynamic = 'force-dynamic';

const TABLE = 'event_song_requests';

const addSchema = z.object({
  url: z.string().max(500).optional(),
  title: z.string().max(200).optional(),
  artist: z.string().max(200).optional(),
  name: z.string().max(120).optional(),
  email: z.string().email().max(254).optional(),
});

const removeSchema = z.object({
  songId: z.union([z.string().min(1), z.number().int()]),
});

const isMissingTable = (err: any) =>
  err && (err.code === 'PGRST205' || err.code === '42P01' || /event_song_requests/.test(err.message || ''));

async function loadEvent(supabase: any, eventId: string) {
  const { data } = await supabase
    .from('events')
    .select('id, event_id, title, host_email, config, enable_music_contributions, max_song_requests, music_instructions')
    .eq('event_id', eventId)
    .single();
  return data;
}

function guard(event: any) {
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!event.enable_music_contributions) {
    return NextResponse.json({ error: 'Song requests are not enabled for this event' }, { status: 400 });
  }
  return null;
}

/** Best-known display name for an identified guest (last request, else their RSVP). */
async function knownGuestName(supabase: any, event: any, email: string): Promise<string | null> {
  const { data: last } = await supabase
    .from(TABLE)
    .select('guest_name')
    .eq('event_id', event.id)
    .eq('guest_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last?.guest_name) return last.guest_name;
  const { data: rsvp } = await supabase
    .from('rsvp_responses')
    .select('guest_name')
    .eq('event_id', event.id)
    .ilike('guest_email', email)
    .limit(1)
    .maybeSingle();
  return rsvp?.guest_name || null;
}

async function buildPlaylist(supabase: any, event: any, me: string | null) {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('id, guest_email, guest_name, title, artist, provider, url, external_id, thumbnail_url, status, created_at')
    .eq('event_id', event.id)
    .neq('status', 'skipped')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const songs = (rows || []).map((r: any) => ({
    id: String(r.id),
    title: r.title,
    artist: r.artist,
    provider: r.provider,
    url: r.url,
    thumbnail: r.thumbnail_url,
    status: r.status,
    requestedBy: (r.guest_name || '').trim().split(/\s+/)[0] || 'A guest',
    requestedAt: r.created_at,
    mine: !!me && r.guest_email === me,
  }));
  const ytIds = (rows || []).filter((r: any) => r.provider === 'youtube' && r.external_id).map((r: any) => r.external_id);

  return {
    ready: true,
    eventId: event.event_id,
    total: songs.length,
    maxPerGuest: event.max_song_requests || 1,
    instructions: event.music_instructions || null,
    searchProviders: configuredSearchProviders(),
    youtubePlayAllUrl: youtubePlayAllUrl(ytIds),
    guest: me ? { email: me, name: await knownGuestName(supabase, event, me) } : null,
    songs,
  };
}

const notReady = (event: any) =>
  NextResponse.json({
    ready: false,
    eventId: event.event_id,
    total: 0,
    maxPerGuest: event.max_song_requests || 1,
    instructions: event.music_instructions || null,
    searchProviders: [],
    youtubePlayAllUrl: null,
    guest: null,
    songs: [],
  });

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;
    const me = readVerifiedGuestEmail(req.cookies.get(accessCookieName(event.event_id))?.value, event.event_id);
    try {
      return NextResponse.json(await buildPlaylist(supabase, event, me));
    } catch (err: any) {
      if (isMissingTable(err)) return notReady(event);
      throw err;
    }
  } catch (error: any) {
    console.error('Error loading playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;

    const body = addSchema.parse(await req.json());
    const cookieValue = req.cookies.get(accessCookieName(event.event_id))?.value;
    const gated = event.config?.access?.required === true;

    // ---- Identity -------------------------------------------------------
    let email = readVerifiedGuestEmail(cookieValue, event.event_id);
    let name = (body.name || '').trim();
    let issueCookie = false;
    let registerOnAllowlist = false;

    if (!email) {
      // Not identified yet. On a private event the guest must at least have
      // passed the password gate; then name + email register them (same
      // contract as RSVP self-registration). Open events: name + email once.
      if (gated && !isPasswordGuest(cookieValue, event.event_id)) {
        return NextResponse.json(
          { error: 'sign_in_required', message: 'Please sign in to this event first.' },
          { status: 401 }
        );
      }
      if (!body.email || !name) {
        return NextResponse.json(
          { error: 'identity_required', message: 'Add your name and email so we know whose song this is.' },
          { status: 400 }
        );
      }
      email = body.email.trim().toLowerCase();
      issueCookie = true;
      registerOnAllowlist = gated && !isEmailAllowed(email, event);
    }

    if (!name) name = (await knownGuestName(supabase, event, email)) || '';
    if (!name) {
      return NextResponse.json({ error: 'name_required', message: 'Please add your name.' }, { status: 400 });
    }

    // ---- Per-guest cap ----------------------------------------------------
    const max = event.max_song_requests || 1;
    const { count, error: countError } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('guest_email', email)
      .neq('status', 'skipped');
    if (countError) {
      if (isMissingTable(countError)) {
        return NextResponse.json(
          { error: 'not_ready', message: 'Song requests are opening soon — please check back.' },
          { status: 503 }
        );
      }
      throw countError;
    }
    if ((count || 0) >= max) {
      return NextResponse.json(
        { error: 'limit_reached', message: `You can request up to ${max} song${max === 1 ? '' : 's'}. Remove one to add another.` },
        { status: 400 }
      );
    }

    // ---- Resolve the song -------------------------------------------------
    const parsed = body.url ? parseMusicUrl(body.url) : null;
    if (body.url && !parsed) {
      return NextResponse.json(
        { error: 'bad_url', message: 'That link is not a YouTube or Spotify track link.' },
        { status: 400 }
      );
    }
    let row: Record<string, any>;
    if (parsed) {
      const meta = await resolveOEmbed(parsed.url, parsed.provider);
      const title = (body.title || meta?.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title_required', message: 'Please add the song title.' }, { status: 400 });
      }
      row = {
        title,
        artist: (body.artist || meta?.artist || '').trim() || null,
        provider: parsed.provider,
        url: parsed.url,
        external_id: parsed.externalId,
        thumbnail_url: meta?.thumbnail || null,
        source: 'link',
      };
    } else {
      const title = (body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title_required', message: 'Please add the song title.' }, { status: 400 });
      }
      row = { title, artist: (body.artist || '').trim() || null, provider: 'manual', source: 'manual' };
    }

    const { data: inserted, error: insertError } = await supabase
      .from(TABLE)
      .insert({ event_id: event.id, guest_email: email, guest_name: name, ...row })
      .select('id, title')
      .single();
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'duplicate', message: 'You already requested that song.' }, { status: 400 });
      }
      throw insertError;
    }

    // ---- Register identity (first request from an unidentified guest) ----
    if (registerOnAllowlist) {
      const access = event.config?.access || {};
      const allowedEmails = Array.isArray(access.allowedEmails) ? access.allowedEmails : [];
      await supabase
        .from('events')
        .update({ config: { ...event.config, access: { ...access, allowedEmails: [...allowedEmails, email] } } })
        .eq('id', event.id);
    }

    const response = NextResponse.json({
      ok: true,
      song: { id: String(inserted.id), title: inserted.title },
      ...(await buildPlaylist(supabase, event, email)),
    });
    if (issueCookie) {
      response.cookies.set(accessCookieName(event.event_id), signAccessToken(email, event.event_id), ACCESS_COOKIE_OPTIONS);
    }
    return response;
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'invalid', message: 'Please check your name, email and song.' }, { status: 400 });
    }
    console.error('Error adding song request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;

    const me = readVerifiedGuestEmail(req.cookies.get(accessCookieName(event.event_id))?.value, event.event_id);
    if (!me) {
      return NextResponse.json({ error: 'sign_in_required', message: 'Please sign in to manage your songs.' }, { status: 401 });
    }
    const body = removeSchema.parse(await req.json());

    // Ownership is enforced by the WHERE clause on the cookie's email.
    const { data: deleted, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('event_id', event.id)
      .eq('id', Number(body.songId))
      .eq('guest_email', me)
      .select('id');
    if (error) throw error;
    if (!deleted?.length) {
      return NextResponse.json({ error: 'not_found', message: 'That song is not on your list.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...(await buildPlaylist(supabase, event, me)) });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'invalid', message: 'Invalid request.' }, { status: 400 });
    }
    console.error('Error removing song request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
