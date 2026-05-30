import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Route PUBLIQUE — confirme une demande de RDV (lien à usage unique). Passage
// atomique pending -> confirmed via UPDATE ... WHERE status='pending'. AUCUN
// devis Odoo créé à cette étape (odoo_order_id reste null). Le token ne circule
// que dans le body ; jamais renvoyé dans la réponse, jamais loggué.

type ConfirmStatus = "confirmed" | "already" | "expired" | "invalid";

export async function POST(request: NextRequest) {
  try {
    // Rate-limit par IP (anti brute-force de token).
    const ipAddress = extractClientIp(request);
    const rl = await checkRateLimit({
      ipAddress,
      endpoint: "public_rdv_confirm",
      limit: 30,
      windowMinutes: 10,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives, réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const token =
      body && typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { status: "invalid" as ConfirmStatus },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // Mise à jour conditionnelle atomique : seul un appel peut faire passer la
    // ligne de 'pending' à 'confirmed'. Les clics concurrents/répétés mettent
    // à jour 0 ligne -> pas de double traitement.
    const { data: updated, error: updateError } = await admin
      .from("public_rdv_requests")
      .update({ status: "confirmed", confirmed_at: nowIso })
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", nowIso)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[public-rdv] confirm update failed:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la confirmation. Réessayez plus tard." },
        { status: 500 }
      );
    }

    if (updated) {
      return NextResponse.json({ status: "confirmed" as ConfirmStatus });
    }

    // 0 ligne mise à jour : on relit pour classer le cas exact.
    const { data: existing } = await admin
      .from("public_rdv_requests")
      .select("status, expires_at")
      .eq("token", token)
      .maybeSingle();

    let status: ConfirmStatus;
    if (!existing) {
      status = "invalid";
    } else if (existing.status === "confirmed") {
      status = "already";
    } else if (
      existing.status === "expired" ||
      (existing.expires_at && existing.expires_at <= nowIso)
    ) {
      status = "expired";
    } else {
      // 'cancelled' ou autre statut inattendu -> traité comme invalide.
      status = "invalid";
    }

    return NextResponse.json({ status });
  } catch (err) {
    console.error("POST /api/public/rdv/confirm error:", err);
    return NextResponse.json(
      { error: "Erreur interne. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
