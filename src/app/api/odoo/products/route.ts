import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooExecute } from "@/lib/odoo";
import { filterProductsByPartner } from "@/lib/partner-products";
import { mapProductName, isOption, type ProductConfig } from "@/lib/product-mapping";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("odoo_template_prefix, product_config")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const config = clientRow.product_config as ProductConfig | null;
    if (!config) {
      return NextResponse.json(
        { error: "product_config not configured for this client" },
        { status: 500 }
      );
    }

    const allProducts = await odooExecute(
      "product.template",
      "search_read",
      [[["sale_ok", "=", true], ["active", "=", true]]],
      { fields: ["id", "name", "list_price", "default_code"] }
    ) as { id: number; name: string; list_price: number; default_code: string | false }[];

    const filtered = filterProductsByPartner(allProducts, clientRow.odoo_template_prefix);

    const mapped = filtered.map(p => ({
      id: p.id as number,
      odooName: p.name as string,
      defaultCode: p.default_code as string,
      displayLabel: mapProductName(p.default_code as string, config),
      listPrice: p.list_price as number,
      isOption: isOption(p.default_code as string, config),
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("GET /api/odoo/products error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
