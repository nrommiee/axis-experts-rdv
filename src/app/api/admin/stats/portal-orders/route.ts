import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

interface OdooOrder {
  id: number;
  partner_id: [number, string];
  create_date: string;
  x_studio_agence_partenaire?: [number, string] | false;
}

interface Organization {
  id: string;
  name: string;
  odoo_partner_id: number;
  odoo_agency_id: number | null;
  client_type: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch all active organizations
    const { data: orgs, error: orgsError } = await admin
      .from("organizations")
      .select("id, name, odoo_partner_id, odoo_agency_id, client_type")
      .eq("is_active", true);

    if (orgsError) {
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }

    // Compute the last 12 months
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const startDate = months[0] + "-01";

    // Fetch portal orders from Odoo
    const orders = (await odooExecute(
      "sale.order",
      "search_read",
      [
        [
          ["x_studio_portail_client", "=", true],
          ["create_date", ">=", startDate],
        ],
      ],
      {
        fields: [
          "id",
          "partner_id",
          "create_date",
          "x_studio_agence_partenaire",
        ],
        limit: 5000,
      }
    )) as OdooOrder[];

    // Build mapping: odoo_partner_id -> org name (for social/bailleurs)
    const partnerToOrg = new Map<number, string>();
    // Build mapping: agency agent IDs -> org name (for agencies)
    const agencyOrgs = (orgs ?? []).filter(
      (o: Organization) => o.client_type === "agency" && o.odoo_agency_id
    );

    // For social orgs, map partner_id directly
    for (const org of orgs ?? []) {
      if (org.client_type !== "agency") {
        partnerToOrg.set(org.odoo_partner_id, org.name);
      }
    }

    // For agencies, resolve agents and map x_studio_agence_partenaire
    const agencyAgentToOrg = new Map<number, string>();
    for (const agency of agencyOrgs) {
      // The agency's own partner_id is also valid
      agencyAgentToOrg.set(agency.odoo_partner_id, agency.name);
      try {
        const agents = (await odooExecute(
          "res.partner",
          "search_read",
          [
            [
              ["parent_id", "=", agency.odoo_agency_id],
              ["x_studio_agent_partenaire", "=", true],
            ],
          ],
          { fields: ["id"], limit: 100 }
        )) as { id: number }[];
        for (const agent of agents) {
          agencyAgentToOrg.set(agent.id, agency.name);
        }
      } catch {
        // Skip this agency if Odoo call fails
      }

      // Small delay to avoid overloading Odoo
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Aggregate orders by month and org
    const orgMonthCounts = new Map<string, Map<string, number>>();

    for (const order of orders) {
      const orderMonth = order.create_date.substring(0, 7); // "YYYY-MM"
      if (!months.includes(orderMonth)) continue;

      // Determine which org this order belongs to
      let orgName: string | undefined;

      // Check agency match via x_studio_agence_partenaire
      if (
        order.x_studio_agence_partenaire &&
        Array.isArray(order.x_studio_agence_partenaire)
      ) {
        orgName = agencyAgentToOrg.get(order.x_studio_agence_partenaire[0]);
      }

      // Check partner_id match for social orgs
      if (!orgName && order.partner_id) {
        orgName = partnerToOrg.get(order.partner_id[0]);
      }

      if (!orgName) orgName = "Autre";

      if (!orgMonthCounts.has(orgName)) {
        orgMonthCounts.set(orgName, new Map());
      }
      const monthMap = orgMonthCounts.get(orgName)!;
      monthMap.set(orderMonth, (monthMap.get(orderMonth) ?? 0) + 1);
    }

    // Build series
    const series = Array.from(orgMonthCounts.entries())
      .filter(([name]) => name !== "Autre")
      .map(([name, monthMap]) => ({
        name,
        data: months.map((m) => monthMap.get(m) ?? 0),
      }))
      .sort((a, b) => {
        const totalA = a.data.reduce((s, v) => s + v, 0);
        const totalB = b.data.reduce((s, v) => s + v, 0);
        return totalB - totalA;
      });

    // Add "Autre" at the end if it has data
    if (orgMonthCounts.has("Autre")) {
      const monthMap = orgMonthCounts.get("Autre")!;
      series.push({
        name: "Autre",
        data: months.map((m) => monthMap.get(m) ?? 0),
      });
    }

    return NextResponse.json({
      months,
      series,
      total: orders.length,
    });
  } catch (err) {
    console.error("GET /api/admin/stats/portal-orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
