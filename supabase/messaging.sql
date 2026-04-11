-- Phase 1 messagerie — infrastructure
-- Documentation only: ne pas exécuter tel quel, à appliquer manuellement
-- via la console Supabase ou un script de migration dédié.

CREATE TABLE portal_message_reads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  odoo_order_id integer NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, odoo_order_id)
);

ALTER TABLE portal_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user owns reads" ON portal_message_reads
  FOR ALL USING (auth.uid() = user_id);
