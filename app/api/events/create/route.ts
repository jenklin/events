/**
 * POST /api/events/create
 * Creates a new event and returns event URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { eventFormSchema, getEventUrl } from '@/lib/eventSchema';

// Initialize Supabase (server-side with service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validatedData = eventFormSchema.parse(body);

    // Check subdomain availability if custom subdomain is enabled
    if (validatedData.urlBranding.customSubdomain?.enabled) {
      const subdomain = validatedData.urlBranding.customSubdomain.subdomain;
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('custom_subdomain', subdomain)
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json(
          { error: `Subdomain "${subdomain}" is already taken` },
          { status: 400 }
        );
      }
    }

    // Check URL slug availability
    const { data: existingSlug } = await supabase
      .from('events')
      .select('id')
      .eq('event_id', validatedData.urlBranding.customSlug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: `URL slug "${validatedData.urlBranding.customSlug}" is already taken` },
        { status: 400 }
      );
    }

    // Create event in database
    const eventData = {
      // Basic info
      event_id: validatedData.urlBranding.customSlug,
      title: validatedData.eventBasics.title,
      description: validatedData.eventBasics.description,

      // Custom subdomain
      custom_subdomain: validatedData.urlBranding.customSubdomain?.enabled
        ? validatedData.urlBranding.customSubdomain.subdomain
        : null,
      subdomain_provider: validatedData.urlBranding.customSubdomain?.enabled
        ? validatedData.urlBranding.customSubdomain.provider
        : null,

      // Cover image
      cover_image_type: validatedData.eventBasics.coverImage.type,
      cover_image_theme: validatedData.eventBasics.coverImage.theme,
      cover_image_url: validatedData.eventBasics.coverImage.customUrl,

      // Host
      host_name: validatedData.host.name,
      host_email: validatedData.host.email,

      // Date & Location
      event_date: validatedData.dateLocation.date,
      start_time: validatedData.dateLocation.startTime,
      end_time: validatedData.dateLocation.endTime,
      timezone: validatedData.dateLocation.timezone,
      location_name: validatedData.dateLocation.venueName,
      location_address: validatedData.dateLocation.address,
      location_description: validatedData.dateLocation.description,
      nearest_station: validatedData.dateLocation.nearestStation,
      hide_location_until_rsvp: validatedData.dateLocation.hideLocationUntilRsvp,

      // Capacity
      capacity_enabled: validatedData.guestSettings.capacity.enabled,
      max_guests: validatedData.guestSettings.capacity.maxGuests,
      enable_waitlist: validatedData.guestSettings.capacity.enableWaitlist,

      // Guest settings
      allow_plus_ones: validatedData.guestSettings.plusOnes.allowed,
      max_plus_ones: validatedData.guestSettings.plusOnes.maxPerGuest,
      require_approval: validatedData.guestSettings.approval.requireApproval,
      allow_mutual_invites: validatedData.guestSettings.approval.allowMutualInvites,
      collect_guest_photos: validatedData.guestSettings.approval.allowGuestPhotos,

      // Potluck
      is_potluck: validatedData.potluck?.enabled || false,
      potluck_categories: validatedData.potluck?.categories,
      potluck_needs: [],

      // Music
      enable_music_contributions: validatedData.music?.enabled || false,
      music_contribution_type: validatedData.music?.type,
      custom_song_service: validatedData.music?.service,
      music_instructions: validatedData.music?.instructions,
      max_song_requests: validatedData.music?.maxSongsPerGuest,

      // Visibility
      is_public: validatedData.visibility.isPublic,
      show_guest_names: validatedData.visibility.guestList.showGuestNames,
      show_guest_count: validatedData.visibility.guestList.showGuestCount,
      show_guest_photos: validatedData.visibility.guestList.showGuestPhotos,
      show_activity_timestamps: validatedData.visibility.guestList.showActivityTimestamps,
      password_hash: validatedData.visibility.password
        ? await hashPassword(validatedData.visibility.password)
        : null,

      // Cost
      has_cost: validatedData.additional.cost.hasCost,
      cost_amount: validatedData.additional.cost.amount,
      cost_description: validatedData.additional.cost.description,

      // Branding (store as JSONB)
      branding: validatedData.urlBranding.branding || {},

      // Full config (store complete form data)
      config: validatedData,

      // RSVP enabled
      rsvp_enabled: true,
      send_confirmation_email: true,
      send_reminder_emails: true,
    };

    const { data: event, error: createError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (createError) {
      console.error('Database error:', createError);
      return NextResponse.json(
        { error: 'Failed to create event', details: createError.message },
        { status: 500 }
      );
    }

    // Generate event URLs
    const eventUrl = getEventUrl(
      validatedData.urlBranding.customSlug,
      validatedData.urlBranding.customSubdomain
    );
    const qrCodeUrl = `${eventUrl}/qr.png`;
    const galleryUrl = validatedData.additional.enablePhotoGallery
      ? `${eventUrl}/gallery`
      : null;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Create gallery album if enabled
    let galleryAlbumId = null;
    if (validatedData.additional.enablePhotoGallery) {
      const { data: album } = await supabase
        .from('gallery_albums')
        .insert({
          event_id: event.id,
          album_name: `${validatedData.eventBasics.title} - Photos`,
          album_description: 'Event photo gallery',
          branding: validatedData.urlBranding.branding || {},
          is_public: false,
          download_enabled: true,
        })
        .select()
        .single();

      galleryAlbumId = album?.id;
    }

    // Record metrics
    await supabase.from('event_metrics').insert({
      event_id: event.id,
      metric_date: new Date().toISOString().split('T')[0],
      page_views: 0,
      unique_visitors: 0,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventSlug: validatedData.urlBranding.customSlug,
      eventUrl,
      qrCodeUrl,
      qrCodeDataUrl, // Base64 data URL for immediate display
      galleryUrl,
      galleryAlbumId,
      dashboardUrl: `https://events.cloudpeers.com/dashboard/${event.id}`,
      message: 'Event created successfully!',
    });
  } catch (error: any) {
    console.error('Error creating event:', error);

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

// Helper function to hash passwords (simple example, use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
