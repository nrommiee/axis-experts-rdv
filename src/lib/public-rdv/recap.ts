// Construction des lignes de récapitulatif de la confirmation à partir de
// form_data (payload validé stocké à la soumission). Fonctions pures, sans I/O.
// Les noms bailleur/locataire ne sont pas collectés à la soumission -> non
// affichés (hors périmètre). Champs manquants -> lignes omises proprement.

const MISSION_LABEL: Record<string, string> = {
  ELLE: "État des lieux d'entrée",
  ELLS: "État des lieux de sortie",
};

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison / Villa",
  studio: "Studio",
  kot: "Kot / Chambre étudiant",
};

const HORAIRE_LABEL: Record<string, string> = {
  Matin: "matin",
  "Après-midi": "après-midi",
  Indifférent: "indifférent",
};

export interface RecapLine {
  label: string;
  value: string;
}

export interface PublicRdvRecap {
  missionLabel: string;
  bienLabel: string;
  lines: RecapLine[];
  price: { perParty: number; total: number } | null;
}

function ddmmyyyy(ymd: string): string {
  // ymd = "AAAA-MM-JJ" -> "JJ/MM/AAAA"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

// form_data est un jsonb : on type prudemment en accès souple.
type FormData = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function buildRecap(formData: FormData): PublicRdvRecap {
  const mission = str(formData.mission);
  const missionLabel = MISSION_LABEL[mission] ?? "—";

  const propertyType = str(formData.propertyType);
  const chambres =
    typeof formData.chambres === "number" ? formData.chambres : null;
  const typeLabel = TYPE_LABEL[propertyType] ?? "";
  const showChambres = propertyType === "appartement" || propertyType === "maison";
  const bienLabel =
    typeLabel + (showChambres && chambres ? ` · ${chambres} ch.` : "");

  const lines: RecapLine[] = [];
  lines.push({ label: "Mission", value: missionLabel });
  if (bienLabel.trim()) lines.push({ label: "Bien", value: bienLabel });

  // Adresse
  const addr = (formData.address ?? {}) as Record<string, unknown>;
  const rueNum = [str(addr.rue), str(addr.num)].filter(Boolean).join(" ");
  const bte = str(addr.bte) ? `bte ${str(addr.bte)}` : "";
  const cpVille = [str(addr.cp), str(addr.ville)].filter(Boolean).join(" ");
  const adresse = [rueNum, bte, cpVille].filter(Boolean).join(", ");
  if (adresse) lines.push({ label: "Adresse", value: adresse });

  // Disponibilités
  const avail = (formData.availability ?? {}) as Record<string, unknown>;
  const d1 = str(avail.dateDebut);
  const d2 = str(avail.dateFin);
  const horaireRaw = str(avail.horaire);
  const horaire = HORAIRE_LABEL[horaireRaw] ?? horaireRaw.toLowerCase();
  if (d1) {
    let dispo = "";
    if (d2 && d2 !== d1) dispo = `Du ${ddmmyyyy(d1)} au ${ddmmyyyy(d2)}`;
    else dispo = `Le ${ddmmyyyy(d1)}`;
    if (horaire) dispo += ` · ${horaire}`;
    lines.push({ label: "Disponibilités", value: dispo });
  }

  // Prix (depuis estimate, pas de recalcul Odoo)
  const est = (formData.estimate ?? {}) as Record<string, unknown>;
  const devis = est.devis === true;
  let price: { perParty: number; total: number } | null = null;
  if (
    !devis &&
    typeof est.perParty === "number" &&
    typeof est.total === "number"
  ) {
    price = { perParty: est.perParty, total: est.total };
  }

  return { missionLabel, bienLabel, lines, price };
}
