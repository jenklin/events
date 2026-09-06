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
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { APPROVED_OR_FILTER } from '@/lib/rsvpApproval';
import { getPublicEventUrl } from '@/lib/eventSchema';
import { accessCookieName, verifyAccessToken } from '@/lib/eventAccess';
import EventPage from './EventPage';
import AccessGate from './AccessGate';

// Event details, RSVP counts, and gallery links must always reflect the live
// database — without this, Next's data cache serves stale event content after
// an organizer edits the event.
export const dynamic = 'force-dynamic';

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

  // Private events (config.access.required): show the sign-in gate unless a
  // valid access cookie for this event is present. Admin pre-populates
  // config.access.allowedEmails; Google sign-in must also resolve to one.
  let verifiedEmail: string | null = null;
  if (event.config?.access?.required === true) {
    const token = cookies().get(accessCookieName(event.event_id))?.value;
    verifiedEmail = token ? verifyAccessToken(token, event.event_id) : null;
    if (!verifiedEmail) {
      return (
        <AccessGate
          eventId={event.event_id}
          title={event.title}
          branding={event.branding || {}}
        />
      );
    }
  }

  // Fetch RSVP summary
  const { data: rsvps } = await supabase
    .from('rsvp_responses')
    .select('status, plus_ones')
    .eq('event_id', event.id)
    .or(APPROVED_OR_FILTER);

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

  // ---------------------------------------------------------------------------
  // Schedule / agenda — read defensively. The /creator form stores the agenda at
  // config.additional.schedule (array of { time, title, description? }). A future
  // top-level `agenda` JSONB column (see 05_DATABASE_SCHEMA.md) is also honored.
  // ---------------------------------------------------------------------------
  const config = event.config || {};
  const schedule: Array<{ time?: string; title?: string; description?: string }> =
    (Array.isArray(event.agenda) && event.agenda.length > 0
      ? event.agenda
      : config?.additional?.schedule || config?.schedule || []) ?? [];

  // ---------------------------------------------------------------------------
  // What to expect — honor a top-level `what_to_expect` JSONB column
  // ({ intro, items[] }) or a config.whatToExpect fallback. Omitted when absent.
  // ---------------------------------------------------------------------------
  const wte = event.what_to_expect || config?.whatToExpect || null;
  const whatToExpect =
    wte && (wte.intro || (Array.isArray(wte.items) && wte.items.length > 0))
      ? { intro: wte.intro || '', items: Array.isArray(wte.items) ? wte.items : [] }
      : null;

  // ---------------------------------------------------------------------------
  // Gallery album link. Resolution order:
  //   1. config.galleryAlbumId (set explicitly by a creator flow)
  //   2. albums.event_id lookup (the `albums.event_id` column is being added in
  //      gallery/migrations/add-event-id-to-albums.sql; the /creator flow sets
  //      albums.event_id = events.id when an event gallery is created).
  // The album page is served at /gallery/a/<albumId> (gallery service proxied
  // under /gallery). Only rendered when an album is actually found.
  // ---------------------------------------------------------------------------
  let galleryAlbumId: string | null = config?.galleryAlbumId || null;
  if (!galleryAlbumId) {
    // TODO(albums.event_id): once the `albums.event_id` migration is applied in
    // efps, this lookup resolves the linked album. It fails open (no gallery link)
    // if the column does not yet exist.
    try {
      const { data: album } = await supabase
        .from('albums')
        .select('id')
        .eq('event_id', event.id)
        .limit(1)
        .maybeSingle();
      galleryAlbumId = album?.id || null;
    } catch {
      galleryAlbumId = null;
    }
  }

  // Public URL used for the QR code + share link. Mirrors the QR API logic.
  const eventUrl = getPublicEventUrl(event);

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
      // Data-driven: config.hideHeroLocation drops the venue line from the hero
      // (e.g. when the named venue is only a pickup point, not the main event).
      hideInHero: config?.hideHeroLocation === true,
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

    // Attendee-page extras (feature parity with the gui-norae landing page)
    schedule,
    whatToExpect,
    galleryAlbumId,

    // White-label branding (template-engine contract): colors, org name/logo,
    // and hidePlatformBranding all come from the event's `branding` JSONB.
    branding: event.branding || {},
    // Email verified by the access gate — prefills the RSVP form. Password
    // entries carry a marker, not an address; don't prefill those.
    verifiedEmail: verifiedEmail && verifiedEmail.includes('@') ? verifiedEmail : null,
    // Key locations for the "Getting Around" map section — data-driven from
    // config.mapPoints: [{ name, label, address, note, query, queryKo, embed }]
    mapPoints: Array.isArray(config?.mapPoints) ? config.mapPoints : [],

    // Localization (data-driven): primary/secondary date locales for bilingual
    // audiences, and the Google-embed tile language.
    locale: config?.locale || null,
    secondaryLocale: config?.secondaryLocale || null,
    mapLang: config?.mapLang || null,
    eventUrl,
    // Build-free QR: the existing GET /api/events/[id]/qr returns a PNG of eventUrl.
    // No new dependency, no client QR lib — just an <img>.
    qrImageUrl: `/api/events/${event.event_id}/qr`,
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
    title: `${event.title} - cloudpeers Events`,
    description: event.description || `Join us for ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
  };
}
