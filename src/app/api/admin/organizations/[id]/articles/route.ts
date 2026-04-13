import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch the organization to get its prefix
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("odoo_template_prefix")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const prefix = org.odoo_template_prefix;

    // Fetch products from product_catalog where odoo_default_code starts with prefix_
    const { data: products, error: productsError } = await admin
      .from("product_catalog")
      .select("id, code, odoo_default_code, label")
      .like("odoo_default_code", `${prefix}_%`)
      .order("odoo_default_code", { ascending: true });

    if (productsError) {
      console.error("[admin/organizations/[id]/articles] query failed:", productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: products ?? [] });
  } catch (err) {
    console.error("GET /api/admin/organizations/[id]/articles error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
