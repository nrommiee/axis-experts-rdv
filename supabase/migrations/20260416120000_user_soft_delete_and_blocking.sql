-- ============================================================================
-- Migration: user soft-delete + applicative blocking + org cascade
-- Description:
--   1. Adds traceability columns to portal_clients:
--        - deleted_at / deleted_by  (soft-delete)
--        - blocked_at / blocked_by  (applicative block, complements auth ban)
--   2. Partial index to speed up "active users" queries
--   3. Trigger: when an organization is deactivated (is_active true -> false),
--      every active, non-deleted portal_client of that org is auto-blocked.
--
-- IMPORTANT: Do NOT apply with `supabase db push`. Execute via Supabase
-- SQL Editor on the project (woaxmqckupcgwsjbnlep).
--
-- Date: 2026-04-16
-- ============================================================================

-- 1. Tracking columns on portal_clients
ALTER TABLE portal_clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS blocked_by UUID NULL REFERENCES auth.users(id);

-- 2. Partial index to keep "active users" listings fast
CREATE INDEX IF NOT EXISTS idx_portal_clients_active
  ON portal_clients(organization_id)
  WHERE deleted_at IS NULL;

-- 3. Documentation
COMMENT ON COLUMN portal_clients.deleted_at IS
  'Soft delete timestamp. NULL = user actif.';
COMMENT ON COLUMN portal_clients.deleted_by IS
  'Admin (auth.users.id) qui a effectue le soft-delete.';
COMMENT ON COLUMN portal_clients.blocked_at IS
  'Blocage applicatif. NULL = non bloque.';
COMMENT ON COLUMN portal_clients.blocked_by IS
  'Admin (auth.users.id) qui a bloque l''utilisateur ou trigger cascade (NULL).';

-- 4. Cascade: deactivating an organization blocks all its active users.
--    NOTE: organizations has no updated_by column, so blocked_by is set to
--    NULL for cascade-blocks. When an admin blocks manually via the API
--    route, blocked_by is set to the admin's auth uid.
CREATE OR REPLACE FUNCTION cascade_org_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE portal_clients
    SET blocked_at = NOW(),
        blocked_by = NULL
    WHERE organization_id = NEW.id
      AND blocked_at IS NULL
      AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cascade_org_deactivation ON organizations;
CREATE TRIGGER trigger_cascade_org_deactivation
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION cascade_org_deactivation();

-- ============================================================================
-- 5. Automatic purge of accepted invitations older than 30 days
--
-- Option A (preferred): pg_cron. First check on the project:
--   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- If installed, run:
--
-- SELECT cron.schedule(
--   'purge-invitations-used',
--   '0 3 * * *', -- every day at 03:00 UTC
--   $$
--     DELETE FROM invitations
--     WHERE used_at IS NOT NULL
--       AND used_at < NOW() - INTERVAL '30 days';
--   $$
-- );
--
-- Option B (fallback): run the DELETE manually or from a scheduled Edge
-- Function if pg_cron is unavailable on the project.
-- ============================================================================
