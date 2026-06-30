import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooSearch, odooExecute } from "@/lib/odoo";
import { parseRdvDate } from "@/lib/parseRdvDate";
import { resolveAgentAgency } from "@/lib/odoo/resolve-agency";
import { isAgency } from "@/lib/client-type";
import { selectOrderFields, stripOrderAmounts } from "@/lib/agency-amount";

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

    // Phase 0 agences : pour les clients de type 'agency', on résout l'agence
    // EN DIRECT depuis Odoo via l'email de l'agent connecté, puis on filtre sur
    // tous les devis de cette agence (tamponnés via le champ caché OU anciens
    // devis via le parent de l'agent partenaire). Les clients 'social' (défaut)
    // gardent le comportement historique (partner_id == partnerId).
    // Type d'organisation résolu CÔTÉ SERVEUR (session → portal_clients), jamais
    // depuis un paramètre client. Utilisé pour le périmètre de visibilité ET pour
    // le durcissement honoraires (retrait du montant des réponses agence, B7/Lot 2).
    const isAgencyOrg = isAgency(clientRow.client_type);

    let baseDomain: unknown[];
    if (isAgencyOrg) {
      const resolved = await resolveAgentAgency(user.email);

      // SÉCURITÉ : agence non résolue (NOT_FOUND, NO_PARENT, MULTIPLE_MATCHES,
      // PARENT_NOT_COMPANY, EMPTY_EMAIL) → liste VIDE. Jamais de repli sur
      // partner_id ni sur « tout » : zéro fuite inter-agences.
      if (!resolved.ok) {
        return NextResponse.json({ orders: [], total: 0, offset, limit });
      }

      const agencyId = resolved.agencyId;

      baseDomain = [
        "|",
        ["x_studio_many2one_field_4ea_1jrimutbv", "=", agencyId],
        ["x_studio_agence_partenaire.parent_id", "=", agencyId],
      ];
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

    // Durcissement honoraires (B7/Lot 2) : pour une agence, `amount_total` (et
    // tout champ de montant) est retiré de la sélection — il n'est donc même PAS
    // lu côté Odoo ni renvoyé au client. Inchangé pour les organisations non-agence.
    const orderFields = selectOrderFields(
      [
        "id", "name", "date_order", "x_studio_date_prochain_rendez_vous_1",
        "amount_total", "state", "x_studio_type_de_bien_1", "x_studio_suivi_expert",
        "x_studio_adresse_de_mission", "partner_shipping_id",
        "x_studio_partie_2_locataires_", "x_studio_partie_1_bailleurs_", "tag_ids",
      ],
      clientRow.client_type
    );

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

      // Propriétaire (bailleur) name from many2one [id, name] — colonne A3
      // (vue agence). Champ vide côté Odoo (false) => null, cellule vide propre.
      const bail = o.x_studio_partie_1_bailleurs_;
      o.proprietaire_name = Array.isArray(bail) ? bail[1] : null;

      // Address from batch-fetched structured fields
      const shipping = o.partner_shipping_id;
      if (Array.isArray(shipping) && addressMap.has(shipping[0])) {
        o.address_display = addressMap.get(shipping[0])!;
      } else {
        o.address_display = null;
      }

      // Appointment date (char field, parsed via shared util)
      const parsed = parseRdvDate(o.x_studio_date_prochain_rendez_vous_1);
      o.appointment_date = parsed.date;
      o.appointment_time = parsed.time;

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

    // Défense en profondeur : garantit l'absence de tout champ de montant dans la
    // réponse renvoyée à une agence, même si un champ avait été ajouté en aval.
    stripOrderAmounts(orders, clientRow.client_type);

    return NextResponse.json({ orders, total, offset, limit });
  } catch (err) {
    console.error("odoo/orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
