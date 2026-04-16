-- ============================================================================
-- Migration: rdv_drafts organization sharing
-- Description: Ajoute organization_id et created_by a rdv_drafts pour partager
--              les brouillons entre membres d'une meme organisation.
-- Date: 2026-04-16
--
-- IMPORTANT : a copier-coller manuellement dans le SQL Editor Supabase.
--             NE PAS executer via `supabase db push`.
-- ============================================================================

-- Ajout organization_id
ALTER TABLE rdv_drafts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Ajout created_by
ALTER TABLE rdv_drafts
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Backfill organization_id et created_by depuis portal_clients
UPDATE rdv_drafts d
SET
  organization_id = pc.organization_id,
  created_by      = d.user_id
FROM portal_clients pc
WHERE pc.user_id = d.user_id;

-- Index pour les lectures par org
CREATE INDEX IF NOT EXISTS rdv_drafts_organization_id_idx
  ON rdv_drafts (organization_id);

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Users can CRUD own drafts" ON rdv_drafts;

-- Nouvelle policy SELECT : tous les membres de la meme org
CREATE POLICY "Org members can view drafts"
  ON rdv_drafts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients
      WHERE user_id = auth.uid()
    )
  );

-- Nouvelle policy INSERT : forcer organization_id + created_by au uid courant
CREATE POLICY "Org members can insert drafts"
  ON rdv_drafts FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM portal_clients
      WHERE user_id = auth.uid()
    )
  );

-- Nouvelle policy UPDATE : membres de l'org peuvent editer
CREATE POLICY "Org members can update drafts"
  ON rdv_drafts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM portal_clients
      WHERE user_id = auth.uid()
    )
  );

-- Nouvelle policy DELETE : membres de l'org peuvent supprimer
CREATE POLICY "Org members can delete drafts"
  ON rdv_drafts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM portal_clients
      WHERE user_id = auth.uid()
    )
  );
