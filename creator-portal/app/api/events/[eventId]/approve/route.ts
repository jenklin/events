/**
 * POST /api/events/[eventId]/approve
 * Approve or reject RSVPs that require host approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { APPROVED_OR_FILTER } from '@/lib/rsvpApproval';
import { z } from 'zod';

const approvalSchema = z.object({
  rsvpId: z.string().uuid('Invalid RSVP ID'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be approve or reject' }),
  }),
  hostEmail: z.string().email('Valid host email is required'),
  rejectionReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const body = await req.json();

    // Validate request
    const validatedData = approvalSchema.parse(body);

    // Get event and verify host
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify host
    if (event.host_email !== validatedData.hostEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the event host can approve RSVPs' },
        { status: 403 }
      );
    }

    // Get RSVP
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('id', validatedData.rsvpId)
      .eq('event_id', event.id)
      .single();

    if (rsvpError || !rsvp) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      );
    }

    // Update approval status
    const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('rsvp_responses')
      .update({
        approved_by: validatedData.hostEmail,
        approved_at: new Date().toISOString(),
        // No approval_status column: approved = approved_at set + no decline_reason
        decline_reason: newStatus === 'rejected' ? validatedData.rejectionReason || 'Declined by host' : null,
      })
      .eq('id', validatedData.rsvpId);

    if (updateError) {
      throw updateError;
    }

    // Update guest count if approved
    if (validatedData.action === 'approve' && rsvp.status === 'going') {
      const { data: goingGuests } = await supabase
        .from('rsvp_responses')
        .select('plus_ones')
        .eq('event_id', event.id)
        .eq('status', 'going')
        .or(APPROVED_OR_FILTER);

      const totalGuests = goingGuests?.reduce(
        (sum, g) => sum + 1 + (g.plus_ones || 0),
        0
      ) || 0;

      await supabase
        .from('events')
        .update({ current_guest_count: totalGuests })
        .eq('id', event.id);
    }

    // Log activity
    await supabase.from('guest_activity_log').insert({
      event_id: event.id,
      rsvp_id: rsvp.id,
      guest_email: rsvp.guest_email,
      activity_type: `rsvp_${newStatus}`,
      activity_data: {
        approvedBy: validatedData.hostEmail,
        rejectionReason: validatedData.rejectionReason,
      },
    });

    // Queue notification email
    if (event.send_confirmation_email) {
      await supabase.from('reminder_queue').insert({
        event_id: event.id,
        reminder_type: validatedData.action === 'approve'
          ? 'rsvp_approved'
          : 'rsvp_rejected',
        recipient_email: rsvp.guest_email,
        recipient_name: rsvp.guest_name,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        message_body: validatedData.rejectionReason
          ? `Reason: ${validatedData.rejectionReason}`
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      action: validatedData.action,
      rsvpId: validatedData.rsvpId,
      guestName: rsvp.guest_name,
      message: `RSVP ${validatedData.action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error processing approval:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[eventId]/approve
 * Get list of pending RSVPs requiring approval
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const { searchParams } = new URL(req.url);
    const hostEmail = searchParams.get('hostEmail');

    if (!hostEmail) {
      return NextResponse.json(
        { error: 'Host email is required' },
        { status: 400 }
      );
    }

    // Get event and verify host
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.host_email !== hostEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the event host can view pending approvals' },
        { status: 403 }
      );
    }

    // Get pending RSVPs
    const { data: pendingRsvps, error } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('event_id', event.id)
      .eq('requires_approval', true)
      .is('approved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      eventId: event.event_id,
      eventTitle: event.title,
      pendingCount: pendingRsvps?.length || 0,
      pendingRsvps: pendingRsvps?.map((rsvp) => ({
        id: rsvp.id,
        guestName: rsvp.guest_name,
        guestEmail: rsvp.guest_email,
        status: rsvp.status,
        plusOnes: rsvp.plus_ones,
        rsvpDate: rsvp.created_at,
        notes: rsvp.notes,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
