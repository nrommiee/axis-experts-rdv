-- Migration : ajouter la colonne product_config (JSONB) à portal_clients
-- À exécuter manuellement dans le SQL Editor Supabase si la table existe déjà.
--
-- Structure attendue de product_config :
-- {
--   "optionKeys": ["OPT_FR", "OPT_NL", "OPT_METRE"],
--   "labelMap": {
--     "ELLE_A0": "Studio",
--     "ELLE_A1": "App 1ch",
--     ...
--   }
-- }

ALTER TABLE public.portal_clients ADD COLUMN IF NOT EXISTS product_config JSONB;
