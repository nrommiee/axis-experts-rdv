import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

interface CatalogRow {
  code: string;
  odoo_default_code: string;
  label: string;
}

interface OdooProduct {
  default_code: string | false;
  list_price: number;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("product_catalog")
      .select("code, odoo_default_code, label");

    if (error) {
      console.error("GET /api/agency/price-catalog supabase error:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement du catalogue" },
        { status: 500 }
      );
    }

    const catalog = (rows ?? []) as CatalogRow[];
    const allDefaultCodes = catalog
      .map((r) => r.odoo_default_code)
      .filter((c): c is string => typeof c === "string" && c.length > 0);

    let odooProducts: OdooProduct[] = [];
    if (allDefaultCodes.length > 0) {
      odooProducts = (await odooExecute(
        "product.template",
        "search_read",
        [[
          ["default_code", "in", allDefaultCodes],
          ["active", "=", true],
        ]],
        { fields: ["default_code", "list_price"], limit: 100 }
      )) as OdooProduct[];
    }

    const priceByCode = new Map<string, number>();
    for (const p of odooProducts) {
      if (typeof p.default_code === "string") {
        priceByCode.set(p.default_code, Number(p.list_price) || 0);
      }
    }

    const map: Record<
      string,
      { odoo_default_code: string; label: string; price: number }
    > = {};
    for (const row of catalog) {
      map[row.code] = {
        odoo_default_code: row.odoo_default_code,
        label: row.label,
        price: priceByCode.get(row.odoo_default_code) ?? 0,
      };
    }

    return NextResponse.json(map, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("GET /api/agency/price-catalog error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
