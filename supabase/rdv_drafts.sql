-- ============================================================
-- Table: rdv_drafts — Brouillons de demandes de rendez-vous
-- À exécuter manuellement dans le SQL Editor Supabase
-- ============================================================

CREATE TABLE rdv_drafts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT,
  form_data       JSONB NOT NULL,
  selected_product  JSONB,
  selected_options  JSONB DEFAULT '[]'::jsonb,
  current_step      INT DEFAULT 0,
  document_paths    JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rdv_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own drafts"
  ON rdv_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rdv_drafts_user_id ON rdv_drafts(user_id);
