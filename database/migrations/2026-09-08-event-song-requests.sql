-- Guest song requests → one shared playlist per event (Karaoke Playlist).
--
-- Context (2026-09-08): the attendee page lets guests request songs
-- (YouTube / Spotify link, provider search, or plain title + artist). The
-- first cut stored them inside rsvp_responses.music_contribution, which tied
-- requests to an RSVP and identified guests by a free-text email. This table
-- replaces that: one row per request, guest identity comes from the
-- server-signed access cookie (lib/eventAccess.ts), and hosts get a real
-- table to query/export for the night.
--
-- Access: service-role only. RLS is enabled with NO policies on purpose —
-- every read/write goes through the creator-portal API routes
-- (app/api/events/[eventId]/songs) using the admin client, which verifies the
-- guest cookie itself. Do not add anon/authenticated policies.
--
-- Apply manually via the Supabase SQL Editor (do not use `supabase db push`).
-- STATUS: applied by JKL via SQL Editor on 2026-09-08; verified live the same day.

CREATE TABLE IF NOT EXISTS public.event_song_requests (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id      uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_email   text NOT NULL,               -- normalized lower-case, from the signed access cookie
  guest_name    text NOT NULL,
  title         text NOT NULL,
  artist        text,
  provider      text NOT NULL DEFAULT 'manual'
                  CHECK (provider IN ('youtube', 'spotify', 'manual')),
  url           text,
  external_id   text,                        -- YouTube videoId / Spotify trackId
  thumbnail_url text,
  source        text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('link', 'search', 'manual')),
  status        text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested', 'played', 'skipped')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_song_requests_guest_email_lower CHECK (guest_email = lower(guest_email)),
  CONSTRAINT event_song_requests_title_len CHECK (char_length(title) BETWEEN 1 AND 200)
);

COMMENT ON TABLE public.event_song_requests IS
  'Guest song requests for an event''s shared playlist. Service-role only; guest identity is the signed access cookie email.';

-- Playlist reads: all requests for an event in submission order.
CREATE INDEX IF NOT EXISTS event_song_requests_event_created_idx
  ON public.event_song_requests (event_id, created_at);

-- Per-guest cap + "mine" lookups.
CREATE INDEX IF NOT EXISTS event_song_requests_event_guest_idx
  ON public.event_song_requests (event_id, guest_email);

-- A guest can't request the same track twice.
CREATE UNIQUE INDEX IF NOT EXISTS event_song_requests_guest_track_key
  ON public.event_song_requests (event_id, guest_email, provider, external_id)
  WHERE external_id IS NOT NULL;

-- updated_at maintenance (own function; no dependency on other schemas' helpers)
CREATE OR REPLACE FUNCTION public.event_song_requests_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_song_requests_touch_updated_at ON public.event_song_requests;
CREATE TRIGGER event_song_requests_touch_updated_at
  BEFORE UPDATE ON public.event_song_requests
  FOR EACH ROW EXECUTE FUNCTION public.event_song_requests_touch_updated_at();

-- Lock down: RLS on, no policies → only the service role (API routes) can touch it.
ALTER TABLE public.event_song_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_song_requests FROM anon, authenticated;
