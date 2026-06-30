// Règle unique de lecture du type d'organisation (`client_type`).
//
// Le critère « agence » est aujourd'hui dupliqué (~15 emplacements) sous la
// forme littérale `clientType === "agency"`. Ce helper centralise la règle
// pour toute NOUVELLE condition, sur le modèle de `tenant-name.ts`.
//
// NB : la valeur peut provenir de `portal_clients.client_type` (front) ou de
// `organizations.client_type` (back/admin), et vaut `'social' | 'agency' |
// 'dactylo'` (cf. migrations). Seule la valeur exacte `'agency'` est agence.
export function isAgency(
  clientType: string | null | undefined
): boolean {
  return clientType === "agency";
}
