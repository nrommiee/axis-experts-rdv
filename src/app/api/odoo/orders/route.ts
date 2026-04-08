import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooSearch } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("odoo_partner_id, nom_societe")
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

    console.log("[odoo/orders] odoo_partner_id from portal_clients:", clientRow.odoo_partner_id, "→ parsed partnerId:", partnerId);

    const domain = [["partner_id", "=", partnerId]];
    const fields = [
      "id",
      "name",
      "date_order",
      "amount_total",
      "state",
      "x_studio_type_de_bien_1",
      "x_studio_suivi_expert",
      "x_studio_adresse_de_mission",
      "x_studio_partie_2_locataires_",
      "tag_ids",
    ];

    console.log("[odoo/orders] search domain:", JSON.stringify(domain));
    console.log("[odoo/orders] requested fields:", JSON.stringify(fields));

    const orders = await odooSearch("sale.order", domain, fields, 50);

    console.log("[odoo/orders] results count:", orders.length);
    if (orders.length > 0) {
      console.log("[odoo/orders] first result sample:", JSON.stringify(orders[0]));
    }

    // Extract locataire_name from many2one [id, name] tuple
    // Extract address_display from many2one [id, name], stripping company name prefix
    const nomSociete = clientRow.nom_societe ? String(clientRow.nom_societe) : "";
    const addrPrefix = nomSociete ? nomSociete + ", " : "";
    for (const o of orders) {
      const loc = o.x_studio_partie_2_locataires_;
      o.locataire_name = Array.isArray(loc) ? loc[1] : null;

      const addr = o.x_studio_adresse_de_mission;
      if (Array.isArray(addr) && typeof addr[1] === "string") {
        const raw = addr[1];
        o.address_display = addrPrefix && raw.startsWith(addrPrefix)
          ? raw.slice(addrPrefix.length)
          : raw;
      } else {
        o.address_display = null;
      }
    }

    // Debug: if 0 results, try broader searches to diagnose the issue
    if (orders.length === 0) {
      console.log("[odoo/orders] 0 results — running diagnostic searches...");

      // 1) Check if ANY orders exist for this partner with no field filter issues
      try {
        const basicOrders = await odooSearch(
          "sale.order",
          [["partner_id", "=", partnerId]],
          ["id", "name", "partner_id", "state"],
          5
        );
        console.log("[odoo/orders] basic search (same partner, fewer fields):", basicOrders.length, "results", basicOrders.length > 0 ? JSON.stringify(basicOrders[0]) : "");
      } catch (diagErr) {
        console.error("[odoo/orders] basic search failed:", diagErr);
      }

      // 2) Fallback: search by name pattern to confirm Odoo connectivity
      try {
        const fallbackOrders = await odooSearch(
          "sale.order",
          [["name", "like", "28"]],
          ["id", "name", "partner_id", "state"],
          5
        );
        console.log("[odoo/orders] fallback search (name like '28'):", fallbackOrders.length, "results", fallbackOrders.length > 0 ? JSON.stringify(fallbackOrders[0]) : "");
      } catch (diagErr) {
        console.error("[odoo/orders] fallback search failed:", diagErr);
      }

      // 3) Check if orders exist with partner_id = 77104 specifically
      try {
        const hardcodedOrders = await odooSearch(
          "sale.order",
          [["partner_id", "=", 77104]],
          ["id", "name", "partner_id", "state"],
          5
        );
        console.log("[odoo/orders] hardcoded partner_id=77104 search:", hardcodedOrders.length, "results", hardcodedOrders.length > 0 ? JSON.stringify(hardcodedOrders[0]) : "");
      } catch (diagErr) {
        console.error("[odoo/orders] hardcoded search failed:", diagErr);
      }
    }

    orders.sort((a, b) => {
      const da = String(a.date_order || "");
      const db = String(b.date_order || "");
      return db.localeCompare(da);
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("odoo/orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
