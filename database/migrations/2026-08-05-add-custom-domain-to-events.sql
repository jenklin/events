-- Add first-class custom-domain support to events.
--
-- Context (2026-08-05): full vanity domains (e.g. sunnymax.live for the
-- xmas-2026 event) don't fit custom_subdomain + subdomain_provider because
-- events_subdomain_provider_check limits the provider to the legacy values.
-- The app currently stores the domain at config->>'customDomain' (see
-- creator-portal/lib/eventSchema.ts getPublicEventUrl and
-- creator-portal/middleware.ts) as a no-DDL workaround.
--
-- This migration adds a proper column and backfills it from config. The app
-- keeps reading config.customDomain first, so applying this is safe at any
-- time; switching reads to the column is a follow-up code change.
--
-- Apply manually via the Supabase SQL Editor (do not use `supabase db push`).
-- STATUS: applied by JKL via SQL Editor on 2026-08-05 ("Success. No rows returned").

ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_domain text;

-- One event per domain
CREATE UNIQUE INDEX IF NOT EXISTS events_custom_domain_key
  ON events (custom_domain)
  WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;

-- Backfill from the config JSONB workaround
UPDATE events
SET custom_domain = config->>'customDomain'
WHERE config->>'customDomain' IS NOT NULL
  AND custom_domain IS NULL;
