import { odooExecute } from "@/lib/odoo";

export type OwnershipClientRow = {
  client_type: string | null;
  odoo_partner_id: number | string | null;
  odoo_agency_id: number | string | null;
};

function toInt(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Returns the list of partner IDs whose sale.order are accessible to an
 * agency client. Mirrors the logic used in /api/odoo/orders for the
 * `x_studio_agence_partenaire IN [...]` filter.
 */
export async function getAgentIdsForAgency(
  agencyId: number,
  partnerId: number
): Promise<number[]> {
  const agents = (await odooExecute(
    "res.partner",
    "search_read",
    [
      [
        ["parent_id", "=", agencyId],
        ["x_studio_agent_partenaire", "=", true],
      ],
    ],
    { fields: ["id"], limit: 100 }
  )) as { id: number }[];

  return [...new Set<number>([partnerId, ...agents.map((a) => a.id)])];
}

/**
 * Verify that the given sale.order belongs to the authenticated client.
 *
 * - For `client_type === 'agency'`: ownership is granted when the order's
 *   `x_studio_agence_partenaire` is one of the agency's agents (including the
 *   client's own partner_id), matching the listing filter in /api/odoo/orders.
 * - Otherwise (social, dactylo, default): ownership is granted when
 *   `partner_id` matches the client's `odoo_partner_id` (legacy behavior).
 */
export async function verifyOrderOwnership(
  orderId: number,
  clientRow: OwnershipClientRow
): Promise<boolean> {
  const partnerId = toInt(clientRow.odoo_partner_id);
  if (partnerId === null) return false;

  if (clientRow.client_type === "agency") {
    const agencyId = toInt(clientRow.odoo_agency_id);
    if (agencyId === null) return false;

    const agentIds = await getAgentIdsForAgency(agencyId, partnerId);
    const count = (await odooExecute(
      "sale.order",
      "search_count",
      [
        [
          ["id", "=", orderId],
          ["x_studio_agence_partenaire", "in", agentIds],
        ],
      ]
    )) as number;
    return count > 0;
  }

  const count = (await odooExecute(
    "sale.order",
    "search_count",
    [
      [
        ["id", "=", orderId],
        ["partner_id", "=", partnerId],
      ],
    ]
  )) as number;
  return count > 0;
}
