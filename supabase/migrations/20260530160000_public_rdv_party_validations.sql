-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE (après validation)
-- Validation par les parties (étape 2a) — registre token -> (commande, partie).
-- Date : 2026-05-30
--
-- Relie chaque lien de validation unique à UNE partie précise d'un sale.order.
-- La source de vérité de la confirmation reste Odoo (cases x_studio_*_confirm) ;
-- cette table route le token vers la bonne partie, garantit l'usage unique et
-- l'anti-doublon d'envoi. Aucun couplage au portail privé : RLS activée, AUCUNE
-- policy anon (accès server-only via service_role), pas de FK vers auth.users.

CREATE TABLE IF NOT EXISTS public.public_rdv_party_validations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Devis Odoo concerné + partie ('p1' = bailleur, 'p2' = locataire).
  odoo_order_id   bigint NOT NULL,
  party           text NOT NULL CHECK (party IN ('p1', 'p2')),

  -- Jeton opaque transmis dans le lien email (par partie).
  token           uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Rôle figé au moment de l'envoi ('Doit valider' / 'Informé seulement').
  role            text,

  -- Cycle de vie : pending -> confirmed (clic du lien).
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed')),

  -- Snapshots pour un rendu figé de la page (indépendant d'Odoo).
  rdv_date_string text,
  email           text,

  confirmed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Une seule entrée par (commande, partie) -> upsert idempotent.
  UNIQUE (odoo_order_id, party)
);

-- Recherche par jeton (page de validation) — unique.
CREATE UNIQUE INDEX IF NOT EXISTS public_rdv_party_validations_token_idx
  ON public.public_rdv_party_validations (token);

-- Recherche par commande (guetteur / suivi).
CREATE INDEX IF NOT EXISTS public_rdv_party_validations_order_idx
  ON public.public_rdv_party_validations (odoo_order_id);

ALTER TABLE public.public_rdv_party_validations ENABLE ROW LEVEL SECURITY;

-- AUCUNE policy anon. Policy service_role explicite (calquée sur audit_log /
-- public_rdv_requests). Le portail privé n'a aucun accès à cette table.
CREATE POLICY "service_role_can_do_anything_party_validations"
  ON public.public_rdv_party_validations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.public_rdv_party_validations IS
  'Liens de validation de présence par partie (public). Token -> (sale.order, p1/p2). '
  'Source de vérité de la confirmation = Odoo (x_studio_*_confirm). Accès server-only.';
