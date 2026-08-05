/**
 * POST /api/events/[eventId]/qr
 * Generate QR code for event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getPublicEventUrl } from '@/lib/eventSchema';
import QRCode from 'qrcode';

// The QR encodes the event's current public URL (which can change when a
// custom domain is attached) — always resolve it fresh.
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const body = await req.json();
    const size = body.size || 512;

    // Get event
    const { data: event, error } = await supabase
      .from('events')
      .select('id, event_id, custom_subdomain, subdomain_provider, config')
      .eq('event_id', eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventUrl = getPublicEventUrl(event);

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Also generate as buffer for download
    const qrCodeBuffer = await QRCode.toBuffer(eventUrl, {
      width: size,
      margin: 2,
    });

    return NextResponse.json({
      eventId: event.event_id,
      eventUrl,
      qrCodeUrl: `${eventUrl}/qr.png`,
      qrCodeDataUrl, // Base64 data URL
      size,
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for direct QR code image
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, custom_subdomain, subdomain_provider, config')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventUrl = getPublicEventUrl(event);

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(eventUrl, {
      width: 512,
      margin: 2,
    });

    // Return image (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
        // Not immutable: the encoded URL changes when a custom domain is attached
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code image:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
