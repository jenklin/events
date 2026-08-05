/**
 * POST /api/events/[eventId]/access
 * Verify a guest against a private event's email allowlist and set the
 * access cookie. Two paths:
 *   { email }                — invited-email check (admin pre-populates
 *                              config.access.allowedEmails)
 *   { supabaseAccessToken }  — Google sign-in via Supabase Auth; the signed-in
 *                              account's email must be on the allowlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  accessCookieName,
  hashEventPassword,
  isEmailAllowed,
  PASSWORD_GUEST,
  signAccessToken,
} from '@/lib/eventAccess';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { eventId } = params;
    const body = await req.json();

    const { data: event } = await supabase
      .from('events')
      .select('event_id, host_email, config, password_hash')
      .eq('event_id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Shared event password path — grants access without identifying an email.
    if (typeof body.password === 'string' && body.password) {
      if (event.password_hash && hashEventPassword(body.password) === event.password_hash) {
        const response = NextResponse.json({ ok: true });
        response.cookies.set(
          accessCookieName(event.event_id),
          signAccessToken(PASSWORD_GUEST, event.event_id),
          { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180 }
        );
        return response;
      }
      return NextResponse.json({ error: 'Incorrect event password.' }, { status: 403 });
    }

    let email: string | null = null;

    if (typeof body.supabaseAccessToken === 'string' && body.supabaseAccessToken) {
      const { data: userData, error: userError } = await supabase.auth.getUser(
        body.supabaseAccessToken
      );
      if (userError || !userData?.user?.email) {
        return NextResponse.json({ error: 'Sign-in could not be verified' }, { status: 401 });
      }
      email = userData.user.email;
    } else if (typeof body.email === 'string') {
      email = body.email;
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isEmailAllowed(email, event)) {
      return NextResponse.json(
        {
          error:
            "This email isn't on the guest list. Try the email your invitation was sent to, or contact the host.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true, email: email.trim().toLowerCase() });
    response.cookies.set(accessCookieName(event.event_id), signAccessToken(email, event.event_id), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180, // stay signed in through the event
    });
    return response;
  } catch (error: any) {
    console.error('Error verifying event access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
