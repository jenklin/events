/**
 * The published projection of an event — what cloudpeers services, labs and governed agents may
 * read. Creator opt-in per event (config.dateLocation.publishToServices); address, password and
 * guest data are never part of it. `slug` = event_id (URL slug), the event's custom domain, or the
 * row uuid (what the gallery's albums.event_id carries).
 * Post-event the story continues in the gallery, so galleryUrl is published too.
 */
import { getSupabaseAdmin } from '@/lib/supabase';
import { decodePlusCode, isFullPlusCode } from '@/lib/plusCode';
import { getPublicEventUrl, type PublishedEvent } from '@/lib/eventSchema';
import { eventFragmentFor } from '@/lib/eventFragment';

export async function publishedEventBySlug(slug: string): Promise<PublishedEvent | null> {
  const supabase = getSupabaseAdmin();
  const key = decodeURIComponent(slug).trim().toLowerCase();
  if (!key || key.length > 120) return null;
  const { data: rows, error } = await supabase
    .from('events')
    .select('id, event_id, title, event_date, config, custom_subdomain, subdomain_provider, custom_domain, deleted_at')
    .or(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ? `id.eq.${key},event_id.eq.${key},custom_domain.eq.${key}` : `event_id.eq.${key},custom_domain.eq.${key}`)
    .is('deleted_at', null)
    .limit(1);
  if (error || !rows || rows.length === 0) return null;
  const ev: any = rows[0];
  const dl = ev.config?.dateLocation ?? {};
  if (dl.publishToServices !== true) return null;

  // The host's privacy choices compose: "Hide location until guests RSVP" hides the venue from
  // services too — then only title, date/times and links publish; no venue name, no coordinate.
  const locationHidden = dl.hideLocationUntilRsvp === true;
  const plusCode: string | undefined = !locationHidden && typeof dl.plusCode === 'string' && dl.plusCode.trim() ? dl.plusCode.trim().toUpperCase() : undefined;
  const coordinates = !locationHidden && dl.coordinates && Number.isFinite(dl.coordinates.lat) && Number.isFinite(dl.coordinates.lng)
    ? { lat: Number(dl.coordinates.lat), lng: Number(dl.coordinates.lng) }
    : (plusCode && isFullPlusCode(plusCode) ? decodePlusCode(plusCode) ?? undefined : undefined);

  let galleryUrl: string | undefined;
  try {
    const { data: summary } = await supabase.from('event_summary').select('gallery_url').eq('event_id', ev.event_id).maybeSingle();
    if (summary?.gallery_url) galleryUrl = summary.gallery_url;
  } catch { /* gallery is optional */ }

  const customDomain: string | undefined = ev.custom_domain ?? ev.config?.customDomain ?? undefined;
  const projection: PublishedEvent = {
    slug: ev.event_id,
    title: ev.title ?? ev.config?.eventBasics?.title ?? ev.event_id,
    date: ev.event_date ?? dl.date,
    startTime: dl.startTime || undefined,
    endTime: dl.endTime || undefined,
    timezone: dl.timezone || undefined,
    venueName: locationHidden ? '' : (dl.venueName ?? ''),
    plusCode,
    coordinates,
    customDomain,
    eventUrl: getPublicEventUrl({ event_id: ev.event_id, custom_subdomain: ev.custom_subdomain, subdomain_provider: ev.subdomain_provider, config: { ...ev.config, customDomain } }),
    galleryUrl,
    locationHidden,
    published: true,
  };
  // A2UI (moment 7, 2026-08-29): the invitation as a validated Connector fragment carrying the host's
  // rules; hide-location is enforced by the builder (a leak is refused, never served). Absent = refused.
  const fr = eventFragmentFor({ ...projection, hostLabel: 'the host' });
  return fr.fragment ? { ...projection, fragment: fr.fragment } : projection;
}
