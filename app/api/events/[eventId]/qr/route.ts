/**
 * POST /api/events/[eventId]/qr
 * Generate QR code for event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await req.json();
    const size = body.size || 512;

    // Get event
    const { data: event, error } = await supabase
      .from('events')
      .select('id, event_id, custom_subdomain, subdomain_provider')
      .eq('event_id', eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Generate event URL
    let eventUrl: string;
    if (event.custom_subdomain && event.subdomain_provider) {
      eventUrl = `https://${event.custom_subdomain}.${event.subdomain_provider}`;
    } else {
      eventUrl = `https://events.cloudpeers.com/e/${event.event_id}`;
    }

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
    const { eventId } = params;

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, event_id, custom_subdomain, subdomain_provider')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Generate event URL
    let eventUrl: string;
    if (event.custom_subdomain && event.subdomain_provider) {
      eventUrl = `https://${event.custom_subdomain}.${event.subdomain_provider}`;
    } else {
      eventUrl = `https://events.cloudpeers.com/e/${event.event_id}`;
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(eventUrl, {
      width: 512,
      margin: 2,
    });

    // Return image
    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
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
