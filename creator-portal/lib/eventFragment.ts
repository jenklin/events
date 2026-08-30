/**
 * Published event → Connector fragment (A2UI moment 7, 2026-08-29).
 *
 * "The event invitation carries the host's rules." The published projection becomes one
 * CONNECTOR fragment: community-activity (the host published this venue), collaboration-prompt
 * (explicit consent to appear in the gallery; the host's rules as the privacy notice),
 * network-map (host · venue · gallery — never guests). Host-published only: an unpublished
 * event has no projection and therefore no fragment.
 *
 * Hide-location is honoured BY THE FRAGMENT: when the host hid the location, the builder refuses
 * any coordinate / Plus Code / venue name anywhere in the fragment (assertNoHiddenLocationLeak),
 * so a leak is impossible to serve — not merely unlikely. Validated with the vendored shared
 * validator before it leaves the service; the lab validates again and re-runs the leak check.
 */
import { validateFragment } from '@/lib/a2ui/validator';
import type { Fragment } from '@/lib/a2ui/types';
import type { PublishedEvent } from '@/lib/eventSchema';

const LOCATION_KEYS = new Set(['lat', 'lng', 'lon', 'latitude', 'longitude', 'plus_code', 'pluscode', 'coordinates', 'coordinate', 'venue_name', 'venuename', 'address']);

/** Walks every prop; throws on any location-bearing key or a Plus-Code-shaped / lat,lng-shaped string. */
export function assertNoHiddenLocationLeak(fragment: Fragment, venueName?: string): void {
  const plusCodeRe = /\b[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,7}\b/i;
  const latLngRe = /-?\d{1,2}\.\d{3,},\s*-?\d{1,3}\.\d{3,}/;
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (LOCATION_KEYS.has(k.toLowerCase())) throw new Error(`hidden location leak at ${path}.${k}`);
        walk(x, `${path}.${k}`);
      }
      return;
    }
    if (typeof v === 'string') {
      if (plusCodeRe.test(v) || latLngRe.test(v)) throw new Error(`hidden location leak (string) at ${path}`);
      if (venueName && venueName.trim() && v.toLowerCase().includes(venueName.trim().toLowerCase())) throw new Error(`hidden location leak (venue name) at ${path}`);
    }
  };
  walk(fragment.components, 'components');
}

export interface EventFragmentInput extends PublishedEvent { locationHidden: boolean; hostLabel?: string }

export function buildEventFragment(ev: EventFragmentInput): Fragment {
  // A hidden-location event must arrive already stripped (publishedEvent.ts does this). If location
  // data is still present the projection is inconsistent — refuse rather than strip silently.
  if (ev.locationHidden && (ev.coordinates || ev.plusCode || (ev.venueName && ev.venueName.trim()))) throw new Error('hidden location leak: projection still carries venue/coordinate/Plus Code');
  const host = ev.hostLabel ?? 'the host';
  const when = `${ev.date}${ev.startTime ? ` · ${ev.startTime}` : ''}${ev.endTime ? `–${ev.endTime}` : ''}${ev.timezone ? ` ${ev.timezone}` : ''}`;
  const where = ev.locationHidden ? 'location shared with guests after RSVP' : (ev.venueName || 'venue published');
  const nodes: Array<Record<string, unknown>> = [
    { id: 'host', label: host, relationship: 'convener', circle: 'inner', primary: true },
    { id: 'venue', label: ev.locationHidden ? 'Venue (hidden until RSVP)' : ev.venueName || 'Venue', relationship: 'venue', circle: 'inner', ...(ev.locationHidden ? {} : { location: ev.coordinates ? { lat: ev.coordinates.lat, lng: ev.coordinates.lng } : undefined }) },
  ];
  if (ev.galleryUrl) nodes.push({ id: 'gallery', label: 'Event gallery', relationship: 'gallery', circle: 'outer', url: ev.galleryUrl });
  const edges = [{ from: 'host', to: 'venue', kind: 'convenes_at' }, ...(ev.galleryUrl ? [{ from: 'venue', to: 'gallery', kind: 'continues_in' }] : [])];

  const f: Fragment = {
    fragmentId: `event-${ev.slug}`,
    serviceId: 'cloudpeers-events',
    archetypeId: 'connector',
    components: [
      {
        type: 'community-activity',
        props: {
          title: ev.title,
          trust_circle_context: `Published by ${host} · ${when} · ${where}`,
          activities: [{ who: host, what: 'published this event to cloudpeers services', when: ev.date, count: 1 }],
          empty_message: 'Nothing else is shared: address, password and guest list stay with the host.',
          event_url: ev.eventUrl,
          ...(ev.galleryUrl ? { gallery_url: ev.galleryUrl } : {}),
        },
      },
      {
        type: 'collaboration-prompt',
        props: {
          title: `Compose at ${ev.title}?`,
          consent_required: true,
          consent_statement: `A scene you compose here anchors at the event and, only if you choose to publish it, joins the event's gallery. ${host} never receives your name — only what you publish.`,
          privacy_notice: `The host's rules: address, password and guest list never leave the host's portal${ev.locationHidden ? '; the location is hidden until guests RSVP, so this invitation carries no venue, coordinate or Plus Code' : ''}. The event date is context, not a gate — before, during and after.`,
          action_label: 'Compose at this event',
          action_kind: 'compose_at_event',
        },
      },
      { type: 'network-map', props: { nodes, edges, legend: 'host · venue · gallery — guests are never mapped' } },
    ],
    layout: { slot: 'main', priority: 80 },
    sovereignty: { classification: 'externalizable', consent_required: true, fields_rendered: ['title', 'date and times', ev.locationHidden ? 'location: hidden' : 'venue name and coordinate', 'event URL', ...(ev.galleryUrl ? ['gallery URL'] : [])] },
  } as Fragment;
  if (ev.locationHidden) assertNoHiddenLocationLeak(f, ev.venueName);
  return f;
}

/** Build + validate; returns the fragment or a named refusal. Never throws. */
export function eventFragmentFor(ev: EventFragmentInput): { fragment?: Fragment; invalid?: string[] } {
  try {
    const f = buildEventFragment(ev);
    const v = validateFragment(f);
    return v.valid ? { fragment: f } : { invalid: v.errors.map((e) => e.message) };
  } catch (e) {
    return { invalid: [e instanceof Error ? e.message : String(e)] };
  }
}
