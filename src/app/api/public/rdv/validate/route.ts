import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { odooExecute } from "@/lib/odoo";
import { PARTY_FIELDS, odooDatetimeNow, type Party } from "@/lib/public-rdv/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Validation de présence d'UNE partie (clic du lien). Passage atomique
// pending -> confirmed sur public_rdv_party_validations, puis coche la case
// Odoo de CETTE partie + datetime de confirmation. PAS de bascule "RDV confirmé".

type ConfirmStatus = "confirmed" | "already" | "invalid";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = extractClientIp(request);
    const rl = await checkRateLimit({
      ipAddress,
      endpoint: "public_rdv_validate",
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

    // Update atomique : seul le 1er clic gagne (pending -> confirmed).
    const nowIso = new Date().toISOString();
    const { data: won, error: updErr } = await admin
      .from("public_rdv_party_validations")
      .update({ status: "confirmed", confirmed_at: nowIso })
      .eq("token", token)
      .eq("status", "pending")
      .select("odoo_order_id, party")
      .maybeSingle();

    if (updErr) {
      console.error("[public-rdv][validate] update failed:", updErr);
      return NextResponse.json(
        { error: "Erreur lors de la confirmation. Réessayez plus tard." },
        { status: 500 }
      );
    }

    if (won) {
      // Coche la case Odoo de CETTE partie + datetime de confirmation.
      const party = won.party as Party;
      const fields = PARTY_FIELDS[party];
      try {
        await odooExecute("sale.order", "write", [
          [Number(won.odoo_order_id)],
          {
            [fields.confirm]: true,
            [fields.confirmAt]: odooDatetimeNow(),
          },
        ]);
      } catch (e) {
        // La ligne est déjà 'confirmed' côté Supabase ; l'échec Odoo est loggué
        // (rattrapage manuel possible). On renvoie quand même un succès UX.
        console.error("[public-rdv][validate] odoo write failed", {
          orderId: won.odoo_order_id,
          party,
          error: e,
        });
      }
      return NextResponse.json({ status: "confirmed" as ConfirmStatus });
    }

    // 0 ligne mise à jour : déjà confirmée ou token inconnu.
    const { data: existing } = await admin
      .from("public_rdv_party_validations")
      .select("status")
      .eq("token", token)
      .maybeSingle();

    if (existing?.status === "confirmed") {
      return NextResponse.json({ status: "already" as ConfirmStatus });
    }
    return NextResponse.json({ status: "invalid" as ConfirmStatus });
  } catch (err) {
    console.error("POST /api/public/rdv/validate error:", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
