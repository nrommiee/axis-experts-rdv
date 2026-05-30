// Logique de prix de la page publique de RDV — fonctions pures, sans I/O.
// Source de vérité des prix HTVA = Odoo (via /api/public/prices).
// Règle unique (biens ET suppléments) :
//   tvac_par_partie = round(htva × 1,21 ÷ 2)
// Le total mission = somme des deux parties (bailleur + locataire).

export const TVA_RATE = 1.21;

export interface PublicPriceEntry {
  name: string;
  htva: number;
}

export type PublicPrices = Record<string, PublicPriceEntry>;

// TVAC pour UNE partie (bailleur ou locataire), arrondi à l'euro.
// S'applique identiquement à un bien ou à un supplément.
export function tvacPerParty(htva: number): number {
  return Math.round((htva * TVA_RATE) / 2);
}

// Référence Odoo du BIEN à partir de l'état du formulaire.
// size : studio -> "A0", kot -> "K", sinon code type + nb chambres (ex. "A1", "M3").
// ex. AXIS_ELLE_A1, AXIS_ELLS_M3, AXIS_ELLE_A0 (studio), AXIS_ELLE_K (kot).
export function bienRef(
  mission: string,
  tcode: string,
  chambres: number
): string {
  const size = tcode === "S" ? "A0" : tcode === "K" ? "K" : `${tcode}${chambres}`;
  return `AXIS_${mission}_${size}`;
}

// Référence Odoo d'un SUPPLÉMENT (article AXIS_OPT_*).
export function optionRef(key: string): string {
  return `AXIS_OPT_${key.toUpperCase()}`;
}
