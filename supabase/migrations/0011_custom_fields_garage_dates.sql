-- ============================================================================
-- Migration: extension bibliothèque custom_fields
-- Description: Ajoute les champs garage/cave décomposés (present + numéro),
--              date d'entrée, date fin de location, remise des clés.
--              Passe etage et n_tiers à mission_type='both'.
-- Exécution: SQL Editor Supabase (jamais via `supabase db push`).
-- Date: 2026-04-16
-- ============================================================================

INSERT INTO custom_fields (field_key, label, field_type, options, mission_type)
VALUES
  ('date_entree',         'Date d''entrée',         'date',    NULL, 'entree'),
  ('date_fin_location',   'Date fin de location',   'date',    NULL, 'sortie'),
  ('remise_cles',         'Remise des clés',        'boolean', NULL, 'sortie'),
  ('garage_cave_present', 'Garage/Cave',            'boolean', NULL, 'both'),
  ('garage_cave_numero',  'N° Garage/Cave',         'text',    NULL, 'both')
ON CONFLICT (field_key) DO NOTHING;

UPDATE custom_fields SET mission_type = 'both' WHERE field_key = 'etage';
UPDATE custom_fields SET mission_type = 'both' WHERE field_key = 'n_tiers';
