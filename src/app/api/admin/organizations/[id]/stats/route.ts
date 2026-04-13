import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { odooExecute } from "@/lib/odoo";

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

    // Fetch the organization
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("odoo_partner_id, odoo_agency_id, client_type")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const partnerId = org.odoo_partner_id;
    let domain: unknown[];

    if (org.client_type === "agency" && org.odoo_agency_id) {
      // For agencies: find all agents under the agency, then search sale.order
      // by x_studio_agence_partenaire matching any of those agents
      const agents = (await odooExecute(
        "res.partner",
        "search_read",
        [[
          ["parent_id", "=", org.odoo_agency_id],
          ["x_studio_agent_partenaire", "=", true],
        ]],
        { fields: ["id"], limit: 100 }
      )) as { id: number }[];

      const agentIds = [
        ...new Set<number>([partnerId, ...agents.map((a) => a.id)]),
      ];

      domain = [["x_studio_agence_partenaire", "in", agentIds]];
    } else {
      domain = [["partner_id", "=", partnerId]];
    }

    const totalOrders = (await odooExecute(
      "sale.order",
      "search_count",
      [domain]
    )) as number;

    return NextResponse.json({ totalOrders });
  } catch (err) {
    console.error("GET /api/admin/organizations/[id]/stats error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
