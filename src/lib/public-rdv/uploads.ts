// Garde-fous et stockage des pièces jointes de la demande publique de RDV.
// Route publique anonyme -> validation STRICTE côté serveur. Stockage dans le
// bucket privé "rdv-documents" sous le préfixe "public/<requestId>/<uuid>.<ext>"
// (séparé du portail privé ; le nom client n'entre jamais dans le path).

import { randomUUID } from "crypto";
import { validateMagicBytes } from "@/lib/mime-validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const PUBLIC_BUCKET = "rdv-documents";
export const PUBLIC_PREFIX = "public";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 Mo / fichier
export const MAX_FILES = 10; // par demande
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // garde-fou requête

// Types autorisés UNIQUEMENT : PDF, Word, Excel.
const ALLOWED_EXT = ["pdf", "doc", "docx", "xls", "xlsx"] as const;
type AllowedExt = (typeof ALLOWED_EXT)[number];

const EXT_MIME: Record<AllowedExt, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export interface StoredDocument {
  path: string;
  name: string;
  size: number;
  mime: string;
}

function extOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// Nom d'origine assaini, stocké en MÉTADONNÉE uniquement (jamais dans le path).
// Retire séparateurs de chemin, caractères de contrôle et méta FS ; borne la
// longueur.
export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "fichier";
  let out = "";
  for (const ch of base) {
    const code = ch.charCodeAt(0);
    // Contrôles (0x00-0x1F, 0x7F) et méta de chemin / FS -> "_"
    if (code < 0x20 || code === 0x7f || '<>:"/\\|?*'.includes(ch)) {
      out += "_";
    } else {
      out += ch;
    }
  }
  out = out.trim();
  const safe = out.length > 0 ? out : "fichier";
  return safe.length > 120 ? safe.slice(0, 120) : safe;
}

export type FileValidation =
  | { ok: true; ext: AllowedExt; mime: string }
  | { ok: false; reason: string };

// Valide un fichier : extension allowlist + taille + magic bytes (contenu réel).
export function validateFile(
  filename: string,
  base64Content: string,
  size: number
): FileValidation {
  const ext = extOf(filename);
  if (!(ALLOWED_EXT as readonly string[]).includes(ext)) {
    return { ok: false, reason: `Type non autorisé : ${filename}` };
  }
  if (size > MAX_FILE_BYTES) {
    return { ok: false, reason: `Fichier trop volumineux (max 10 Mo) : ${filename}` };
  }
  if (!validateMagicBytes(filename, base64Content)) {
    return { ok: false, reason: `Contenu de fichier invalide : ${filename}` };
  }
  return { ok: true, ext: ext as AllowedExt, mime: EXT_MIME[ext as AllowedExt] };
}

export interface UploadInput {
  filename: string;
  mime: string;
  ext: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  stored: StoredDocument[];
  failed: boolean; // au moins un fichier n'a pas pu être stocké
}

// Upload service_role sous public/<requestId>/<uuid>.<ext>. Un échec isolé est
// loggué et n'interrompt pas les autres (failed=true). Ne throw jamais.
export async function uploadPublicDocuments(
  requestId: string,
  files: UploadInput[]
): Promise<UploadResult> {
  const admin = createAdminClient();
  const stored: StoredDocument[] = [];
  let failed = false;

  for (const f of files) {
    const path = `${PUBLIC_PREFIX}/${requestId}/${randomUUID()}.${f.ext}`;
    try {
      const { error } = await admin.storage
        .from(PUBLIC_BUCKET)
        .upload(path, f.buffer, { contentType: f.mime, upsert: false });
      if (error) {
        failed = true;
        console.error("[public-rdv] file upload failed", {
          requestId,
          ext: f.ext,
          sizeKb: Math.ceil(f.size / 1024),
          error: error.message,
        });
        continue;
      }
      stored.push({
        path,
        name: sanitizeFilename(f.filename),
        size: f.size,
        mime: f.mime,
      });
    } catch (e) {
      failed = true;
      console.error("[public-rdv] file upload threw", {
        requestId,
        ext: f.ext,
        error: e,
      });
    }
  }

  return { stored, failed };
}
