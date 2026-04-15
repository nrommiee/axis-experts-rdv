-- ============================================================================
-- Migration: custom_fields per organization
-- Description: Bibliothèque globale de champs personnalisés, activation par
--              organisation et stockage des valeurs par RDV (jamais envoyé a Odoo).
-- Date: 2026-04-15
-- ============================================================================

-- 1. Bibliothèque globale de champs personnalisés
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  field_key TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date', 'select')),
  options JSONB DEFAULT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('entree', 'sortie', 'both')),
  description TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activation d'un champ par organisation
CREATE TABLE organization_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, custom_field_id)
);

CREATE INDEX idx_organization_custom_fields_org ON organization_custom_fields(organization_id);

-- 3. Valeurs par RDV (liées à un order_ref Odoo)
CREATE TABLE rdv_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  order_ref TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, custom_field_id, order_ref)
);

CREATE INDEX idx_rdv_custom_values_org_order ON rdv_custom_values(organization_id, order_ref);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_custom_values ENABLE ROW LEVEL SECURITY;

-- custom_fields: SELECT for all authenticated users
CREATE POLICY "Authenticated users can read custom_fields"
  ON custom_fields FOR SELECT
  TO authenticated
  USING (true);

-- organization_custom_fields: users can only read rows for their organization
CREATE POLICY "Authenticated users can read their org custom fields activation"
  ON organization_custom_fields FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()
    )
  );

-- rdv_custom_values: users can read/insert/update rows for their organization
CREATE POLICY "Authenticated users can read their org rdv custom values"
  ON rdv_custom_values FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert rdv custom values for their org"
  ON rdv_custom_values FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update their org rdv custom values"
  ON rdv_custom_values FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM portal_clients WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS automatically — no policy needed for admin API.

-- ============================================================================
-- Seed: bibliothèque de champs Everecity
-- ============================================================================

INSERT INTO custom_fields (field_key, label, field_type, options, mission_type) VALUES
  ('n_archi', 'N° Archi', 'text', NULL, 'entree'),
  ('n_lgt', 'N° Logement', 'text', NULL, 'entree'),
  ('etage', 'Étage', 'number', NULL, 'entree'),
  ('type_lgmt', 'Type logement', 'select', '["A","M"]'::jsonb, 'both'),
  ('vivaqua', 'Vivaqua', 'boolean', NULL, 'both'),
  ('n_parking', 'N° Parking', 'text', NULL, 'entree'),
  ('date_fin_tvx', 'Date fin de travaux', 'date', NULL, 'entree'),
  ('n_tiers', 'N° Tiers', 'text', NULL, 'sortie'),
  ('motif_depart', 'Motif de départ', 'select', '["Renon","Home","Mutation"]'::jsonb, 'sortie'),
  ('garage_cave', 'Garage/Cave', 'text', NULL, 'sortie'),
  ('doc_demission', 'Doc démission parts sociales', 'boolean', NULL, 'sortie'),
  ('badge', 'Badge', 'boolean', NULL, 'sortie'),
  ('date_entree_logement', 'Date d''entrée dans le logement', 'date', NULL, 'sortie'),
  ('date_els', 'Date ELS', 'date', NULL, 'sortie'),
  ('remarques', 'Remarques', 'text', NULL, 'both')
ON CONFLICT (field_key) DO NOTHING;
