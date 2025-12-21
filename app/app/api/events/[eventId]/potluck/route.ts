/**
 * GET /api/events/[eventId]/potluck
 * Get potluck summary organized by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, title, is_potluck')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.is_potluck) {
      return NextResponse.json(
        { error: 'This event does not have potluck enabled' },
        { status: 400 }
      );
    }

    // Get potluck contributions from view
    const { data: contributions, error } = await supabase
      .from('potluck_contributions')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      throw error;
    }

    // Get summary by category
    const { data: summary } = await supabase
      .from('potluck_summary')
      .select('*')
      .eq('event_id', eventId);

    return NextResponse.json({
      eventId: event.event_id,
      eventTitle: event.title,
      totalItems: contributions.length,
      categories: summary || [],
      allContributions: contributions,
    });
  } catch (error: any) {
    console.error('Error fetching potluck data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
