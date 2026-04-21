-- ============================================================================
-- Migration: add 'dactylo' client_type + seed Prodactylo organization
-- Description:
--   1. Widen the CHECK constraint on organizations.client_type and
--      invitations.client_type from ('social','agency') to
--      ('social','agency','dactylo').
--   2. Seed the Prodactylo organization.
--
-- Business context:
--   Prodactylo is an external typing/dictation subcontractor ("dactylo")
--   that processes quotes flagged with the "Dactylo" status in Odoo, uploads
--   Word files, and transitions the quote to "A verifier par expert".
--   It is NOT a commercial customer of Axis Experts; it is a service
--   provider. We reuse the same organizations / portal_clients data model
--   as social and agency clients, with a dedicated client_type value to
--   drive downstream routing (middleware, API scoping, UI visibility) in
--   later passes.
--
--   odoo_partner_id = 61143 points to a real partner in Odoo. That partner
--   exists as a subcontractor record and is reused here so that a dactylo
--   user's portal_clients row has a stable Odoo reference, even though no
--   sale.order is ever issued against this partner.
--
-- Design notes:
--   - No new column, no new table, no new trigger, no RLS change.
--   - Existing policy "Authenticated users can read their organization" on
--     organizations already covers dactylo users (join via
--     portal_clients.organization_id).
--   - Access control for the Odoo sale.order listing that the dactylo
--     module will expose is enforced server-side in the API route
--     (isAdmin-like guard on client_type = 'dactylo'), not in Supabase RLS.
--   - The original CHECK constraints were defined inline and Postgres
--     auto-named them. We drop by default name AND sweep any remaining
--     CHECK on the column via a DO block, for safety across environments.
--
-- IMPORTANT: RUN MANUALLY IN SUPABASE SQL EDITOR.
--            DO NOT run `supabase db push`.
-- Safe to re-run (idempotent).
--
-- Date: 2026-04-21
-- ============================================================================

-- 1. Widen CHECK on organizations.client_type
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_client_type_check;

DO $$
DECLARE
  cons_name TEXT;
BEGIN
  FOR cons_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'organizations'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%client_type%'
  LOOP
    EXECUTE format('ALTER TABLE organizations DROP CONSTRAINT IF EXISTS %I', cons_name);
  END LOOP;
END $$;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_client_type_check
  CHECK (client_type IN ('social', 'agency', 'dactylo'));

-- 2. Widen CHECK on invitations.client_type (same pattern)
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_client_type_check;

DO $$
DECLARE
  cons_name TEXT;
BEGIN
  FOR cons_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'invitations'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%client_type%'
  LOOP
    EXECUTE format('ALTER TABLE invitations DROP CONSTRAINT IF EXISTS %I', cons_name);
  END LOOP;
END $$;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_client_type_check
  CHECK (client_type IN ('social', 'agency', 'dactylo'));

-- 3. Seed Prodactylo organization (idempotent)
--    No UNIQUE exists on odoo_partner_id, so guard with NOT EXISTS.
INSERT INTO organizations (
  name,
  odoo_partner_id,
  odoo_agency_id,
  odoo_template_prefix,
  client_type,
  logo_url,
  product_config,
  contact_name,
  contact_email,
  contact_phone,
  is_active
)
SELECT
  'Prodactylo',
  61143,
  NULL,
  'PRODACTYLO',
  'dactylo',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE odoo_partner_id = 61143
);

-- ============================================================================
-- Post-apply verification (run manually, NOT part of the migration):
--
--   -- a) The CHECK accepts the three values
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid IN ('organizations'::regclass, 'invitations'::regclass)
--     AND contype = 'c'
--     AND pg_get_constraintdef(oid) ILIKE '%client_type%';
--
--   -- b) Prodactylo is present exactly once
--   SELECT id, name, odoo_partner_id, client_type, is_active
--   FROM organizations
--   WHERE client_type = 'dactylo';
-- ============================================================================
