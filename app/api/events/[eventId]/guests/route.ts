/**
 * GET /api/events/[eventId]/guests
 * Get guest list with optional status filter
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
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, title')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('rsvp_responses')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: guests, error } = await query;

    if (error) {
      throw error;
    }

    // Format response
    const formattedGuests = guests.map((guest) => ({
      id: guest.id,
      name: guest.guest_name,
      email: guest.guest_email,
      phone: guest.guest_phone,
      status: guest.status,
      plusOnes: guest.plus_ones,
      plusOneNames: guest.plus_one_names,
      rsvpDate: guest.created_at,
      updatedAt: guest.updated_at,

      // Potluck
      bringingFood: guest.bringing_food,
      foodItems: guest.food_items,

      // Music
      musicContribution: guest.music_contribution,

      // Custom responses
      customResponses: guest.custom_responses,

      // Check-in
      checkedIn: guest.checked_in,
      checkedInAt: guest.checked_in_at,

      // Approval
      requiresApproval: guest.requires_approval,
      approvedBy: guest.approved_by,
      approvedAt: guest.approved_at,
    }));

    return NextResponse.json({
      eventId: event.event_id,
      eventTitle: event.title,
      statusFilter,
      guestCount: formattedGuests.length,
      guests: formattedGuests,
    });
  } catch (error: any) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
