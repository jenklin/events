/**
 * Private-event access tokens.
 *
 * Events with config.access.required = true gate the attendee page behind an
 * email allowlist (config.access.allowedEmails, admin-managed) — satisfied
 * either by entering an invited email or by Google sign-in (Supabase Auth)
 * resolving to an invited email. Successful checks set an HttpOnly cookie
 * holding an HMAC-signed token so the guest stays signed in on that device.
 */

import crypto from 'crypto';

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const accessCookieName = (eventId: string) => `ea_${eventId}`;

export function signAccessToken(email: string, eventId: string): string {
  const normalized = email.trim().toLowerCase();
  const mac = crypto
    .createHmac('sha256', secret())
    .update(`${normalized}|${eventId}`)
    .digest('hex');
  return Buffer.from(JSON.stringify({ e: normalized, id: eventId, mac })).toString('base64url');
}

/** Returns the verified email, or null if the token is invalid for this event. */
export function verifyAccessToken(token: string, eventId: string): string | null {
  try {
    const { e, id, mac } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (id !== eventId || typeof e !== 'string' || typeof mac !== 'string') return null;
    const expected = crypto
      .createHmac('sha256', secret())
      .update(`${e}|${id}`)
      .digest('hex');
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return e;
  } catch {
    return null;
  }
}

/** Case-insensitive allowlist check. The host's email is always allowed. */
export function isEmailAllowed(
  email: string,
  event: { host_email?: string | null; config?: any }
): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (event.host_email && normalized === event.host_email.trim().toLowerCase()) return true;
  const allowed: string[] = Array.isArray(event.config?.access?.allowedEmails)
    ? event.config.access.allowedEmails
    : [];
  return allowed.some((a) => typeof a === 'string' && a.trim().toLowerCase() === normalized);
}
