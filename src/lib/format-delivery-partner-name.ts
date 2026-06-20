/**
 * Construit le NOM (titre) d'un res.partner d'adresse de livraison Odoo.
 *
 * Format cible : "CP VILLE, RUE, NUMERO, BOÎTE"
 *   ex. complet     -> "1200 Woluwé, Avenue Ariane, 4, Apt 511"
 *       sans boîte  -> "1200 Woluwé, Avenue Ariane, 4"
 *       sans numéro -> "1200 Woluwé, Avenue Ariane"
 *
 * La boîte est affichée TELLE QUE SAISIE (aucun préfixe forcé).
 * Les segments vides/null/undefined sont filtrés : jamais de virgule
 * orpheline ni de "undefined" dans le résultat.
 */
export function formatDeliveryPartnerName({
  rue,
  numero,
  boite,
  codePostal,
  ville,
}: {
  rue?: string | number | null;
  numero?: string | number | null;
  boite?: string | number | null;
  codePostal?: string | number | null;
  ville?: string | number | null;
}): string {
  const cpVille = [codePostal, ville]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .join(" ")
    .trim();

  const segments = [cpVille, rue, numero, boite]
    .filter((s) => s != null && String(s).trim() !== "")
    .map((s) => String(s).trim());

  return segments.join(", ");
}
