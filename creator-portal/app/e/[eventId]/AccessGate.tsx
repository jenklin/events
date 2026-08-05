'use client';

/**
 * Sign-in gate for private events (config.access.required).
 * Guests enter the email their invitation was sent to, or sign in with
 * Google (Supabase Auth) — either way the email must be on the admin-managed
 * allowlist. Success sets the access cookie and reloads into the event page.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AccessGateProps {
  eventId: string;
  title: string;
  branding?: {
    organizationName?: string;
    colors?: { primary?: string; secondary?: string };
  };
}

function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

export default function AccessGate({ eventId, title, branding }: AccessGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantAccess = async (payload: {
    email?: string;
    password?: string;
    supabaseAccessToken?: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || 'Access check failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // After a Google OAuth redirect lands back here with a session, complete the
  // allowlist check automatically.
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) grantAccess({ supabaseAccessToken: token });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Google sign-in is not available right now — use your invitation email instead.');
      return;
    }
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const brandVars = branding?.colors?.primary
    ? ({
        '--brand-primary': branding.colors.primary,
        '--brand-primary-light': `color-mix(in srgb, ${branding.colors.primary} 55%, white)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={brandVars}
      className="min-h-screen supports-[height:100dvh]:min-h-[100dvh] bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black text-paradigm-text flex items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <Card className="p-8 max-w-md w-full text-center">
        {branding?.organizationName && (
          <div className="text-sm font-semibold text-paradigm-purple-light mb-2">
            {branding.organizationName}
          </div>
        )}
        <h1 className="text-2xl font-bold text-white mb-2 whitespace-pre-line">{title}</h1>
        <p className="text-paradigm-muted mb-6">
          This is a private event. Enter the email your invitation was sent to, the event
          password, or sign in with Google. First time here? Use the event password, then RSVP
          to register.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) grantAccess({ email });
          }}
          className="space-y-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors text-center"
          />
          <Button type="submit" disabled={isSubmitting || !email} className="w-full h-12">
            {isSubmitting ? 'Checking…' : 'Continue'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-paradigm-muted">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) grantAccess({ password });
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Event password"
            className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors text-center"
          />
          <Button type="submit" variant="outline" disabled={isSubmitting || !password} className="w-full h-12">
            {isSubmitting ? 'Checking…' : 'Enter with password'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-paradigm-muted">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <Button type="button" variant="outline" onClick={signInWithGoogle} className="w-full h-12">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </Button>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-destructive/15 text-paradigm-coral-light border border-destructive/30 text-sm">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
