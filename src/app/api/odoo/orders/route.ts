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

    const nomSociete = clientRow.nom_societe ? String(clientRow.nom_societe) : "";

    function cleanAddress(raw: string): string {
      // Only strip the exact nom_societe prefix if present
      const prefix = nomSociete + ", ";
      if (raw.startsWith(prefix)) {
        return raw.slice(prefix.length);
      }
      return raw;
    }

    for (const o of orders) {
      // Locataire name from many2one [id, name]
      const loc = o.x_studio_partie_2_locataires_;
      o.locataire_name = Array.isArray(loc) ? loc[1] : null;

      // Address: prefer x_studio_adresse_de_mission, fall back to partner_shipping_id
      const addr = o.x_studio_adresse_de_mission;
      const shipping = o.partner_shipping_id;
      if (Array.isArray(addr) && typeof addr[1] === "string") {
        o.address_display = cleanAddress(addr[1]);
      } else if (Array.isArray(shipping) && typeof shipping[1] === "string") {
        o.address_display = cleanAddress(shipping[1]);
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
