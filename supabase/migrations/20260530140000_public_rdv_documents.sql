-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE (après validation)
-- Pièces jointes des demandes de RDV publiques — liaison fichiers <-> demande.
-- Date : 2026-05-30
--
-- Additif et idempotent : ADD COLUMN IF NOT EXISTS, aucune donnée touchée,
-- aucun DROP. Les fichiers sont stockés dans le bucket privé "rdv-documents"
-- sous le préfixe "public/<requestId>/<uuid>.<ext>" (séparés du portail privé).

-- Liste des fichiers stockés pour la demande :
-- [{ "path": "public/<id>/<uuid>.pdf", "name": "bail.pdf", "size": 12345, "mime": "application/pdf" }, ...]
ALTER TABLE public.public_rdv_requests
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Indicateur : au moins un fichier déposé par le client n'a pas pu être stocké
-- (upload échoué). Permet de recontacter le client si un document manque.
ALTER TABLE public.public_rdv_requests
  ADD COLUMN IF NOT EXISTS upload_failed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.public_rdv_requests.documents IS
  'Pièces jointes stockées (bucket privé rdv-documents, préfixe public/). '
  'Données personnelles -> purge des demandes expirées à gérer par cron (étape ultérieure).';
COMMENT ON COLUMN public.public_rdv_requests.upload_failed IS
  'true si au moins un fichier déposé n''a pas pu être stocké (à recontacter).';
