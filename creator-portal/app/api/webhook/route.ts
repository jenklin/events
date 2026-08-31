/**
 * POST /api/webhook — cloudpeers A2A webhook receiver (events service).
 *
 * Verifies the canonical cloudpeers webhook signature (§3b /
 * SERVICE_ONBOARDING_CONTRACT.md "L1 webhook-signature wire format"):
 *   Header:  X-cloudpeers-Signature: t=<unix_seconds>,v1=<hmac_hex>
 *   HMAC:    HMAC-SHA256(secret, `${t}.${rawBody}`) over the RAW request bytes
 *   Replay:  reject if |now - t| > 300s ; t is unix SECONDS
 *   Compare: constant-time ; fail-closed if no secret
 *
 * On a valid signature it dispatches by capability. `create_event` is wired to the
 * existing POST /api/events/create endpoint (reused server-side, so the A2A path and
 * the UI path share one implementation). Unknown capabilities return 400 (NOT 401) —
 * a valid signature is accepted even when the capability isn't handled, which is what
 * the behavioral conformance probe asserts.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.CLOUDPEERS_WEBHOOK_SECRET || process.env.MCP_WEBHOOK_SECRET;
const REPLAY_WINDOW_SECONDS = 300;
const SERVICE_ID = 'cloudpeers-events';
const SERVICE_VERSION = '1.0.0';

function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    // Fail-closed: never accept unsigned traffic just because the secret is unset.
    console.error('[events webhook] No webhook secret configured — rejecting (fail-closed)');
    return false;
  }
  if (!signatureHeader) return false;

  // Parse `t=<unix>,v1=<hex>` (order-independent, whitespace-tolerant).
  let t: string | undefined;
  let v1: string | undefined;
  for (const part of signatureHeader.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === 't') t = val;
    else if (key === 'v1') v1 = val;
  }
  if (!t || !v1) return false;

  const tSec = parseInt(t, 10);
  if (!Number.isFinite(tSec)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tSec) > REPLAY_WINDOW_SECONDS) return false;

  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${t}.${rawBody}`).digest('hex');
  const sigBuf = Buffer.from(v1, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: NextRequest) {
  // §3b signs over the RAW request bytes — read the body as text, do not re-serialize.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('x-cloudpeers-signature');

  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json(
      { error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' } },
      { status: 401 },
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_BODY', message: 'Body is not valid JSON' } }, { status: 400 });
  }

  const capability = (payload.capability || payload.skill) as string | undefined;
  const parameters = (payload.parameters || payload.payload || {}) as Record<string, unknown>;

  switch (capability) {
    case 'get_event': {
      // Read-only: the published projection of an event (creator opt-in; never address/password/guests).
      const p: any = payload;
      const slug = (p.input?.slug ?? p.input?.custom_domain ?? p.slug ?? p.custom_domain) as string | undefined;
      if (!slug) {
        return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'get_event requires slug or custom_domain' } }, { status: 400 });
      }
      const { publishedEventBySlug } = await import('@/lib/publishedEvent');
      const ev = await publishedEventBySlug(slug);
      if (!ev) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found or not published to services' } }, { status: 404 });
      }
      return NextResponse.json({ service: SERVICE_ID, version: SERVICE_VERSION, capability: 'get_event', result: ev });
    }
    case 'provide_location_layer': {
      // Tesseract layer partner (event-story spec §5d-bis, Phase 1b, 2026-08-30): the event's gallery
      // at this coordinate as ONE Layer Contract object. Only the requester's own uploads (the host's
      // own when the host exports) compose; every other guest's item is returned in `withheld[]` as
      // `not_owned` (decision 2026-08-23, reaffirmed 2026-08-30). Bytes stay with the provider.
      const coord = parameters.coordinate as { lat?: unknown; lng?: unknown } | undefined;
      const lat = Number(coord?.lat), lng = Number(coord?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'provide_location_layer requires coordinate {lat,lng}' } }, { status: 400 });
      }
      const radiusM = Number.isFinite(Number(parameters.radius_m)) && Number(parameters.radius_m) > 0 ? Number(parameters.radius_m) : 150;
      const ownerRef = typeof parameters.owner_ref === 'string' && parameters.owner_ref ? parameters.owner_ref : null;
      const { publishedEventsWithRow } = await import('@/lib/publishedEvent');
      const { selectGalleryLayer, haversineM } = await import('@/lib/galleryLayer');
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabase = getSupabaseAdmin();

      // Nearest published event with a coordinate inside the compose radius (hidden-location events have none).
      const near = (await publishedEventsWithRow())
        .filter((e) => e.projection.coordinates)
        .map((e) => ({ ...e, d: haversineM(lat, lng, e.projection.coordinates!.lat, e.projection.coordinates!.lng) }))
        .filter((e) => e.d <= radiusM)
        .sort((a, b) => a.d - b.d)[0];
      if (!near) return NextResponse.json({ has_layer: false, reason: 'no_published_event_in_radius' });

      const { data: album } = await supabase.from('albums').select('id, event_id, title, is_private').eq('event_id', near.rowId).limit(1).maybeSingle();
      if (!album) return NextResponse.json({ has_layer: false, reason: 'no_album' });
      const { data: assets } = await supabase.from('assets')
        .select('id, album_id, type, provider, provider_id, captured_at, created_at, original_filename, metadata') // provider column live since add-provider-column.sql (2026-08-30); uploader identity stays metadata-only
        .eq('album_id', album.id).order('captured_at', { ascending: true }).limit(200);

      // owner_ref → email, server-side only; the email never leaves this handler.
      let requesterEmail: string | null = null;
      if (ownerRef) {
        try { const { data } = await supabase.auth.admin.getUserById(ownerRef); requesterEmail = data?.user?.email ?? null; } catch { requesterEmail = null; }
      }
      const layer = selectGalleryLayer({
        event: { rowId: near.rowId, title: near.projection.title, date: near.projection.date, venueName: near.projection.venueName, coordinates: near.projection.coordinates!, hostEmail: near.hostEmail },
        album, assets: (assets ?? []) as any, requesterEmail,
        cfImagesHash: process.env.NEXT_PUBLIC_CF_IMAGES_HASH || process.env.CF_IMAGES_HASH || null,
        distanceM: near.d,
      });
      return NextResponse.json(layer);
    }
    case 'create_event': {
      // Reuse the existing create endpoint server-side so both paths share one impl.
      const target = new URL('/api/events/create', req.nextUrl.origin).toString();
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parameters),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          capability: 'create_event',
          status: res.ok ? 'success' : 'error',
          result: data,
          metadata: { serviceId: SERVICE_ID, serviceVersion: SERVICE_VERSION },
        },
        { status: res.ok ? 200 : res.status },
      );
    }
    default:
      return NextResponse.json(
        { error: { code: 'UNKNOWN_CAPABILITY', message: `Unknown capability: ${capability ?? '(none)'}` } },
        { status: 400 },
      );
  }
}

// Lightweight liveness check (GET is unsigned — returns no data, just confirms the route exists).
export async function GET() {
  return NextResponse.json({ service: SERVICE_ID, version: SERVICE_VERSION, capabilities: ['create_event', 'get_event', 'provide_location_layer'] });
}
