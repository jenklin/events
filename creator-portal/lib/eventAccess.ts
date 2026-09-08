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

/** Marker stored in the access token when entry was via the shared event
 * password rather than an identified email. Never a real address. */
export const PASSWORD_GUEST = 'password-guest';

/** SHA-256 hex — matches the hashing used by /api/events/create. */
export function hashEventPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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

/**
 * Guest identity for per-guest features (song requests etc.).
 *
 * Reads the event's access cookie and returns the verified email it carries,
 * or null when there is no cookie / it's invalid / it's the shared-password
 * marker. Callers must never trust an email from the request body for
 * ownership checks — only this.
 */
export function readVerifiedGuestEmail(
  cookieValue: string | undefined,
  eventId: string
): string | null {
  if (!cookieValue) return null;
  const email = verifyAccessToken(cookieValue, eventId);
  return email && email.includes('@') ? email : null;
}

/** True when the cookie is a valid shared-password entry (no email identity yet). */
export function isPasswordGuest(cookieValue: string | undefined, eventId: string): boolean {
  if (!cookieValue) return false;
  return verifyAccessToken(cookieValue, eventId) === PASSWORD_GUEST;
}

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 180,
};
