/**
 * GET /api/events/[eventId]/stats
 * Get RSVP statistics for an event
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

    // Get event summary from view
    const { data: summary, error } = await supabase
      .from('event_summary')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !summary) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Return stats
    return NextResponse.json({
      eventId: summary.event_id,
      title: summary.title,
      eventDate: summary.event_date,
      eventUrl: summary.event_url,
      qrCodeUrl: summary.qr_code_url,
      galleryUrl: summary.gallery_url,
      rsvpStats: {
        total: summary.going_count + summary.maybe_count + summary.cant_go_count,
        going: summary.going_count,
        maybe: summary.maybe_count,
        cantGo: summary.cant_go_count,
        pending: summary.pending_count,
      },
      capacity: {
        enabled: summary.max_guests !== null,
        maxGuests: summary.max_guests,
        currentCount: summary.current_guest_count,
        spotsLeft: summary.max_guests
          ? summary.max_guests - summary.current_guest_count
          : null,
        waitlistCount: summary.waitlist_count,
      },
      views: summary.total_views,
      createdAt: summary.created_at,
    });
  } catch (error: any) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
