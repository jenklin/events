/**
 * Guest song requests → one shared playlist for the event.
 *
 *   GET    /api/events/[eventId]/songs?email=   playlist (mine flagged when email given)
 *   POST   /api/events/[eventId]/songs          { guestEmail, url? | title, artist? }
 *   DELETE /api/events/[eventId]/songs          { guestEmail, songId }
 *
 * Storage: rsvp_responses.music_contribution.songRequests[] — the guest must
 * have an RSVP on file (looked up by email), which is also the identity check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  SongRequest,
  configuredSearchProviders,
  parseMusicUrl,
  resolveOEmbed,
  youtubePlayAllUrl,
} from '@/lib/music';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  guestEmail: z.string().email(),
  url: z.string().max(500).optional(),
  title: z.string().max(200).optional(),
  artist: z.string().max(200).optional(),
});

const removeSchema = z.object({
  guestEmail: z.string().email(),
  songId: z.string().min(1),
});

async function loadEvent(supabase: any, eventId: string) {
  const { data: event } = await supabase
    .from('events')
    .select('id, event_id, title, enable_music_contributions, max_song_requests, music_instructions')
    .eq('event_id', eventId)
    .single();
  return event;
}

async function buildPlaylist(supabase: any, event: any, email?: string | null) {
  const { data: rows, error } = await supabase
    .from('rsvp_responses')
    .select('guest_name, guest_email, music_contribution')
    .eq('event_id', event.id);
  if (error) throw error;

  const me = (email || '').trim().toLowerCase();
  const songs = (rows || [])
    .flatMap((r: any) => {
      const list: SongRequest[] = Array.isArray(r.music_contribution?.songRequests)
        ? r.music_contribution.songRequests
        : [];
      return list
        .filter((s) => s && s.title)
        .map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || null,
          provider: s.provider || 'manual',
          url: s.url || null,
          externalId: s.externalId || null,
          thumbnail: s.thumbnail || null,
          requestedBy: (r.guest_name || '').split(' ')[0] || 'A guest',
          requestedAt: s.requestedAt || null,
          mine: !!me && (r.guest_email || '').toLowerCase() === me,
        }));
    })
    .sort((a: any, b: any) => (a.requestedAt || '').localeCompare(b.requestedAt || ''));

  const ytIds = songs.filter((s: any) => s.provider === 'youtube' && s.externalId).map((s: any) => s.externalId);

  return {
    eventId: event.event_id,
    total: songs.length,
    maxPerGuest: event.max_song_requests || 1,
    instructions: event.music_instructions || null,
    searchProviders: configuredSearchProviders(),
    youtubePlayAllUrl: youtubePlayAllUrl(ytIds),
    songs,
  };
}

function guard(event: any) {
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!event.enable_music_contributions) {
    return NextResponse.json({ error: 'Song requests are not enabled for this event' }, { status: 400 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;
    const email = req.nextUrl.searchParams.get('email');
    return NextResponse.json(await buildPlaylist(supabase, event, email));
  } catch (error: any) {
    console.error('Error loading playlist:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

async function findRsvp(supabase: any, event: any, email: string) {
  const { data } = await supabase
    .from('rsvp_responses')
    .select('id, guest_name, guest_email, music_contribution')
    .eq('event_id', event.id)
    .ilike('guest_email', email.trim())
    .limit(1)
    .maybeSingle();
  return data;
}

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;

    const body = addSchema.parse(await req.json());
    const rsvp = await findRsvp(supabase, event, body.guestEmail);
    if (!rsvp) {
      return NextResponse.json(
        { error: 'rsvp_required', message: 'Please RSVP first with this email, then add your song.' },
        { status: 404 }
      );
    }

    const existing: SongRequest[] = Array.isArray(rsvp.music_contribution?.songRequests)
      ? rsvp.music_contribution.songRequests.filter((s: any) => s && s.title)
      : [];
    const max = event.max_song_requests || 1;
    if (existing.length >= max) {
      return NextResponse.json(
        { error: 'limit_reached', message: `You can request up to ${max} song${max === 1 ? '' : 's'}. Remove one to add another.` },
        { status: 400 }
      );
    }

    // Build the song: pasted link → provider + oEmbed metadata; otherwise manual.
    let song: SongRequest | null = null;
    const parsed = body.url ? parseMusicUrl(body.url) : null;
    if (body.url && !parsed) {
      return NextResponse.json(
        { error: 'bad_url', message: 'That link is not a YouTube or Spotify track link.' },
        { status: 400 }
      );
    }
    if (parsed) {
      const meta = await resolveOEmbed(parsed.url, parsed.provider);
      const title = (body.title || meta?.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title_required', message: 'Please add the song title.' }, { status: 400 });
      }
      song = {
        id: randomUUID(),
        title,
        artist: (body.artist || meta?.artist || '').trim() || undefined,
        provider: parsed.provider,
        url: parsed.url,
        externalId: parsed.externalId,
        thumbnail: meta?.thumbnail,
        requestedAt: new Date().toISOString(),
      };
    } else {
      const title = (body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'title_required', message: 'Please add the song title.' }, { status: 400 });
      }
      song = {
        id: randomUUID(),
        title,
        artist: (body.artist || '').trim() || undefined,
        provider: 'manual',
        requestedAt: new Date().toISOString(),
      };
    }

    const duplicate = existing.find(
      (s) => (song!.externalId && s.externalId === song!.externalId) || s.title.toLowerCase() === song!.title.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: 'duplicate', message: 'You already requested that song.' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('rsvp_responses')
      .update({
        music_contribution: {
          ...(rsvp.music_contribution || {}),
          type: 'song_request',
          songRequests: [...existing, song],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', rsvp.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, song, ...(await buildPlaylist(supabase, event, body.guestEmail)) });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'invalid', message: 'Please enter a valid email address.' }, { status: 400 });
    }
    console.error('Error adding song request:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const event = await loadEvent(supabase, params.eventId);
    const blocked = guard(event);
    if (blocked) return blocked;

    const body = removeSchema.parse(await req.json());
    const rsvp = await findRsvp(supabase, event, body.guestEmail);
    if (!rsvp) return NextResponse.json({ error: 'rsvp_required' }, { status: 404 });

    const existing: SongRequest[] = Array.isArray(rsvp.music_contribution?.songRequests)
      ? rsvp.music_contribution.songRequests
      : [];
    const next = existing.filter((s) => s.id !== body.songId);
    if (next.length === existing.length) {
      return NextResponse.json({ error: 'not_found', message: 'That song is not on your list.' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('rsvp_responses')
      .update({
        music_contribution: { ...(rsvp.music_contribution || {}), songRequests: next },
        updated_at: new Date().toISOString(),
      })
      .eq('id', rsvp.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, ...(await buildPlaylist(supabase, event, body.guestEmail)) });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'invalid', message: 'Invalid request.' }, { status: 400 });
    }
    console.error('Error removing song request:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
