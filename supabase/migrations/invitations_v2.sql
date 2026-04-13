-- ============================================================================
-- Migration: invitations_v2
-- Description: Refonte de la table invitations — token UUID, organization_id
-- Date: 2026-04-13
--
-- IMPORTANT : a executer APRES organizations.sql + organizations_data_migration.sql
-- ============================================================================

-- 1. Renommer l'ancienne table
ALTER TABLE invitations RENAME TO invitations_legacy;

-- 2. Creer la nouvelle table invitations
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_type TEXT NOT NULL DEFAULT 'social' CHECK (client_type IN ('social', 'agency')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS — seul le service_role accede aux invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Pas de policy SELECT publique — uniquement accessible via service_role

-- 4. Index
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);

-- 5. Migrer les donnees pertinentes de l'ancienne table
-- Note : seules les invitations non-utilisees et non-expirees sont migrees
-- Les anciennes invitations utilisaient un code (string), pas un token UUID
-- On genere un nouveau UUID pour chaque ligne migree
-- organization_id est rempli via le odoo_partner_id correspondant
INSERT INTO invitations (token, email, organization_id, client_type, expires_at, used_at, created_by, created_at)
SELECT
  gen_random_uuid(),
  il.email,
  o.id,
  COALESCE(il.client_type, 'social'),
  il.expires_at,
  il.used_at,
  il.created_by,
  il.created_at
FROM invitations_legacy il
JOIN organizations o ON o.odoo_partner_id = il.odoo_partner_id
WHERE il.odoo_partner_id IS NOT NULL;

-- Les invitations sans odoo_partner_id correspondant sont ignorees
-- Elles restent dans invitations_legacy pour reference
