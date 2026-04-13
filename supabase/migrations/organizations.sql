-- ============================================================================
-- Migration: organizations table
-- Description: Centralise les societes clientes dans une table dediee
-- Date: 2026-04-13
-- ============================================================================

-- 1. Creer la table organizations
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  odoo_partner_id INTEGER NOT NULL,
  odoo_agency_id INTEGER,
  odoo_template_prefix TEXT NOT NULL DEFAULT 'AXIS',
  client_type TEXT NOT NULL DEFAULT 'social' CHECK (client_type IN ('social', 'agency')),
  logo_url TEXT,
  product_config JSONB,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activer RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 3. Policy : les utilisateurs authentifies peuvent lire leur propre organization
CREATE POLICY "Authenticated users can read their organization"
  ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()));

-- 4. Trigger updated_at (reutilise la fonction existante de portal_clients)
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Ajouter organization_id dans portal_clients
ALTER TABLE portal_clients ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 6. Index pour les lookups
CREATE INDEX idx_portal_clients_organization_id ON portal_clients(organization_id);
CREATE INDEX idx_organizations_odoo_partner_id ON organizations(odoo_partner_id);
