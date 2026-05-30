-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE (après validation)
-- Synchro RDV publics -> agenda Outlook de l'expert (Microsoft Graph, app-only).
-- Date : 2026-05-30
--
-- Lien devis Odoo <-> événement Graph. Idempotence : UNIQUE(odoo_order_id) ->
-- un seul événement par devis. Aucun couplage au portail privé : RLS activée,
-- AUCUNE policy anon (accès server-only via service_role), pas de FK auth.users.

CREATE TABLE IF NOT EXISTS public.outlook_calendar_sync (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Devis Odoo (1 ligne par devis -> pas de double événement).
  odoo_order_id      bigint NOT NULL UNIQUE,

  -- Événement Microsoft Graph créé pour ce devis.
  graph_event_id     text,
  expert_email       text,   -- email résolu de l'expert (agenda cible)
  calendar_owner     text,   -- boîte Graph effectivement écrite (= expert_email)

  -- Anti-MAJ inutile : dernier statut reflété + dernier créneau posé.
  last_synced_status text,
  last_event_start   text,

  -- Cycle de vie de la synchro :
  --   active            : suivi normal (création/MAJ).
  --   manually_deleted  : l'événement a été supprimé dans Outlook -> ne plus recréer.
  --   error             : erreur Graph non transitoire (ex. 403 hors policy).
  sync_state         text NOT NULL DEFAULT 'active'
                     CHECK (sync_state IN ('active', 'manually_deleted', 'error')),
  last_error         text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS outlook_calendar_sync_order_idx
  ON public.outlook_calendar_sync (odoo_order_id);

ALTER TABLE public.outlook_calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_outlook_sync"
  ON public.outlook_calendar_sync FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.outlook_calendar_sync IS
  'Lien devis Odoo <-> événement Outlook (Graph app-only). Accès server-only. '
  'sync_state=manually_deleted -> ne plus recréer ; UNIQUE(odoo_order_id) -> idempotence.';
