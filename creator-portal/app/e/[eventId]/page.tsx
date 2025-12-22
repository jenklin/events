/**
 * Public Event Landing Page
 * URL: /e/[eventId] or custom subdomain
 *
 * Features:
 * - Event details display
 * - RSVP form (Going/Maybe/Can't Go)
 * - Plus-ones
 * - Potluck food selection
 * - Music contributions
 * - Capacity tracking
 * - Hidden location (shown after RSVP)
 */

import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import EventPage from './EventPage';

interface PageProps {
  params: {
    eventId: string;
  };
}

// Server component to fetch event data
export default async function PublicEventPage({ params }: PageProps) {
  const { eventId } = params;
  const supabase = getSupabaseAdmin();

  // Fetch event details
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error || !event) {
    notFound();
  }

  // Fetch RSVP summary
  const { data: rsvps } = await supabase
    .from('rsvp_responses')
    .select('status, plus_ones, approval_status')
    .eq('event_id', event.id)
    .eq('approval_status', 'approved');

  const rsvpStats = {
    going: rsvps?.filter((r) => r.status === 'going').length || 0,
    maybe: rsvps?.filter((r) => r.status === 'maybe').length || 0,
    notGoing: rsvps?.filter((r) => r.status === 'not_going').length || 0,
    totalGuests:
      rsvps
        ?.filter((r) => r.status === 'going')
        .reduce((sum, r) => sum + 1 + (r.plus_ones || 0), 0) || 0,
  };

  // Check if at capacity
  const isAtCapacity =
    event.capacity_enabled &&
    event.max_guests &&
    rsvpStats.totalGuests >= event.max_guests;

  // Format event data
  const eventData = {
    id: event.event_id,
    title: event.title,
    description: event.description,

    // Cover
    coverImage: {
      type: event.cover_image_type,
      theme: event.cover_image_theme,
      url: event.cover_image_url,
    },

    // Host
    host: {
      name: event.host_name,
      email: event.host_email,
      photoUrl: event.host_photo_url,
    },

    // Date & Time
    date: event.event_date,
    startTime: event.start_time,
    endTime: event.end_time,
    timezone: event.timezone,

    // Location
    location: {
      name: event.location_name,
      address: event.location_address,
      description: event.location_description,
      nearestStation: event.nearest_station,
      googleMapsLink: event.google_maps_link,
      hideUntilRsvp: event.hide_location_until_rsvp,
      showOnlyApproved: event.show_location_only_approved,
    },

    // Capacity
    capacity: {
      enabled: event.capacity_enabled,
      maxGuests: event.max_guests,
      currentGuests: rsvpStats.totalGuests,
      enableWaitlist: event.enable_waitlist,
      isAtCapacity,
    },

    // Cost
    cost: {
      hasCost: event.has_cost,
      amount: event.cost_amount,
      currency: event.cost_currency,
      perPerson: event.cost_per_person,
      description: event.cost_description,
    },

    // RSVP Settings
    rsvp: {
      enabled: event.rsvp_enabled,
      requireApproval: event.require_approval,
      allowPlusOnes: event.allow_plus_ones,
      maxPlusOnes: event.max_plus_ones,
    },

    // Potluck
    potluck: {
      enabled: event.is_potluck,
      categories: event.potluck_categories,
      needs: event.potluck_needs,
    },

    // Music
    music: {
      enabled: event.enable_music_contributions,
      type: event.music_contribution_type,
      service: event.custom_song_service,
      instructions: event.music_instructions,
      maxSongsPerGuest: event.max_song_requests,
    },

    // Visibility
    visibility: {
      isPublic: event.is_public,
      showGuestNames: event.show_guest_names,
      showGuestCount: event.show_guest_count,
      showGuestPhotos: event.show_guest_photos,
      showActivityTimestamps: event.show_activity_timestamps,
    },

    // Stats
    stats: rsvpStats,
  };

  return <EventPage event={eventData} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { eventId } = params;
  const supabase = getSupabaseAdmin();

  const { data: event } = await supabase
    .from('events')
    .select('title, description, cover_image_url, event_date')
    .eq('event_id', eventId)
    .single();

  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  return {
    title: `${event.title} - CloudPeers Events`,
    description: event.description || `Join us for ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
  };
}
