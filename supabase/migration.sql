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

-- Exemple INSERT de test (à adapter avec le vrai user_id)
-- INSERT INTO public.portal_clients (user_id, odoo_partner_id, odoo_template_prefix, nom_societe, nom_bailleur, email_bailleur, telephone_bailleur)
-- VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 60713, 'CPASBXL', 'CPAS de Bruxelles', 'CPAS Bruxelles', 'contact@cpasbxl.be', '+32 2 123 45 67');
