/**
 * GET /api/events/[eventId]/songs/search?q=
 * Pasted YouTube/Spotify link → one resolved result (no credentials needed).
 * Free text → YouTube Data API and/or Spotify search, whichever is configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { configuredSearchProviders, parseMusicUrl, resolveOEmbed, searchSpotify, searchYouTube } from '@/lib/music';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ results: [], providers: configuredSearchProviders() });

    const { data: event } = await getSupabaseAdmin()
      .from('events')
      .select('id, enable_music_contributions')
      .eq('event_id', params.eventId)
      .single();
    if (!event?.enable_music_contributions) {
      return NextResponse.json({ error: 'Song requests are not enabled for this event' }, { status: 400 });
    }

    const parsed = parseMusicUrl(q);
    if (parsed) {
      const meta = await resolveOEmbed(parsed.url, parsed.provider);
      return NextResponse.json({
        results: [{ ...parsed, title: meta?.title || '', artist: meta?.artist, thumbnail: meta?.thumbnail }],
        providers: configuredSearchProviders(),
        fromUrl: true,
      });
    }

    const providers = configuredSearchProviders();
    const [yt, sp] = await Promise.all([
      providers.includes('youtube') ? searchYouTube(q) : Promise.resolve([]),
      providers.includes('spotify') ? searchSpotify(q) : Promise.resolve([]),
    ]);
    return NextResponse.json({ results: [...yt, ...sp], providers, fromUrl: false });
  } catch (error: any) {
    console.error('Song search error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
