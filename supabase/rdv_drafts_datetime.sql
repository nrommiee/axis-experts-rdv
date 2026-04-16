-- ============================================================
-- Chantier 3 — Add rdv_datetime column to rdv_drafts
-- À exécuter manuellement dans le SQL Editor Supabase
-- (projet woaxmqckupcgwsjbnlep). NE PAS exécuter automatiquement.
-- ============================================================
-- Backfill lazy : form_data.dateDebut reste source de vérité pour les
-- brouillons antérieurs. On double-écrit form_data.rdv_datetime côté
-- application pendant la transition.
-- ============================================================

ALTER TABLE rdv_drafts
  ADD COLUMN IF NOT EXISTS rdv_datetime TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_drafts_rdv_datetime
  ON rdv_drafts(rdv_datetime)
  WHERE rdv_datetime IS NOT NULL;
