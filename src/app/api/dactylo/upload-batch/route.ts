/**
 * POST /api/dactylo/upload-batch
 *
 * Receives a multipart FormData containing N "lines" (one per sale.order),
 * each with its .docx files. For each line in parallel (max concurrency 3):
 * 1. Verifies the order is still in "Dactylo" status (ownership + race guard)
 * 2. Creates ir.attachment rows linked to the sale.order
 * 3. Transitions sale.order.x_studio_suivi_expert to "A vérifier par expert"
 * On step 3 failure, performs a best-effort ir.attachment cleanup.
 * Returns per-line results — HTTP 200 even with per-line failures.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  MAX_LINES_PER_BATCH,
  processDactyloOrderBatch,
} from "@/lib/odoo/dactylo";
import {
  DOCX_EXTENSION,
  DOCX_MIME,
  MAX_FILE_SIZE,
  MAX_FILES_PER_ROW,
  ZIP_MAGIC,
} from "@/components/dactylo/constants";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DACTYLO_BATCH_CONCURRENCY = 3;

interface LineDecl {
  order_id: number;
  order_name: string;
  file_count: number;
}

interface LinePrepared {
  order_id: number;
  order_name: string;
  files: { name: string; buffer: Buffer }[];
  totalSize: number;
}

interface LineResultSuccess {
  order_id: number;
  order_name: string;
  success: true;
  attachment_ids: number[];
}

interface LineResultFailure {
  order_id: number;
  order_name: string;
  success: false;
  error: string;
}

type LineResult = LineResultSuccess | LineResultFailure;

/**
 * Simple concurrency limiter — processes `items` via `worker`, never running
 * more than `limit` in parallel, preserving per-item ordering in the result.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        try {
          results[i] = { status: "fulfilled", value: await worker(items[i], i) };
        } catch (reason) {
          results[i] = { status: "rejected", reason };
        }
      }
    }
  );
  await Promise.all(runners);
  return results;
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // Recognize specific business errors raised from the helper.
    if (msg.includes("Devis introuvable")) return msg;
    // Everything else is collapsed to avoid leaking internals.
    return "Erreur Odoo lors du traitement";
  }
  return "Erreur inattendue";
}

async function hasDocxMagic(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buf);
    return (
      bytes.length === 4 &&
      bytes[0] === ZIP_MAGIC[0] &&
      bytes[1] === ZIP_MAGIC[1] &&
      bytes[2] === ZIP_MAGIC[2] &&
      bytes[3] === ZIP_MAGIC[3]
    );
  } catch {
    return false;
  }
}

function isValidLineDecl(x: unknown): x is LineDecl {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.order_id === "number" &&
    Number.isInteger(r.order_id) &&
    r.order_id > 0 &&
    typeof r.order_name === "string" &&
    typeof r.file_count === "number" &&
    Number.isInteger(r.file_count) &&
    r.file_count >= 1 &&
    r.file_count <= MAX_FILES_PER_ROW
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (isAdmin(user.email)) {
    return NextResponse.json(
      { error: "Admin cannot access dactylo endpoints" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: clientRow } = await admin
    .from("portal_clients")
    .select("client_type")
    .eq("user_id", user.id)
    .single();

  if (!clientRow) {
    return NextResponse.json(
      { error: "No portal client row" },
      { status: 403 }
    );
  }

  if (clientRow.client_type !== "dactylo") {
    return NextResponse.json(
      { error: "Not a dactylo user" },
      { status: 403 }
    );
  }

  const userEmail = user.email ?? "unknown";
  const userId = user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("[dactylo/upload-batch] formData parse failed:", err);
    return bad("Requête multipart invalide");
  }

  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return bad("Champ payload manquant");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadRaw);
  } catch {
    return bad("Champ payload n'est pas du JSON valide");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { lines?: unknown }).lines)
  ) {
    return bad("Payload doit contenir un tableau lines");
  }

  const rawLines = (parsed as { lines: unknown[] }).lines;

  if (rawLines.length === 0) {
    return bad("Aucune ligne à traiter");
  }
  if (rawLines.length > MAX_LINES_PER_BATCH) {
    return bad(`Maximum ${MAX_LINES_PER_BATCH} lignes par envoi`);
  }

  const lines: LineDecl[] = [];
  const seenOrderIds = new Set<number>();
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    if (!isValidLineDecl(l)) {
      return bad(`Ligne ${i + 1}: structure invalide`);
    }
    if (seenOrderIds.has(l.order_id)) {
      return bad(`Ligne ${i + 1}: order_id ${l.order_id} dupliqué`);
    }
    seenOrderIds.add(l.order_id);
    lines.push(l);
  }

  const prepared: LinePrepared[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const files: { name: string; buffer: Buffer }[] = [];
    let totalSize = 0;
    const seenNames = new Set<string>();
    for (let j = 0; j < line.file_count; j++) {
      const entry = formData.get(`files_${i}_${j}`);
      if (!(entry instanceof File)) {
        return bad(`Ligne ${i + 1}, fichier ${j + 1} manquant dans le payload`);
      }
      const name = entry.name;
      if (!/\.docx$/i.test(name)) {
        return bad(
          `Ligne ${i + 1}, fichier ${j + 1}: extension non autorisée (seul ${DOCX_EXTENSION} accepté)`
        );
      }
      if (entry.type && entry.type !== DOCX_MIME) {
        return bad(`Ligne ${i + 1}, fichier ${j + 1}: type MIME invalide`);
      }
      if (entry.size > MAX_FILE_SIZE) {
        return bad(
          `Ligne ${i + 1}, fichier ${j + 1}: dépasse ${Math.floor(
            MAX_FILE_SIZE / (1024 * 1024)
          )} Mo`
        );
      }
      if (seenNames.has(name)) {
        return bad(
          `Ligne ${i + 1}, fichier ${j + 1}: nom ${name} dupliqué dans la ligne`
        );
      }
      seenNames.add(name);

      const magicOk = await hasDocxMagic(entry);
      if (!magicOk) {
        return bad(
          `Ligne ${i + 1}, fichier ${j + 1}: fichier corrompu ou non .docx`
        );
      }

      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      files.push({ name, buffer });
      totalSize += entry.size;
    }
    prepared.push({
      order_id: line.order_id,
      order_name: line.order_name,
      files,
      totalSize,
    });
  }

  const settled = await mapWithConcurrency(
    prepared,
    DACTYLO_BATCH_CONCURRENCY,
    async (line) => {
      const t0 = Date.now();
      try {
        const { attachmentIds } = await processDactyloOrderBatch(
          line.order_id,
          line.files
        );
        console.log(
          `[dactylo/upload-batch] user=${userEmail} user_id=${userId} order=${line.order_name} files=${line.files.length} size=${formatMb(
            line.totalSize
          )} status=success duration=${Date.now() - t0}ms`
        );
        return { attachmentIds };
      } catch (err) {
        console.error(
          `[dactylo/upload-batch] user=${userEmail} user_id=${userId} order=${line.order_name} files=${line.files.length} size=${formatMb(
            line.totalSize
          )} status=error duration=${Date.now() - t0}ms reason=`,
          err
        );
        throw err;
      }
    }
  );

  const results: LineResult[] = settled.map((s, i) => {
    const line = prepared[i];
    if (s.status === "fulfilled") {
      return {
        order_id: line.order_id,
        order_name: line.order_name,
        success: true,
        attachment_ids: s.value.attachmentIds,
      };
    }
    return {
      order_id: line.order_id,
      order_name: line.order_name,
      success: false,
      error: sanitizeError(s.reason),
    };
  });

  const succeeded = results.filter((r) => r.success).length;
  const summary = {
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
  };

  return NextResponse.json({ results, summary });
}
