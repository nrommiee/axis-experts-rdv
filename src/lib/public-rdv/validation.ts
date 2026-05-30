// Helpers partagés pour la validation par les parties (étape 2a).
// Valeurs techniques Odoo figées (sélections = libellés exacts, accents inclus).

export type Party = "p1" | "p2";

// Rôle de notification (res.partner.x_studio_rle_notification_rdv).
export const ROLE_DOIT_VALIDER = "Doit valider";
export const ROLE_INFORME = "Informé seulement";
export const ROLE_NE_PLUS = "Ne plus notifier";

// Statut métier (sale.order.x_studio_suivi_expert).
export const SUIVI_RDV_PROPOSE = "RDV proposé";
export const SUIVI_RDV_CONFIRME = "RDV confirmé";

// Libellé de la partie pour l'affichage / email.
export const PARTY_LABEL: Record<Party, string> = {
  p1: "Bailleur",
  p2: "Locataire",
};

// Champs Odoo de la partie (lien contact + confirmation + date de confirmation).
export const PARTY_FIELDS: Record<
  Party,
  { link: string; confirm: string; confirmAt: string }
> = {
  p1: {
    link: "x_studio_partie_1_bailleurs_",
    confirm: "x_studio_partie_1_bailleurs_confirm",
    confirmAt: "x_studio_partie_1_bailleurs_confirm_le_1",
  },
  p2: {
    link: "x_studio_partie_2_locataires_",
    confirm: "x_studio_partie_2_locataires_confirm",
    confirmAt: "x_studio_partie_2_locataires_confirm_le_1",
  },
};

// Type de rôle effectif. Défaut public : rôle vide -> "doit valider".
export type EffectiveRole = "valide" | "informe" | "rien";

export function effectiveRole(raw: unknown): EffectiveRole {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === ROLE_NE_PLUS) return "rien";
  if (v === ROLE_INFORME) return "informe";
  // "Doit valider" OU vide/inconnu -> doit valider (défaut public).
  return "valide";
}

// Format DATETIME Odoo (champ *_confirm_le_1) : "YYYY-MM-DD HH:MM:SS" en UTC.
export function odooDatetimeNow(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
  );
}
