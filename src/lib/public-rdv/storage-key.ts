// Génération de clés de stockage SÛRES pour le bucket "rdv-documents" côté
// navigateur (parcours /demande : submit + brouillon).
//
// Supabase Storage REJETTE toute clé d'objet contenant des caractères non-ASCII
// (accents, etc.) avec une erreur déterministe « Invalid key » (HTTP 400). Le nom
// d'origine du client (ex. « Déclaration de libération de la garantie locative.docx »)
// ne doit donc JAMAIS servir de clé. On génère une clé opaque `{uuid}.{ext}` et on
// conserve le nom lisible séparément (métadonnée / nom de la pièce jointe Odoo).

// Extension normalisée (ASCII, minuscules, alphanumérique) dérivée d'un nom de
// fichier. Retourne "" si aucune extension exploitable.
export function safeExtension(filename: string): string {
  const raw = filename.split(".").pop() ?? "";
  if (raw === filename) return ""; // pas de "." dans le nom
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned;
}

// Segment terminal opaque et ASCII-safe d'une clé de stockage : `{uuid}.{ext}`.
// Le nom d'origine n'entre jamais dans la clé.
export function buildStorageObjectName(filename: string): string {
  const ext = safeExtension(filename);
  const uuid = crypto.randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

// Classe une erreur d'upload Supabase Storage pour décider du message utilisateur.
// - retryable=true  : problème transitoire (réseau, coupure) → proposer « réessayer ».
// - retryable=false : rejet déterministe (droits, quota, requête invalide) → un
//   nouvel essai à l'identique échouera pareil ; ne pas suggérer « réessayer ».
export function classifyUploadError(error: unknown): {
  retryable: boolean;
  detail: string;
} {
  const err = error as { message?: unknown; statusCode?: unknown; status?: unknown } | null;
  const message = typeof err?.message === "string" ? err.message : String(error ?? "");
  const rawStatus = err?.statusCode ?? err?.status;
  const status = typeof rawStatus === "string" ? Number.parseInt(rawStatus, 10) : rawStatus;

  const lower = message.toLowerCase();
  const looksNetwork =
    status === undefined ||
    Number.isNaN(status as number) ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("connection") ||
    (typeof status === "number" && status >= 500);

  return { retryable: looksNetwork, detail: message };
}
