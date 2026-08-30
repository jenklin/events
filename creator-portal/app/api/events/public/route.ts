/**
 * GET /api/events/public — every event a host published to cloudpeers services (public projection
 * only: title · date/times · venue name · coordinate · links; never address/password/guests).
 * Backs the portal's My Events list and lets labs/agents discover venues without a slug.
 */
import { NextResponse } from 'next/server';
import { publishedEvents } from '@/lib/publishedEvent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await publishedEvents();
    return NextResponse.json({ events, count: events.length }, { headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120', 'Access-Control-Allow-Origin': '*' } });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
