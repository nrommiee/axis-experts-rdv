import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooSearch, odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const q = (searchParams.get("q") || "").trim().slice(0, 100);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("odoo_partner_id, client_type, odoo_agency_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "Client non configuré" },
        { status: 400 }
      );
    }

    const partnerId =
      typeof clientRow.odoo_partner_id === "number"
        ? clientRow.odoo_partner_id
        : parseInt(String(clientRow.odoo_partner_id), 10);

    // Phase 1 agences : pour les clients de type 'agency', on filtre par
    // x_studio_agence_partenaire IN [liste des agents de la société], au lieu
    // du filtre historique partner_id. Les clients 'social' (défaut) gardent
    // le comportement actuel.
    let baseDomain: unknown[];
    if (clientRow.client_type === "agency") {
      const agencyId =
        typeof clientRow.odoo_agency_id === "number"
          ? clientRow.odoo_agency_id
          : parseInt(String(clientRow.odoo_agency_id), 10);

      if (!Number.isFinite(agencyId)) {
        return NextResponse.json(
          { error: "Agence non configurée" },
          { status: 400 }
        );
      }

      const agents = (await odooExecute(
        "res.partner",
        "search_read",
        [[
          ["parent_id", "=", agencyId],
          ["x_studio_agent_partenaire", "=", true],
        ]],
        { fields: ["id"], limit: 100 }
      )) as { id: number }[];

      const agentIds = [
        ...new Set<number>([partnerId, ...agents.map((a) => a.id)]),
      ];

      baseDomain = [["x_studio_agence_partenaire", "in", agentIds]];
    } else {
      baseDomain = [["partner_id", "=", partnerId]];
    }

    let domain: unknown[] = baseDomain;
    if (q) {
      domain = [
        ...baseDomain,
        "|", "|", "|", "|",
        ["name", "ilike", q],
        ["x_studio_partie_2_locataires_.name", "ilike", q],
        ["partner_shipping_id.name", "ilike", q],
        ["partner_shipping_id.street", "ilike", q],
        ["partner_shipping_id.city", "ilike", q],
      ];
    }

    // Get total count for pagination
    const total = await odooExecute("sale.order", "search_count", [domain]) as number;

    const orderFields = [
      "id", "name", "date_order", "x_studio_date_prochain_rendez_vous_1",
      "amount_total", "state", "x_studio_type_de_bien_1", "x_studio_suivi_expert",
      "x_studio_adresse_de_mission", "partner_shipping_id",
      "x_studio_partie_2_locataires_", "tag_ids",
    ];

    const orders = await odooExecute(
      "sale.order", "search_read", [domain],
      { fields: orderFields, limit, offset, order: "date_order desc" }
    ) as Record<string, unknown>[];

    // Collect unique partner_shipping_id IDs to batch-fetch structured addresses
    const shippingIds = [
      ...new Set(
        orders
          .map((o) => o.partner_shipping_id)
          .filter((s): s is [number, string] => Array.isArray(s))
          .map((s) => s[0])
      ),
    ];

    // Batch fetch structured address fields from res.partner
    const addressMap = new Map<number, string>();
    if (shippingIds.length > 0) {
      const partners = await odooSearch(
        "res.partner",
        [["id", "in", shippingIds]],
        ["id", "street", "zip", "city"],
        shippingIds.length
      );
      for (const p of partners) {
        const street = p.street || "";
        const zip = p.zip || "";
        const city = p.city || "";
        if (street || zip || city) {
          addressMap.set(p.id as number, `${street}, ${zip} ${city}`.trim());
        }
      }
    }

    // Collect order ids for batch message/read lookups
    const orderIds = orders.map((o) => o.id as number);

    // Single mail.message call covering all orders on this page
    const lastMessageByOrder = new Map<number, string>();
    if (orderIds.length > 0) {
      const recentMessages = (await odooExecute(
        "mail.message",
        "search_read",
        [[
          ["model", "=", "sale.order"],
          ["res_id", "in", orderIds],
          ["message_type", "in", ["comment", "email"]],
        ]],
        {
          fields: ["id", "res_id", "date"],
          order: "date desc",
          limit: orderIds.length * 10,
        }
      )) as { id: number; res_id: number; date: string }[];

      for (const m of recentMessages) {
        // First hit wins (results are ordered by date desc)
        if (!lastMessageByOrder.has(m.res_id)) {
          lastMessageByOrder.set(m.res_id, m.date);
        }
      }
    }

    // Single Supabase SELECT on portal_message_reads for this user
    const lastReadByOrder = new Map<number, string>();
    if (orderIds.length > 0) {
      const admin = createAdminClient();
      const { data: reads } = await admin
        .from("portal_message_reads")
        .select("odoo_order_id, last_read_at")
        .eq("user_id", user.id);

      if (Array.isArray(reads)) {
        for (const r of reads as { odoo_order_id: number; last_read_at: string }[]) {
          lastReadByOrder.set(r.odoo_order_id, r.last_read_at);
        }
      }
    }

    for (const o of orders) {
      // Locataire name from many2one [id, name]
      const loc = o.x_studio_partie_2_locataires_;
      o.locataire_name = Array.isArray(loc) ? loc[1] : null;

      // Address from batch-fetched structured fields
      const shipping = o.partner_shipping_id;
      if (Array.isArray(shipping) && addressMap.has(shipping[0])) {
        o.address_display = addressMap.get(shipping[0])!;
      } else {
        o.address_display = null;
      }

      // Appointment date (char field, e.g. "DD/MM/YYYY ...")
      const rdvDate = o.x_studio_date_prochain_rendez_vous_1;
      if (rdvDate && typeof rdvDate === "string") {
        o.appointment_date = rdvDate.substring(0, 10);
      } else {
        o.appointment_date = null;
      }

      // Message indicators
      const orderId = o.id as number;
      const hasMessages = lastMessageByOrder.has(orderId);
      o.has_messages = hasMessages;
      if (hasMessages) {
        const lastMsg = lastMessageByOrder.get(orderId)!;
        const lastRead = lastReadByOrder.get(orderId);
        o.has_unread = !lastRead || new Date(lastMsg.replace(" ", "T") + "Z") > new Date(lastRead);
      } else {
        o.has_unread = false;
      }
    }

    return NextResponse.json({ orders, total, offset, limit });
  } catch (err) {
    console.error("odoo/orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
