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

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("id, odoo_partner_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json([]);
    }

    const ids = idsParam
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    // Try sale.order.tag first, then crm.tag
    for (const model of ["sale.order.tag", "crm.tag"]) {
      try {
        const tags = (await odooExecute(model, "search_read", [
          [["id", "in", ids]],
        ], { fields: ["id", "name"] })) as { id: number; name: string }[];
        if (tags.length > 0) {
          return NextResponse.json(tags);
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error("odoo/tags error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
