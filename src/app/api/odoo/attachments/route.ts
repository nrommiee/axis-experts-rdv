import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");
    if (!orderIdParam) {
      return NextResponse.json(
        { error: "orderId requis" },
        { status: 400 }
      );
    }

    const orderId = parseInt(orderIdParam, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "orderId invalide" },
        { status: 400 }
      );
    }

    // Verify the user owns this order via their partner_id
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

    // Check that this sale.order belongs to the authenticated user's partner
    const orderCheck = (await odooExecute(
      "sale.order",
      "search_count",
      [[["id", "=", orderId], ["partner_id", "=", partnerId]]]
    )) as number;

    if (orderCheck === 0) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    const attachments = (await odooExecute(
      "ir.attachment",
      "search_read",
      [[["res_model", "=", "sale.order"], ["res_id", "=", orderId]]],
      {
        fields: ["id", "name", "mimetype", "file_size", "datas"],
        limit: 10,
      }
    )) as { id: number; name: string; mimetype: string; file_size: number; datas: string | false }[];

    const result = attachments.map((a) => ({
      id: a.id,
      name: a.name,
      mimetype: a.mimetype,
      file_size: a.file_size,
      datas: a.datas || null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("odoo/attachments error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
