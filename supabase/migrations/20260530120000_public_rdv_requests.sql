-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE (après validation)
-- Fondation publique RDV — tampon des demandes en attente de confirmation
-- Date : 2026-05-30
--
-- ISOLATION : aucune FK vers auth.users, aucune dépendance à portal_clients /
-- organizations, RLS activée, AUCUNE policy anon/authenticated. L'accès se fait
-- EXCLUSIVEMENT côté serveur via la clé service_role (qui contourne la RLS),
-- exactement comme public.audit_log. "Deny by default" pour tout le reste.
-- AUCUN ALTER / DROP sur une table existante.

CREATE TABLE IF NOT EXISTS public.public_rdv_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jeton opaque transmis dans le lien de confirmation e-mail.
  token         uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Cycle de vie de la demande : pending -> confirmed | expired | cancelled.
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),

  -- Charge utile du formulaire public (champs libres, validés côté serveur).
  form_data     jsonb NOT NULL,

  -- Coordonnées dénormalisées pour l'envoi d'e-mail et le suivi.
  email         text,
  phone         text,

  -- Expiration du tampon : posée par le code à l'insertion à expires_at = now()
  -- + 72h. Au-delà, la demande non confirmée est caduque (passée à 'expired'
  -- par le cron). NB : valeur calculée applicativement, pas de DEFAULT SQL ici.
  expires_at    timestamptz NOT NULL,
  confirmed_at  timestamptz,

  -- Suivi des rappels déjà envoyés au client, pour que le cron ne les renvoie
  -- pas en boucle. Compteur de paliers franchis : 0 = aucun rappel, 1 = 1er
  -- rappel (+24h) envoyé, 2 = 2e rappel (+48h) envoyé. Forme la plus simple
  -- (un seul entier monotone) car les rappels sont strictement séquentiels
  -- dans le temps : le cron envoie le palier N+1 uniquement si reminders_sent = N.
  -- Pas besoin d'un tableau de paliers, l'ordre étant garanti.
  reminders_sent smallint NOT NULL DEFAULT 0,

  -- Renseigné UNIQUEMENT après confirmation, quand le sale.order Odoo est créé.
  odoo_order_id bigint,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Séquence de relance prévue (gérée plus tard par le cron, HORS de cette étape).
-- Le cron balaye les demandes status = 'pending' et agit selon l'âge :
--   +24h sans confirmation -> 1er rappel client (email), reminders_sent: 0 -> 1
--   +48h sans confirmation -> 2e rappel client (email),  reminders_sent: 1 -> 2
--   +72h sans confirmation (expires_at atteint) -> status = 'expired', plus d'envoi
-- reminders_sent évite tout double envoi ; expires_at borne la fin de vie.

-- Recherche par jeton (lien de confirmation) — unique.
CREATE UNIQUE INDEX IF NOT EXISTS public_rdv_requests_token_idx
  ON public.public_rdv_requests (token);

-- Balayage par le cron : demandes en attente à relancer / expirer.
CREATE INDEX IF NOT EXISTS public_rdv_requests_status_expires_idx
  ON public.public_rdv_requests (status, expires_at);

-- RLS activée, "deny by default".
ALTER TABLE public.public_rdv_requests ENABLE ROW LEVEL SECURITY;

-- AUCUNE policy anon / authenticated. Policy service_role explicite, calquée sur
-- public.audit_log (le service_role contourne déjà la RLS ; policy explicite =
-- intention documentée). Le portail privé n'a aucun accès à cette table.
CREATE POLICY "service_role_can_do_anything_public_rdv"
  ON public.public_rdv_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.public_rdv_requests IS
  'Tampon des demandes de RDV publiques (sans login) en attente de confirmation. '
  'Aucun couplage au portail privé. Accès server-only (service_role). '
  'Expiration 72h. Rappels +24h/+48h suivis via reminders_sent (cron, étape ultérieure). '
  'Conservation : purge des demandes expirées/non confirmées à définir en étape ultérieure.';
