import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { publicRdvSchema } from "@/lib/public-rdv/schema";
import { buildPublicRdvConfirmEmail } from "@/lib/email-templates/public-rdv-confirm";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Route PUBLIQUE (sans login) — enregistre une demande de RDV "pending" et
// envoie l'email de confirmation (double opt-in). NE crée AUCUN devis Odoo et
// NE fait AUCUN dédoublonnage de contact (ce sera la branche confirmation).

const MAX_BODY_BYTES = 50_000;
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

    // 2. Lecture + garde-fou taille.
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Requête trop volumineuse." },
        { status: 413 }
      );
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    // 3. Validation stricte (Zod). Pas de dump complet, pas de secret.
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

    // 4. Insert dans public_rdv_requests via service_role (contourne la RLS).
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

    // 5. Lien de confirmation : NEXT_PUBLIC_SITE_URL si défini, sinon origin de
    // la requête (même pattern que /api/admin/invite). La page /confirmer/[token]
    // sera codée à la branche suivante.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(request.url).origin;
    const confirmUrl = `${baseUrl}/confirmer/${inserted.token}`;

    // 6. Email de confirmation. sendEmail ne throw jamais (renvoie {success}).
    // Si l'envoi échoue, la demande reste enregistrée (pending) → 200 + log
    // serveur clair (la relance des emails échoués = cron, hors de cette branche).
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
      console.error(
        "[public-rdv] confirmation email failed to send:",
        { requestId: inserted.id, error: emailResult.error }
      );
    }

    // 7. Réponse propre. On ne révèle ni le token ni l'email envoyé.
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/public/rdv error:", err);
    return NextResponse.json(
      { error: "Erreur interne. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
