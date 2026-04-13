-- ============================================================================
-- Migration: product_catalog RLS
-- Description: Securiser la table product_catalog (actuellement UNRESTRICTED)
-- Date: 2026-04-13
-- ============================================================================

-- Activer RLS sur product_catalog
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifies peuvent lire le catalogue
CREATE POLICY "Authenticated users can read product catalog"
  ON product_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Seul le service_role peut modifier le catalogue (via admin API)
-- Pas de INSERT/UPDATE/DELETE policy pour les utilisateurs standards
