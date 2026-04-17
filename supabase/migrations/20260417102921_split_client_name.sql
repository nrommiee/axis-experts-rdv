-- Split portal_clients.display_name into first_name + last_name.
-- display_name becomes a GENERATED column for backward compatibility
-- with any external SQL readers. All application code writes to
-- first_name / last_name only.
--
-- RUN MANUALLY IN SUPABASE SQL EDITOR. DO NOT run `supabase db push`.

ALTER TABLE portal_clients ADD COLUMN first_name TEXT;
ALTER TABLE portal_clients ADD COLUMN last_name TEXT;

-- Drop the existing display_name (demo data only per product decision)
ALTER TABLE portal_clients DROP COLUMN display_name;

-- Re-add as a generated column. NULLIF + TRIM ensures that if both
-- first_name and last_name are null/empty, display_name is NULL
-- (rather than an empty string or lone space).
ALTER TABLE portal_clients
  ADD COLUMN display_name TEXT
  GENERATED ALWAYS AS (
    NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
  ) STORED;
