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
        "amount_total",
        "state",
        "x_studio_type_de_bien_1",
        "x_studio_statut_rdv_expert",
        "x_studio_adresse_de_mission",
        "tag_ids",
      ],
      50
    );

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
