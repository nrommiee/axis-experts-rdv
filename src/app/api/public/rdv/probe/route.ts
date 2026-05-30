import { NextResponse, type NextRequest } from "next/server";
import { odooExecute } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lecteur de découverte Odoo (PREVIEW UNIQUEMENT) — fige les valeurs techniques
// nécessaires à l'étape 2a (validation par les parties) AVANT de coder le reste.
// Ne modifie RIEN dans Odoo : uniquement des fields_get (lecture de métadonnées).
//
// Sécurité (double verrou identique aux crons publics) :
//   - bypass autorisé seulement si VERCEL_ENV !== "production" ET ?probe=roles ;
//   - sinon Bearer CRON_SECRET obligatoire (et en prod, le bypass est
//     inatteignable -> le probe ne peut jamais s'exécuter sans le secret).

// fields_get(model, [champs]) -> métadonnées { type, string, selection? }.
async function fieldsGet(
  model: string,
  fields: string[]
): Promise<Record<string, unknown>> {
  const res = await odooExecute(model, "fields_get", [fields], {
    attributes: ["type", "string", "selection"],
  });
  return (res ?? {}) as Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  // ── Auth ──
  const isProd = process.env.VERCEL_ENV === "production";
  const isPreviewProbe =
    !isProd && request.nextUrl.searchParams.get("probe") === "roles";

  if (!isPreviewProbe) {
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = process.env.CRON_SECRET;
    if (
      !expected ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.slice(7) !== expected
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Hors preview-probe, on refuse aussi : ce lecteur est un outil de preview.
    if (isProd) {
      return NextResponse.json(
        { error: "Probe disabled in production." },
        { status: 403 }
      );
    }
  }

  try {
    // 1. res.partner : rôle de notification (valeurs techniques de la sélection).
    const partnerFields = await fieldsGet("res.partner", [
      "x_studio_rle_notification_rdv",
    ]);

    // 2. sale.order : statut métier + champs de confirmation par partie.
    const orderFields = await fieldsGet("sale.order", [
      "x_studio_suivi_expert",
      "x_studio_proposition_envoye",
      "x_studio_partie_1_bailleurs_",
      "x_studio_partie_2_locataires_",
      "x_studio_partie_1_bailleurs_confirm",
      "x_studio_partie_2_locataires_confirm",
      "x_studio_partie_1_bailleurs_confirm_le_1",
      "x_studio_partie_2_locataires_confirm_le_1",
      "x_studio_date_prochain_rendez_vous_1",
    ]);

    return NextResponse.json(
      {
        ok: true,
        env: process.env.VERCEL_ENV ?? "unknown",
        note: "Lecture seule (fields_get). Aucune écriture Odoo.",
        res_partner: partnerFields,
        sale_order: orderFields,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/public/rdv/probe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne." },
      { status: 500 }
    );
  }
}
