/**
 * Custom-domain routing for white-label events.
 *
 * Events can be served on their own domain (e.g. sunnymax.live). The domain is
 * stored on the event row as custom_subdomain + subdomain_provider (the same
 * fields the QR/share-link logic already uses: `<subdomain>.<provider>`), so a
 * root domain "sunnymax.live" is stored as subdomain "sunnymax", provider
 * "live". Requests whose Host is not a platform host are resolved against the
 * events table and rewritten to the canonical /e/[eventId] page. Lookups are
 * cached in-memory; unknown domains fall through to normal routing.
 */

import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_HOSTS = new Set(['events.cloudpeers.com', 'localhost', '127.0.0.1']);
const CACHE_TTL_MS = 5 * 60 * 1000;
const domainCache = new Map<string, { eventId: string | null; at: number }>();

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  if (!host || PLATFORM_HOSTS.has(host) || host.endsWith('.run.app')) {
    return NextResponse.next();
  }

  const bare = host.startsWith('www.') ? host.slice(4) : host;
  const dot = bare.indexOf('.');
  if (dot === -1) return NextResponse.next();
  const subdomain = bare.slice(0, dot);
  const provider = bare.slice(dot + 1);

  const cached = domainCache.get(bare);
  let eventId = cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.eventId : undefined;

  if (eventId === undefined) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return NextResponse.next();
      // Full custom domains live at config.customDomain; legacy subdomain
      // events use custom_subdomain + subdomain_provider. One query covers both.
      const filter =
        `or=(config->>customDomain.eq.${encodeURIComponent(bare)},` +
        `and(custom_subdomain.eq.${encodeURIComponent(subdomain)},` +
        `subdomain_provider.eq.${encodeURIComponent(provider)}))`;
      const res = await fetch(
        `${url}/rest/v1/events?${filter}&deleted_at=is.null&select=event_id&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      const rows = res.ok ? await res.json() : [];
      eventId = rows?.[0]?.event_id ?? null;
    } catch {
      eventId = null;
    }
    eventId = eventId ?? null;
    domainCache.set(bare, { eventId, at: Date.now() });
  }

  if (!eventId) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/e/${eventId}`, req.url));
}

// Only the landing path needs domain resolution; assets, /api and /gallery
// keep their normal host-independent routing.
export const config = { matcher: ['/'] };
