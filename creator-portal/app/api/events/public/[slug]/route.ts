/**
 * GET /api/events/public/[slug]
 * The published projection of an event — for cloudpeers services, labs and governed agents.
 * Only events whose creator opted in (config.dateLocation.publishToServices) are served; the
 * address, password and guest data are never part of the response. `slug` may be the event_id
 * (URL slug) or the event's custom domain (e.g. sunnymax.live). 404 for unknown OR unpublished —
 * an unpublished event's existence is not confirmed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { publishedEventBySlug } from '@/lib/publishedEvent';

export const dynamic = 'force-dynamic';


export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ev = await publishedEventBySlug(params.slug);
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json(ev, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
