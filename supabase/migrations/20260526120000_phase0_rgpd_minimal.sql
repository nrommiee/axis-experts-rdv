-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE
-- Phase 0 RGPD minimal — CGU + audit log
-- Date : 2026-05-26

-- =====================================================
-- Table 1 : journal de consentement CGU
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cgu_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cgu_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_version ON public.user_consents(cgu_version);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_can_read_own_consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_can_insert_own_consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_consents IS 'Journal des acceptations CGU. Conservation : durée du compte + 5 ans après dernière connexion.';

-- =====================================================
-- Table 2 : journal d'audit des actions sensibles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.audit_log(resource_type, resource_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Pas de policy INSERT publique : l'insertion se fait UNIQUEMENT côté serveur avec service_role.
CREATE POLICY "service_role_can_do_anything_audit"
  ON public.audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.audit_log IS 'Journal des actions sensibles. Conservation : 12 mois (cron de purge à mettre en place en Phase 1).';
