import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit/log-action";
import { validateMagicBytes } from "@/lib/mime-validation";
import {
  bailExtractionSchema,
  bailExtractionJsonSchema,
  BAIL_EXTRACTION_INSTRUCTION,
  type BailExtraction,
} from "@/lib/agency/bail-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Bail = PDF uniquement, ≤ 10 Mo. Extraction coûteuse → rate-limit par utilisateur.
const MAX_BAIL_BYTES = 10 * 1024 * 1024;
const STORAGE_BUCKET = "rdv-documents";

/**
 * Extraction IA d'un bail (agence) → pré-remplissage du formulaire.
 *
 * Réservé aux agences (portal_clients.client_type === "agency").
 * Mode TRANSITOIRE : le fichier est supprimé de Storage après extraction
 * (succès OU échec). Aucune création automatique : l'utilisateur relit/corrige.
 * Aucun appel client : le SDK Anthropic ne s'instancie QUE dans cette route.
 */
export async function POST(request: Request) {
  // ── Auth ──
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // ── Périmètre agence ──
  const { data: clientRow } = await supabase
    .from("portal_clients")
    .select("client_type")
    .eq("user_id", user.id)
    .single();
  if (clientRow?.client_type !== "agency") {
    return NextResponse.json({ error: "Accès réservé aux agences" }, { status: 403 });
  }

  // ── Rate-limit (extraction coûteuse) ──
  const rl = await checkRateLimit({
    userId: user.id,
    endpoint: "agency-extract-bail",
    limit: 10,
    windowMinutes: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard" },
      { status: 429 }
    );
  }

  // ── Réception du CHEMIN (upload direct Storage côté client) ──
  let path: string;
  try {
    const body = await request.json();
    path = typeof body?.path === "string" ? body.path : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!path) {
    return NextResponse.json({ error: "Chemin de fichier manquant" }, { status: 400 });
  }
  // Garde-fou : un client ne peut traiter que SES propres fichiers (cf. submit-rdv).
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "Chemin de fichier non autorisé" },
      { status: 400 }
    );
  }

  const fileName = path.split("/").pop() || "";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const supabaseAdmin = createAdminClient();

  // Suppression TRANSITOIRE : toujours, après extraction (succès ou échec).
  async function cleanup() {
    try {
      if (!path.startsWith(`${user!.id}/`)) return;
      const { error: removeErr } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([path]);
      if (removeErr) {
        console.error(
          `[extract-bail] Storage cleanup failed (non-blocking): ${removeErr.message}`
        );
      }
    } catch (removeThrow) {
      console.error("[extract-bail] Storage cleanup threw (non-blocking)", removeThrow);
    }
  }

  try {
    // ── Allowlist : PDF uniquement ──
    if (ext !== "pdf") {
      return NextResponse.json(
        { error: "Format non supporté : PDF uniquement" },
        { status: 400 }
      );
    }

    // ── Téléchargement depuis Storage ──
    const { data: blob, error: dlError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(path);
    if (dlError || !blob) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    // ── Taille ≤ 10 Mo ──
    if (buffer.byteLength > MAX_BAIL_BYTES) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 Mo)" },
        { status: 400 }
      );
    }

    const base64 = buffer.toString("base64");

    // ── Magic bytes AVANT envoi à Claude (defense-in-depth) ──
    if (!validateMagicBytes(fileName, base64)) {
      return NextResponse.json(
        { error: "Le fichier n'est pas un PDF valide" },
        { status: 400 }
      );
    }

    // ── Clé serveur (jamais NEXT_PUBLIC_) ──
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[extract-bail] ANTHROPIC_API_KEY manquante");
      return NextResponse.json(
        { error: "Lecture automatique indisponible, complète manuellement." },
        { status: 503 }
      );
    }

    // ── Appel API Claude : document PDF AVANT la consigne texte ──
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      output_config: {
        format: { type: "json_schema", schema: bailExtractionJsonSchema },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: BAIL_EXTRACTION_INSTRUCTION },
          ],
        },
      ],
    });

    // ── Vérification du stop_reason ──
    if (response.stop_reason === "refusal") {
      console.error("[extract-bail] refusal", response.stop_details);
      return NextResponse.json(
        { error: "Lecture automatique impossible, complète manuellement." },
        { status: 422 }
      );
    }
    if (response.stop_reason === "max_tokens") {
      console.error("[extract-bail] réponse tronquée (max_tokens)");
      return NextResponse.json(
        { error: "Lecture automatique impossible, complète manuellement." },
        { status: 422 }
      );
    }

    // ── Extraction du JSON ──
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Lecture automatique impossible, complète manuellement." },
        { status: 422 }
      );
    }

    let parsed: BailExtraction;
    try {
      parsed = bailExtractionSchema.parse(JSON.parse(textBlock.text));
    } catch (parseErr) {
      console.error("[extract-bail] parse/validation échouée", parseErr);
      return NextResponse.json(
        { error: "Lecture automatique impossible, complète manuellement." },
        { status: 422 }
      );
    }

    // ── Audit (SANS contenu du bail) ──
    const filledCount =
      Object.values(parsed.proprietaire).filter(Boolean).length +
      Object.values(parsed.locataire).filter(Boolean).length +
      Object.values(parsed.adresseBien).filter(Boolean).length;
    await logAction({
      userId: user.id,
      action: "agency.bail_extract",
      resourceType: "bail",
      metadata: { success: true, fields_filled: filledCount },
    });

    return NextResponse.json({ extraction: parsed });
  } catch (err) {
    console.error("[extract-bail] erreur inattendue", err);
    await logAction({
      userId: user.id,
      action: "agency.bail_extract",
      resourceType: "bail",
      metadata: { success: false },
    });
    return NextResponse.json(
      { error: "Lecture automatique impossible, complète manuellement." },
      { status: 500 }
    );
  } finally {
    // TRANSITOIRE : suppression dans tous les cas.
    await cleanup();
  }
}
