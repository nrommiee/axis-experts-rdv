import { NextResponse } from "next/server";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerIdParam = searchParams.get("partnerId");

    if (!partnerIdParam || isNaN(Number(partnerIdParam))) {
      return NextResponse.json(
        { error: "Query parameter 'partnerId' is required and must be numeric." },
        { status: 400 },
      );
    }

    const products = await odooExecute(
      "product.template",
      "search_read",
      [[["sale_ok", "=", true], ["active", "=", true]]],
      { fields: ["id", "name", "list_price", "description_sale", "categ_id"] },
    );

    return NextResponse.json(products);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch products from Odoo";

    const isConnectionError =
      err instanceof Error &&
      (err.message.includes("ECONNREFUSED") ||
        err.message.includes("ENOTFOUND") ||
        err.message.includes("ETIMEDOUT"));

    console.error("GET /api/odoo/products error:", err);

    return NextResponse.json(
      {
        error: isConnectionError
          ? "Odoo server is unreachable. Check ODOO_URL and network connectivity."
          : message,
      },
      { status: 502 },
    );
  }
}
