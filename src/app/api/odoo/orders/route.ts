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
      .select("odoo_partner_id")
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

    const orders = await odooSearch(
      "sale.order",
      [["partner_id", "=", partnerId]],
      [
        "id",
        "name",
        "date_order",
        "x_studio_date_prochain_rendez_vous_1",
        "amount_total",
        "state",
        "x_studio_type_de_bien_1",
        "x_studio_suivi_expert",
        "x_studio_adresse_de_mission",
        "partner_shipping_id",
        "x_studio_partie_2_locataires_",
        "tag_ids",
      ],
      50
    );

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
