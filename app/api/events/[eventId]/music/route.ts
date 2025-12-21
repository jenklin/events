/**
 * GET /api/events/[eventId]/music
 * Get music playlist (song requests and AI-generated songs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, title, enable_music_contributions')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.enable_music_contributions) {
      return NextResponse.json(
        { error: 'This event does not have music contributions enabled' },
        { status: 400 }
      );
    }

    // Get playlist from view
    const { data: playlist, error } = await supabase
      .from('event_playlist')
      .select('*')
      .eq('event_id', eventId)
      .order('submitted_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Separate by type
    const songRequests = playlist.filter(
      (item) => item.contribution_type === 'song_request'
    );
    const customSongs = playlist.filter(
      (item) => item.contribution_type === 'custom_song'
    );

    return NextResponse.json({
      eventId: event.event_id,
      eventTitle: event.title,
      totalSongs: playlist.length,
      songRequests: songRequests.map((item) => ({
        guest: item.guest_name,
        song: item.song_request,
        artist: item.artist,
        notes: item.notes,
        submittedAt: item.submitted_at,
      })),
      customSongs: customSongs.map((item) => ({
        guest: item.guest_name,
        prompt: item.custom_prompt,
        generatedUrl: item.generated_url,
        played: item.played,
        submittedAt: item.submitted_at,
      })),
      allPlaylist: playlist,
    });
  } catch (error: any) {
    console.error('Error fetching music playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
