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
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const attachmentId = parseInt(idParam, 10);
    if (isNaN(attachmentId)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
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

    // Read the attachment with its binary payload
    const rows = (await odooExecute(
      "ir.attachment",
      "search_read",
      [[["id", "=", attachmentId]]],
      {
        fields: ["res_model", "res_id", "name", "mimetype", "datas"],
        limit: 1,
      }
    )) as {
      res_model: string | false;
      res_id: number | false;
      name: string | false;
      mimetype: string | false;
      datas: string | false;
    }[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Pièce jointe introuvable" },
        { status: 404 }
      );
    }

    const att = rows[0];

    if (att.res_model !== "sale.order" || typeof att.res_id !== "number") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Ownership check: this sale.order must belong to the current partner
    const ownCount = (await odooExecute(
      "sale.order",
      "search_count",
      [[["id", "=", att.res_id], ["partner_id", "=", partnerId]]]
    )) as number;

    if (ownCount === 0) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (!att.datas || typeof att.datas !== "string") {
      return NextResponse.json(
        { error: "Pièce jointe vide" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(att.datas, "base64");
    const mimetype =
      typeof att.mimetype === "string" && att.mimetype
        ? att.mimetype
        : "application/octet-stream";
    const rawName =
      typeof att.name === "string" && att.name ? att.name : "fichier";
    // Sanitise filename for the quoted form of Content-Disposition
    const safeName = rawName.replace(/["\\\r\n]/g, "_");
    const encodedName = encodeURIComponent(rawName);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimetype,
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("odoo/attachments/download error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
