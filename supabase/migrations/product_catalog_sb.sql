-- ============================================================================
-- Migration: product_catalog — Articles Sambre Et Biesme (prefix SB)
-- Description: Ajouter les 16 articles EDL Entree/Sortie pour le prefix SB
-- Date: 2026-04-13
-- ============================================================================

INSERT INTO product_catalog (code, odoo_default_code, label) VALUES
  -- EDL Entree
  ('ELE_A1', 'SB_ELE_A1', 'EDL Entree - Appartement 1 chambre'),
  ('ELE_A2', 'SB_ELE_A2', 'EDL Entree - Appartement 2 chambres'),
  ('ELE_A3', 'SB_ELE_A3', 'EDL Entree - Appartement 3 chambres'),
  ('ELE_M1', 'SB_ELE_M1', 'EDL Entree - Maison 1 chambre'),
  ('ELE_M2', 'SB_ELE_M2', 'EDL Entree - Maison 2 chambres'),
  ('ELE_M3', 'SB_ELE_M3', 'EDL Entree - Maison 3 chambres'),
  ('ELE_M4', 'SB_ELE_M4', 'EDL Entree - Maison 4 chambres'),
  ('ELE_M5', 'SB_ELE_M5', 'EDL Entree - Maison 5 chambres'),
  -- EDL Sortie
  ('ELS_A1', 'SB_ELS_A1', 'EDL Sortie - Appartement 1 chambre'),
  ('ELS_A2', 'SB_ELS_A2', 'EDL Sortie - Appartement 2 chambres'),
  ('ELS_A3', 'SB_ELS_A3', 'EDL Sortie - Appartement 3 chambres'),
  ('ELS_M1', 'SB_ELS_M1', 'EDL Sortie - Maison 1 chambre'),
  ('ELS_M2', 'SB_ELS_M2', 'EDL Sortie - Maison 2 chambres'),
  ('ELS_M3', 'SB_ELS_M3', 'EDL Sortie - Maison 3 chambres'),
  ('ELS_M4', 'SB_ELS_M4', 'EDL Sortie - Maison 4 chambres'),
  ('ELS_M5', 'SB_ELS_M5', 'EDL Sortie - Maison 5 chambres')
ON CONFLICT (odoo_default_code) DO NOTHING;
