/**
 * POST /api/events/[eventId]/rsvp
 * Submit or update an RSVP for an event
 *
 * Supports:
 * - Going/Maybe/Can't Go statuses
 * - Plus-ones
 * - Potluck food items
 * - Music contributions
 * - Custom field responses
 * - Approval workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { accessCookieName, isEmailAllowed, signAccessToken } from '@/lib/eventAccess';
import { z } from 'zod';

// RSVP request schema
const rsvpSchema = z.object({
  guestName: z.string().min(1, 'Name is required'),
  guestEmail: z.string().email('Valid email is required'),
  guestPhone: z.string().optional(),
  status: z.enum(['going', 'maybe', 'not_going'], {
    errorMap: () => ({ message: 'Status must be going, maybe, or not_going' }),
  }),
  plusOnes: z.number().int().min(0).default(0),
  plusOneNames: z.array(z.string()).optional(),

  // Potluck (optional)
  bringingFood: z.boolean().default(false),
  foodItems: z.array(z.object({
    category: z.string(),
    item: z.string(),
    servings: z.number().optional(),
    dietaryInfo: z.string().optional(),
  })).optional(),

  // Music (optional)
  musicContribution: z.object({
    type: z.enum(['song_request', 'custom_song']).optional(),
    songRequests: z.array(z.object({
      title: z.string(),
      artist: z.string(),
    })).optional(),
    customSongPrompt: z.string().optional(),
  }).optional(),

  // Custom responses (optional)
  customResponses: z.record(z.any()).optional(),

  // Notes
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const body = await req.json();

    // Validate request body
    const validatedData = rsvpSchema.parse(body);

    // Get event details
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

    // Check if RSVP is enabled
    if (!event.rsvp_enabled) {
      return NextResponse.json(
        { error: 'RSVP is not enabled for this event' },
        { status: 400 }
      );
    }

    // Check capacity if enabled
    if (event.capacity_enabled && validatedData.status === 'going') {
      const totalGuestsRequested = 1 + (validatedData.plusOnes || 0);
      const currentCount = event.current_guest_count || 0;
      const maxGuests = event.max_guests;

      if (maxGuests && (currentCount + totalGuestsRequested) > maxGuests) {
        // Add to waitlist if enabled
        if (event.enable_waitlist) {
          await supabase.from('event_waitlist').insert({
            event_id: event.id,
            guest_name: validatedData.guestName,
            guest_email: validatedData.guestEmail,
            guest_phone: validatedData.guestPhone,
            plus_ones: validatedData.plusOnes,
            waitlist_position: event.waitlist_count + 1,
          });

          return NextResponse.json({
            success: true,
            waitlisted: true,
            message: 'Event is at capacity. You have been added to the waitlist.',
            waitlistPosition: event.waitlist_count + 1,
          });
        } else {
          return NextResponse.json(
            { error: 'Event is at capacity and waitlist is not enabled' },
            { status: 400 }
          );
        }
      }
    }

    // Check for existing RSVP by email
    const { data: existingRsvp } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('event_id', event.id)
      .eq('guest_email', validatedData.guestEmail)
      .maybeSingle();

    let rsvp;
    let isUpdate = false;

    if (existingRsvp) {
      // Update existing RSVP
      const { data: updatedRsvp, error: updateError } = await supabase
        .from('rsvp_responses')
        .update({
          guest_name: validatedData.guestName,
          guest_phone: validatedData.guestPhone,
          status: validatedData.status,
          plus_ones: validatedData.plusOnes || 0,
          plus_one_names: validatedData.plusOneNames || [],
          bringing_food: validatedData.bringingFood,
          food_items: validatedData.foodItems || [],
          // Song requests live here too (Karaoke Playlist API) — keep them when
          // the RSVP form doesn't send musicContribution.
          music_contribution: validatedData.musicContribution ?? existingRsvp.music_contribution ?? {},
          custom_responses: validatedData.customResponses || {},
          notes: validatedData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRsvp.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      rsvp = updatedRsvp;
      isUpdate = true;

      // Log activity
      await supabase.from('guest_activity_log').insert({
        event_id: event.id,
        rsvp_id: existingRsvp.id,
        guest_email: validatedData.guestEmail,
        activity_type: 'rsvp_updated',
        activity_details: { newStatus: validatedData.status },
      });
    } else {
      // Create new RSVP
      const rsvpData = {
        event_id: event.id,
        guest_name: validatedData.guestName,
        guest_email: validatedData.guestEmail,
        guest_phone: validatedData.guestPhone,
        status: validatedData.status,
        plus_ones: validatedData.plusOnes || 0,
        plus_one_names: validatedData.plusOneNames || [],
        bringing_food: validatedData.bringingFood,
        food_items: validatedData.foodItems || [],
        music_contribution: validatedData.musicContribution || {},
        custom_responses: validatedData.customResponses || {},
        notes: validatedData.notes,
        requires_approval: event.require_approval,
        approval_status: event.require_approval ? 'pending' : 'approved',
        rsvp_source: 'web',
      };

      const { data: newRsvp, error: createError } = await supabase
        .from('rsvp_responses')
        .insert(rsvpData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      rsvp = newRsvp;

      // Log activity
      await supabase.from('guest_activity_log').insert({
        event_id: event.id,
        rsvp_id: newRsvp.id,
        guest_email: validatedData.guestEmail,
        activity_type: 'rsvp_submitted',
        activity_details: { status: validatedData.status },
      });
    }

    // Update event guest count (if status is 'going')
    if (validatedData.status === 'going') {
      const { data: goingGuests } = await supabase
        .from('rsvp_responses')
        .select('plus_ones')
        .eq('event_id', event.id)
        .eq('status', 'going')
        .eq('approval_status', 'approved');

      const totalGuests = goingGuests?.reduce(
        (sum, g) => sum + 1 + (g.plus_ones || 0),
        0
      ) || 0;

      await supabase
        .from('events')
        .update({ current_guest_count: totalGuests })
        .eq('id', event.id);
    }

    // Prepare response
    const response: any = {
      success: true,
      rsvpId: rsvp.id,
      status: rsvp.status,
      message: isUpdate
        ? 'RSVP updated successfully!'
        : 'RSVP submitted successfully!',
    };

    // Add approval info if needed
    if (event.require_approval && rsvp.approval_status === 'pending') {
      response.requiresApproval = true;
      response.approvalMessage =
        'Your RSVP requires host approval. You will receive an email when approved.';
    }

    // Add confirmation details
    response.confirmation = {
      eventTitle: event.title,
      eventDate: event.event_date,
      guestName: validatedData.guestName,
      guestEmail: validatedData.guestEmail,
      status: validatedData.status,
      plusOnes: validatedData.plusOnes,
    };

    // Queue confirmation email (if enabled)
    if (event.send_confirmation_email) {
      await supabase.from('reminder_queue').insert({
        event_id: event.id,
        rsvp_id: rsvp.id,
        reminder_type: 'rsvp_confirmation',
        recipient_email: validatedData.guestEmail,
        send_at: new Date().toISOString(),
        status: 'pending',
      });
    }

    const jsonResponse = NextResponse.json(response);

    // Private events: RSVPing registers the guest. Guests who entered via the
    // shared password self-register here — their email is appended to the
    // allowlist so they can sign in by email next time, and this device's
    // access cookie is upgraded from the password marker to their identity.
    if (event.config?.access?.required === true) {
      const guestEmail = validatedData.guestEmail.trim().toLowerCase();
      if (!isEmailAllowed(guestEmail, event)) {
        const access = event.config.access || {};
        const allowedEmails = Array.isArray(access.allowedEmails) ? access.allowedEmails : [];
        await supabase
          .from('events')
          .update({
            config: {
              ...event.config,
              access: { ...access, allowedEmails: [...allowedEmails, guestEmail] },
            },
          })
          .eq('id', event.id);
      }
      jsonResponse.cookies.set(
        accessCookieName(event.event_id),
        signAccessToken(guestEmail, event.event_id),
        { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180 }
      );
    }

    return jsonResponse;
  } catch (error: any) {
    console.error('Error processing RSVP:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/[eventId]/rsvp?email=guest@example.com
 * Get RSVP status for a specific guest by email
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const { searchParams } = new URL(req.url);
    const guestEmail = searchParams.get('email');

    if (!guestEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, title')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get RSVP
    const { data: rsvp } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('event_id', event.id)
      .eq('guest_email', guestEmail)
      .maybeSingle();

    if (!rsvp) {
      return NextResponse.json({
        hasRsvp: false,
        message: 'No RSVP found for this email',
      });
    }

    return NextResponse.json({
      hasRsvp: true,
      rsvp: {
        id: rsvp.id,
        status: rsvp.status,
        guestName: rsvp.guest_name,
        guestPhone: rsvp.guest_phone,
        plusOnes: rsvp.plus_ones,
        plusOneNames: rsvp.plus_one_names,
        bringingFood: rsvp.bringing_food,
        foodItems: rsvp.food_items,
        musicContribution: rsvp.music_contribution,
        customResponses: rsvp.custom_responses,
        requiresApproval: rsvp.requires_approval,
        approvalStatus: rsvp.approval_status,
        checkedIn: rsvp.checked_in,
        rsvpDate: rsvp.created_at,
        updatedAt: rsvp.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
