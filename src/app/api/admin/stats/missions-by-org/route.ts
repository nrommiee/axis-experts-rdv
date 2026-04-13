import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

interface Organization {
  id: string;
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

    const { data: orgs, error: orgsError } = await admin
      .from("organizations")
      .select("id, odoo_partner_id, odoo_agency_id, client_type");

    if (orgsError) {
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }

    const result: Record<string, { count: number; avgPerMonth: number }> = {};

    // Process orgs sequentially to avoid overloading Odoo XML-RPC
    for (const org of orgs ?? []) {
      try {
        const partnerId = org.odoo_partner_id;
        let domain: unknown[];

        if (org.client_type === "agency" && org.odoo_agency_id) {
          const agents = (await odooExecute(
            "res.partner",
            "search_read",
            [
              [
                ["parent_id", "=", org.odoo_agency_id],
                ["x_studio_agent_partenaire", "=", true],
              ],
            ],
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

        await new Promise((resolve) => setTimeout(resolve, 200));

        // Fetch orders with a date to compute avg per month
        const datedDomain = [
          ...domain,
          ["x_studio_date_prochain_rendez_vous_1", "!=", false],
        ];
        const datedOrders = (await odooExecute(
          "sale.order",
          "search_read",
          [datedDomain],
          { fields: ["x_studio_date_prochain_rendez_vous_1"], limit: 10000 }
        )) as { x_studio_date_prochain_rendez_vous_1: string }[];

        let avgPerMonth = 0;
        if (datedOrders.length > 0) {
          let minMonth: number | null = null;
          let maxMonth: number | null = null;

          for (const order of datedOrders) {
            const raw = order.x_studio_date_prochain_rendez_vous_1;
            if (!raw || raw.length < 10) continue;
            // Format: "DD/MM/YYYY..."
            const day = parseInt(raw.substring(0, 2), 10);
            const month = parseInt(raw.substring(3, 5), 10);
            const year = parseInt(raw.substring(6, 10), 10);
            if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
            const monthVal = year * 12 + (month - 1);
            if (minMonth === null || monthVal < minMonth) minMonth = monthVal;
            if (maxMonth === null || monthVal > maxMonth) maxMonth = monthVal;
          }

          if (minMonth !== null && maxMonth !== null) {
            const spanMonths = Math.max(1, maxMonth - minMonth + 1);
            avgPerMonth =
              Math.round((datedOrders.length / spanMonths) * 10) / 10;
          }
        }

        result[org.id] = { count: totalOrders, avgPerMonth };
      } catch (err) {
        console.error(
          `missions-by-org: failed for org ${org.id}:`,
          err
        );
        result[org.id] = { count: -1, avgPerMonth: 0 };
      }

      // Small delay to avoid overloading Odoo
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/stats/missions-by-org error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
