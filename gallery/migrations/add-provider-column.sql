-- add-provider-column.sql
--
-- Target: the efps Supabase Postgres database (shared cloudpeers project).
-- Purpose: make gallery assets provider-agnostic. Adds an optional `provider`
-- column to `assets` so each row can declare its storage/delivery backend.
--
-- Backward-compatible & safe to run anytime:
--   * IF NOT EXISTS guards re-runs.
--   * DEFAULT 'cloudflare-images' means existing rows (e.g. the 60 Seoul
--     Cloudflare Images assets) keep rendering unchanged with no backfill.
--   * The application (lib/photoUrl.ts) ALSO defaults null/absent provider to
--     'cloudflare-images', so the app works even before this migration is run.
--
-- Supported values today: 'cloudflare-images', 'cloudflare-stream', 'gcs'.
-- (For 'gcs', assets.provider_id holds the GCS object path; a signed URL is
--  generated server-side.)
--
-- NOTE: Do NOT run automatically. Apply manually against efps when ready.

ALTER TABLE assets ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'cloudflare-images';

COMMENT ON COLUMN assets.provider IS
  'Storage/delivery backend for this asset: cloudflare-images | cloudflare-stream | gcs. '
  'Optional; NULL is treated as cloudflare-images by the gallery app for backward compatibility.';
