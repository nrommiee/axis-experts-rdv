import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { publicRdvSchema } from "@/lib/public-rdv/schema";
import { buildPublicRdvConfirmEmail } from "@/lib/email-templates/public-rdv-confirm";
import { sendEmail } from "@/lib/email";
import {
  validateFile,
  uploadPublicDocuments,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  type UploadInput,
} from "@/lib/public-rdv/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Route PUBLIQUE (sans login) — enregistre une demande de RDV "pending", stocke
// les pièces jointes (bucket privé, préfixe public/) et envoie l'email de
// confirmation (double opt-in). Transport multipart/form-data : champ "payload"
// (JSON) + 0..N champs "files". NE crée AUCUN devis Odoo (étape confirmation).

const MAX_PAYLOAD_BYTES = 50_000;
const EXPIRY_HOURS = 72;

export async function POST(request: NextRequest) {
  try {
    // 1. Rate-limit par IP (pas de session côté public).
    const ipAddress = extractClientIp(request);
    const rl = await checkRateLimit({
      ipAddress,
      endpoint: "public_rdv_submit",
      limit: 5,
      windowMinutes: 10,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de demandes, veuillez réessayer dans quelques minutes." },
        { status: 429 }
      );
    }

    // 2. Lecture multipart/form-data.
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const payloadRaw = formData.get("payload");
    if (typeof payloadRaw !== "string") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    if (payloadRaw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Requête trop volumineuse." },
        { status: 413 }
      );
    }
    let json: unknown;
    try {
      json = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    // 3. Validation stricte du payload (Zod).
    const parsed = publicRdvSchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: "Données invalides.",
          details: first?.message ?? "Vérifiez les champs du formulaire.",
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 4. Validation stricte des fichiers (allowlist + taille + nombre + magic
    // bytes). Parcours de base SANS fichier : la liste est simplement vide.
    const rawFiles = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (rawFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Trop de fichiers (max ${MAX_FILES}).` },
        { status: 400 }
      );
    }

    const uploads: UploadInput[] = [];
    let totalBytes = 0;
    for (const file of rawFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      totalBytes += buffer.byteLength;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { error: "Volume total des fichiers trop important." },
          { status: 413 }
        );
      }
      const base64 = buffer.toString("base64");
      const check = validateFile(file.name, base64, buffer.byteLength);
      if (!check.ok) {
        return NextResponse.json(
          { error: "Fichier invalide.", details: check.reason },
          { status: 400 }
        );
      }
      uploads.push({
        filename: file.name,
        mime: check.mime,
        ext: check.ext,
        buffer,
        size: buffer.byteLength,
      });
    }

    // 5. Insert de la demande (status pending) — fournit requestId pour le path.
    // expires_at = NOW() + 72h, posé par le code (pas de DEFAULT SQL).
    const expiresAt = new Date(
      Date.now() + EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString();

    const admin = createAdminClient();
    const { data: inserted, error: insertError } = await admin
      .from("public_rdv_requests")
      .insert({
        status: "pending",
        form_data: data,
        email: data.email,
        phone: data.phone || null,
        expires_at: expiresAt,
        reminders_sent: 0,
      })
      .select("id, token")
      .single();

    if (insertError || !inserted) {
      console.error("[public-rdv] insert failed:", insertError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer la demande. Réessayez plus tard." },
        { status: 500 }
      );
    }

    // 6. Upload des fichiers (service_role, bucket privé). Un échec n'efface
    // JAMAIS la demande : on loggue et on marque upload_failed pour recontact.
    if (uploads.length > 0) {
      const { stored, failed } = await uploadPublicDocuments(
        inserted.id,
        uploads
      );
      const { error: docErr } = await admin
        .from("public_rdv_requests")
        .update({ documents: stored, upload_failed: failed })
        .eq("id", inserted.id);
      if (docErr) {
        console.error("[public-rdv] failed to store documents metadata", {
          requestId: inserted.id,
          error: docErr.message,
        });
      }
    }

    // 7. Lien de confirmation : NEXT_PUBLIC_SITE_URL si défini, sinon origin.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(request.url).origin;
    const confirmUrl = `${baseUrl}/confirmer/${inserted.token}`;

    // 8. Email de confirmation. sendEmail ne throw jamais. Échec -> 201 + log.
    const adresseCourte = [
      [data.address.rue, data.address.num].filter(Boolean).join(" "),
      [data.address.cp, data.address.ville].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");

    const { subject, html } = buildPublicRdvConfirmEmail({
      confirmUrl,
      nom: data.nom,
      mission: data.mission,
      adresse: adresseCourte,
    });

    const emailResult = await sendEmail({ to: data.email, subject, html });
    if (!emailResult.success) {
      console.error("[public-rdv] confirmation email failed to send:", {
        requestId: inserted.id,
        error: emailResult.error,
      });
    }

    // 9. Réponse propre. On ne révèle ni le token ni l'email envoyé.
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/public/rdv error:", err);
    return NextResponse.json(
      { error: "Erreur interne. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
