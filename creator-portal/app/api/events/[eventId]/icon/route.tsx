/**
 * GET /api/events/[eventId]/icon?size=180
 *
 * Event-specific favicon / touch icon for white-label events, so link previews
 * (iMessage, KakaoTalk) and browser tabs never show the platform logo.
 * Data-driven: branding.iconEmoji, else the first emoji in the event title,
 * else the title's first letter on the brand primary colour.
 */

import { ImageResponse } from 'next/og';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const EMOJI_RE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/u;

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const sizeParam = Number(new URL(req.url).searchParams.get('size'));
  const size = Number.isFinite(sizeParam) && sizeParam >= 16 && sizeParam <= 1024 ? sizeParam : 180;

  const { data: event } = await getSupabaseAdmin()
    .from('events')
    .select('title, branding')
    .eq('event_id', params.eventId)
    .single();

  if (!event) return new Response('Not found', { status: 404 });

  const title = String(event.title || '').trim();
  const emoji: string | null =
    (typeof event.branding?.iconEmoji === 'string' && event.branding.iconEmoji) ||
    title.match(EMOJI_RE)?.[0] ||
    null;
  const primary: string = event.branding?.colors?.primary || '#111111';

  const res = new ImageResponse(
    emoji ? (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontSize: size * 0.72,
        }}
      >
        {emoji}
      </div>
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primary,
          color: '#ffffff',
          fontSize: size * 0.6,
          fontWeight: 700,
        }}
      >
        {(title.replace(/[^\p{L}\p{N}]/gu, '')[0] || '•').toUpperCase()}
      </div>
    ),
    { width: size, height: size, emoji: 'twemoji' }
  );
  res.headers.set('Cache-Control', 'public, max-age=3600');
  return res;
}
