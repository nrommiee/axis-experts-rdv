-- ============================================================================
-- Migration de donnees : peupler organizations depuis portal_clients
-- Description: Insere les organizations uniques et met a jour les FK
-- Date: 2026-04-13
--
-- IMPORTANT : a executer APRES organizations.sql
-- ============================================================================

-- 1. Inserer les organizations uniques dedupliquees par odoo_partner_id
--    (les 4 lignes actuelles de portal_clients correspondent a 3-4 orgs)

-- Organisation AXIS (odoo_partner_id = 88413, prefix AXIS)
INSERT INTO organizations (name, odoo_partner_id, odoo_template_prefix, client_type, logo_url, product_config)
SELECT
  COALESCE(pc.nom_societe, 'Axis Experts'),
  pc.odoo_partner_id,
  pc.odoo_template_prefix,
  COALESCE(pc.client_type, 'social'),
  pc.logo_url,
  pc.product_config
FROM portal_clients pc
WHERE pc.odoo_partner_id = 88413
LIMIT 1;

-- Organisation EVERECITY (odoo_partner_id = 75694, prefix EVERECITY)
INSERT INTO organizations (name, odoo_partner_id, odoo_template_prefix, client_type, logo_url, product_config)
SELECT
  COALESCE(pc.nom_societe, 'Everecity'),
  pc.odoo_partner_id,
  pc.odoo_template_prefix,
  COALESCE(pc.client_type, 'social'),
  pc.logo_url,
  pc.product_config
FROM portal_clients pc
WHERE pc.odoo_partner_id = 75694
LIMIT 1;

-- Organisation CPASBXL (odoo_partner_id = 77104, prefix CPASBXL)
INSERT INTO organizations (name, odoo_partner_id, odoo_template_prefix, client_type, logo_url, product_config)
SELECT
  COALESCE(pc.nom_societe, 'CPAS de Bruxelles'),
  pc.odoo_partner_id,
  pc.odoo_template_prefix,
  COALESCE(pc.client_type, 'social'),
  pc.logo_url,
  pc.product_config
FROM portal_clients pc
WHERE pc.odoo_partner_id = 77104
LIMIT 1;

-- Organisation odoo_partner_id = 77091 (prefix AXIS, potentiellement une autre societe)
INSERT INTO organizations (name, odoo_partner_id, odoo_agency_id, odoo_template_prefix, client_type, logo_url, product_config)
SELECT
  COALESCE(pc.nom_societe, 'Organisation 77091'),
  pc.odoo_partner_id,
  pc.odoo_agency_id,
  pc.odoo_template_prefix,
  COALESCE(pc.client_type, 'social'),
  pc.logo_url,
  pc.product_config
FROM portal_clients pc
WHERE pc.odoo_partner_id = 77091
LIMIT 1;

-- 2. Mettre a jour portal_clients.organization_id pour chaque ligne existante
UPDATE portal_clients pc
SET organization_id = o.id
FROM organizations o
WHERE o.odoo_partner_id = pc.odoo_partner_id;

-- 3. Verification (a executer pour valider)
-- SELECT pc.id, pc.odoo_partner_id, pc.organization_id, o.name
-- FROM portal_clients pc
-- LEFT JOIN organizations o ON o.id = pc.organization_id;
