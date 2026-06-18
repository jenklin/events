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
  return NextResponse.json({ service: SERVICE_ID, version: SERVICE_VERSION, capabilities: ['create_event'] });
}
