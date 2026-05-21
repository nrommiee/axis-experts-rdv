-- ============================================================================
-- Migration: regularize notifications + product_catalog schema
-- Ticket: TD-NEW-64
-- Date: 2026-05-21
-- ----------------------------------------------------------------------------
-- Rationale:
--   Deux pans de schéma existent en prod (table product_catalog + 5 colonnes
--   notifications sur organizations) sans migration SQL versionnée. Cette
--   migration régularise le repo en reflétant l'état prod actuel.
--   Tout est rédigé idempotent (IF NOT EXISTS / DROP IF EXISTS / DO blocks)
--   afin d'être no-op sur prod et reproductible sur une base fraîche.
-- ----------------------------------------------------------------------------
-- Hors-scope (tickets séparés) :
--   - UNIQUE(odoo_default_code) sur product_catalog
--   - Passage NOT NULL de notify_on_create / notify_on_update
--   - Cleanup du fallback notify_on_* dans notifications/route.ts (TD-NEW-70)
-- ----------------------------------------------------------------------------
-- Rollback:
--   DROP TABLE product_catalog;
--   ALTER TABLE organizations
--     DROP COLUMN IF EXISTS notifications_enabled,
--     DROP COLUMN IF EXISTS notification_recipients_mode,
--     DROP COLUMN IF EXISTS notification_custom_emails,
--     DROP COLUMN IF EXISTS notify_on_create,
--     DROP COLUMN IF EXISTS notify_on_update;
--   (Ne PAS exécuter en prod sans coordination — pertes de données garanties.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. product_catalog : table + RLS + policy
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  odoo_default_code TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read product catalog"
  ON product_catalog;

CREATE POLICY "Authenticated users can read product catalog"
  ON product_catalog FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 2. organizations : 5 colonnes notifications
-- ----------------------------------------------------------------------------

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notification_recipients_mode TEXT NOT NULL DEFAULT 'all_org_users';

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notification_custom_emails JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notify_on_create BOOLEAN DEFAULT true;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notify_on_update BOOLEAN DEFAULT true;

-- CHECK constraint sur notification_recipients_mode
-- (CREATE CONSTRAINT IF NOT EXISTS n'existe pas en Postgres → DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organizations_notification_recipients_mode_check'
      AND conrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_notification_recipients_mode_check
      CHECK (notification_recipients_mode IN ('creator_only','all_org_users','custom_list'));
  END IF;
END$$;
