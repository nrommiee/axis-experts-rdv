// Règle unique de lecture du flag `require_tenant_name` (organizations /
// portal_clients). Le nom + prénom du locataire est OBLIGATOIRE par défaut.
//
//   NULL / undefined / true  => OBLIGATOIRE (rétrocompatible : comportement
//                                historique inchangé pour les orgs existantes)
//   false explicite          => OPTIONNEL
//
// Centralisé ici pour éviter toute divergence entre le front (demande, modal),
// le back (submit-rdv) et l'admin.
export function isTenantNameRequired(
  value: boolean | null | undefined
): boolean {
  return value !== false;
}
