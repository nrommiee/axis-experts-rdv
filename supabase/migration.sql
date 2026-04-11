-- Table portal_clients : lie les utilisateurs Supabase Auth aux données Odoo
CREATE TABLE IF NOT EXISTS public.portal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  odoo_partner_id INTEGER NOT NULL,
  odoo_template_prefix TEXT NOT NULL, -- 'CPASBXL', 'AXIS', etc.
  nom_societe TEXT,
  nom_bailleur TEXT,
  email_bailleur TEXT,
  telephone_bailleur TEXT,
  product_config JSONB,            -- configuration produits (optionKeys, labelMap)
  logo_url TEXT,                    -- URL ou chemin vers le logo du client
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS : chaque utilisateur ne voit que sa propre ligne
ALTER TABLE public.portal_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own client data"
  ON public.portal_clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own client data"
  ON public.portal_clients
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index pour les lookups par user_id
CREATE INDEX IF NOT EXISTS idx_portal_clients_user_id ON public.portal_clients(user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_clients_updated_at
  BEFORE UPDATE ON public.portal_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Migration : ajouter nom_societe si la table existe déjà
ALTER TABLE public.portal_clients ADD COLUMN IF NOT EXISTS nom_societe TEXT;

-- Migration : ajouter product_config si la table existe déjà
ALTER TABLE public.portal_clients ADD COLUMN IF NOT EXISTS product_config JSONB;

-- Migration : ajouter logo_url si la table existe déjà
ALTER TABLE public.portal_clients ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Migration : ajouter odoo_contact_partner_id (documentation uniquement, ne pas exécuter automatiquement)
-- Ce champ contient le partner_id Odoo de la personne physique de contact
-- (ex: Julie MiCHAUX), différent de odoo_partner_id qui est la société
-- (ex: EVERECITY SC).
ALTER TABLE portal_clients
ADD COLUMN IF NOT EXISTS odoo_contact_partner_id INTEGER;

-- =============================
-- Phase 1 : module agences immobilières (documentation uniquement)
-- =============================
-- client_type distingue les clients sociaux (CPAS, communes, etc.) des agences
-- immobilières. Les agences voient les commandes filtrées par
-- x_studio_agence_partenaire (IN liste des agents de la société) au lieu du
-- filtre partner_id classique.
--   - 'social' (défaut) : comportement historique, filtre par partner_id
--   - 'agency'          : filtre par x_studio_agence_partenaire IN agentIds
ALTER TABLE portal_clients
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'social';

-- odoo_agency_id : partner_id Odoo de la société agence parente.
-- Utilisé uniquement pour client_type = 'agency'. On recherche ensuite tous les
-- res.partner dont parent_id = odoo_agency_id ET x_studio_agent_partenaire = true
-- pour obtenir la liste des agents de l'agence.
-- NULL pour les clients sociaux.
ALTER TABLE portal_clients
ADD COLUMN IF NOT EXISTS odoo_agency_id INTEGER;

-- Correction : mettre à jour odoo_partner_id pour CPAS BXL
UPDATE public.portal_clients SET odoo_partner_id = 77104 WHERE odoo_template_prefix = 'CPASBXL';

-- Exemple INSERT de test (à adapter avec le vrai user_id)
-- INSERT INTO public.portal_clients (user_id, odoo_partner_id, odoo_template_prefix, nom_societe, nom_bailleur, email_bailleur, telephone_bailleur)
-- VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 77104, 'CPASBXL', 'CPAS de Bruxelles', 'CPAS Bruxelles', 'contact@cpasbxl.be', '+32 2 123 45 67');

-- =============================
-- Supabase Storage : bucket pour les documents RDV
-- =============================
-- À créer via le dashboard Supabase > Storage > New Bucket :
--   Nom : rdv-documents
--   Public : false (privé)
--
-- Puis ajouter cette policy RLS sur le bucket (via SQL Editor) :

-- Permettre aux utilisateurs authentifiés d'uploader dans leur dossier
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rdv-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permettre au service role de lire tous les fichiers (pour l'API)
-- Note : le service role bypass déjà RLS, cette policy est pour la lecture côté serveur via anon key
CREATE POLICY "Authenticated users can read own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'rdv-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
