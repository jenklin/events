-- Link gallery albums to events.  Target: Supabase efps (efpspxzgvbsqfyelbkdw).
--
-- Backward-compatible: nullable, so existing albums (e.g. the seoul album
-- ffd8e9fc-cea4-4c8c-9918-9af167a7304d) stay NULL until linked. The /creator flow
-- sets albums.event_id = events.id when an event's gallery album is created, which
-- powers the event -> gallery picker ("View Gallery" on an event).
--
-- events PK is `id` uuid; events uses soft-delete (deleted_at), so the optional FK's
-- ON DELETE SET NULL will rarely fire — kept commented to avoid coupling/locks on the
-- shared cloudpeers DB. Enable it if you want referential integrity enforced.

ALTER TABLE albums ADD COLUMN IF NOT EXISTS event_id uuid;

CREATE INDEX IF NOT EXISTS idx_albums_event_id ON albums(event_id);

-- Optional referential integrity:
-- ALTER TABLE albums
--   ADD CONSTRAINT fk_albums_event
--   FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

COMMENT ON COLUMN albums.event_id IS
  'Optional FK to events.id. NULL for standalone/cross-event albums (e.g. legacy seoul). Set by the creator flow when an event gallery is created.';
