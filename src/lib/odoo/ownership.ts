import { odooExecute } from "@/lib/odoo";
import { resolveAgentAgency } from "@/lib/odoo/resolve-agency";

export type OwnershipClientRow = {
  client_type: string | null;
  odoo_partner_id: number | string | null;
  odoo_agency_id: number | string | null;
  /**
   * Email de l'utilisateur connecté. Requis pour les clients `agency` : c'est
   * la clé de résolution EN DIRECT de l'agence depuis Odoo (même ancrage que le
   * listing /api/odoo/orders). Les autres types de clients ne l'utilisent pas.
   */
  userEmail?: string | null;
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
 * Verify that the given sale.order belongs to the authenticated client.
 *
 * - For `client_type === 'agency'`: l'agence est résolue EN DIRECT depuis Odoo
 *   via l'email de l'utilisateur (`resolveAgentAgency`), exactement comme le
 *   listing /api/odoo/orders. Ownership est accordé quand le devis appartient à
 *   cette agence — soit via le champ caché tampon (`x_studio_many2one_field_4ea_1jrimutbv`),
 *   soit via le parent de l'agent partenaire (`x_studio_agence_partenaire.parent_id`),
 *   ce qui couvre les anciens devis non tamponnés. Agence non résolue → false
 *   (jamais de fallback permissif).
 * - Otherwise (social, dactylo, default): ownership is granted when
 *   `partner_id` matches the client's `odoo_partner_id` (legacy behavior).
 */
export async function verifyOrderOwnership(
  orderId: number,
  clientRow: OwnershipClientRow
): Promise<boolean> {
  if (clientRow.client_type === "agency") {
    // SÉCURITÉ : même ancrage que le listing. Agence non résolue → ownership
    // false, jamais de repli sur partner_id ni de domaine permissif.
    const resolved = await resolveAgentAgency(clientRow.userEmail);
    if (!resolved.ok) return false;

    const agencyId = resolved.agencyId;
    const count = (await odooExecute(
      "sale.order",
      "search_count",
      [
        [
          ["id", "=", orderId],
          "|",
          ["x_studio_many2one_field_4ea_1jrimutbv", "=", agencyId],
          ["x_studio_agence_partenaire.parent_id", "=", agencyId],
        ],
      ]
    )) as number;
    return count > 0;
  }

  const partnerId = toInt(clientRow.odoo_partner_id);
  if (partnerId === null) return false;

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
