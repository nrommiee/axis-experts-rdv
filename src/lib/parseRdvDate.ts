/**
 * Parse le champ Odoo CHAR x_studio_date_prochain_rendez_vous_1.
 *
 * Formats acceptés (champ libre côté Odoo, parseur défensif) :
 *   - "DD/MM/YYYY de (HH:MM:SS à HH:MM:SS) (Europe/Brussels)" (nominal)
 *   - "DD/MM/YYYY de (HH:MM à HH:MM) ..." (sans secondes)
 *   - "DD/MM/YYYY" seul (date sans plage horaire)
 *
 * Le parseur est en 2 passes : la date est obligatoire (sinon on
 * retourne tout à null), l'heure est optionnelle.
 *
 * @returns { date, time } où
 *   date = "DD/MM/YYYY" si la chaîne commence bien par cette forme,
 *          sinon null
 *   time = "HH:MM" (heure de début de plage) si présente dans la
 *          chaîne, sinon null
 */
export function parseRdvDate(raw: unknown): {
  date: string | null;
  time: string | null;
} {
  if (!raw || typeof raw !== "string") {
    return { date: null, time: null };
  }

  // Passe 1 — date obligatoire en tête : DD/MM/YYYY
  const dateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) {
    return { date: null, time: null };
  }
  const date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;

  // Passe 2 — heure optionnelle : premier "(HH:MM[:SS]? à ..."
  // Tolère secondes présentes ou absentes, espace variable avant "à"
  const timeMatch = raw.match(/\((\d{2}):(\d{2})(?::\d{2})?\s*à/);
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : null;

  return { date, time };
}
