import { NextResponse, type NextRequest } from "next/server";
import { odooExecute } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lecteur de découverte Odoo (PREVIEW UNIQUEMENT) — résout l'email de l'expert
// d'un devis depuis x_studio_expert_externe_ (many2one -> res.partner.email),
// AVANT de coder la synchro Outlook. Lecture seule (read), aucune écriture.
//
// Sécurité (double verrou identique aux crons/probe publics) :
//   - bypass autorisé seulement si VERCEL_ENV !== "production" ET ?probe=expert ;
//   - sinon Bearer CRON_SECRET ; désactivé en production.
//
// Usage : /api/public/rdv/outlook-probe?probe=expert&order=<odoo_order_id>

function ensureInt(v: unknown): number | null {
  if (Array.isArray(v)) return Number(v[0]);
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

interface OrderRow {
  id: number;
  name: string | false;
  x_studio_suivi_expert: string | false;
  x_studio_expert_externe_: [number, string] | false;
  x_studio_date_prochain_rendez_vous_1: string | false;
}

interface PartnerRow {
  id: number;
  name: string | false;
  email: string | false;
}

export async function GET(request: NextRequest) {
  // ── Auth ──
  const isProd = process.env.VERCEL_ENV === "production";
  const isPreviewProbe =
    !isProd && request.nextUrl.searchParams.get("probe") === "expert";

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
    if (isProd) {
      return NextResponse.json(
        { error: "Probe disabled in production." },
        { status: 403 }
      );
    }
  }

  try {
    // 1. Devis ciblé : paramètre ?order=<id>, sinon 1er devis public confirmé.
    const orderParam = request.nextUrl.searchParams.get("order");
    let orderId = orderParam ? ensureInt(orderParam) : null;

    if (!orderId) {
      // À défaut, prend le dernier devis public confirmé (commodité de test).
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data } = await admin
        .from("public_rdv_requests")
        .select("odoo_order_id")
        .eq("status", "confirmed")
        .not("odoo_order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      orderId = data?.odoo_order_id ? Number(data.odoo_order_id) : null;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Aucun devis cible. Passez ?order=<odoo_order_id>." },
        { status: 400 }
      );
    }

    // 2. Lecture du devis (champ expert + contexte).
    const orders = (await odooExecute("sale.order", "read", [[orderId]], {
      fields: [
        "id",
        "name",
        "x_studio_suivi_expert",
        "x_studio_expert_externe_",
        "x_studio_date_prochain_rendez_vous_1",
      ],
    })) as unknown as OrderRow[];

    const order = orders?.[0];
    if (!order) {
      return NextResponse.json(
        { error: `Devis ${orderId} introuvable dans Odoo.` },
        { status: 404 }
      );
    }

    const expertField = order.x_studio_expert_externe_;
    const expertPartnerId = ensureInt(expertField);
    const expertNameFromOrder = Array.isArray(expertField)
      ? expertField[1] ?? null
      : null;

    // 3. Résolution de l'email via res.partner (le many2one ne porte que le nom).
    let expertEmail: string | null = null;
    let expertName: string | null = expertNameFromOrder;
    if (expertPartnerId) {
      const partners = (await odooExecute(
        "res.partner",
        "read",
        [[expertPartnerId]],
        { fields: ["id", "name", "email"] }
      )) as unknown as PartnerRow[];
      const p = partners?.[0];
      if (p) {
        expertEmail = str(p.email) || null;
        expertName = str(p.name) || expertName;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        env: process.env.VERCEL_ENV ?? "unknown",
        note: "Lecture seule. x_studio_expert_externe_ = many2one ; email résolu via res.partner.",
        order: {
          id: order.id,
          name: order.name || null,
          suivi_expert: str(order.x_studio_suivi_expert) || null,
          date_prochain_rendez_vous_1:
            str(order.x_studio_date_prochain_rendez_vous_1) || null,
        },
        expert: {
          partner_id: expertPartnerId,
          name: expertName,
          email: expertEmail,
          has_email: Boolean(expertEmail),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/public/rdv/outlook-probe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne." },
      { status: 500 }
    );
  }
}
