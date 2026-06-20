import { odooSearch } from "@/lib/odoo";

/**
 * Phase 0 — Portail "agences", PR 1/2 (tamponnage).
 *
 * Résout, à partir de l'EMAIL de l'agent connecté, sa fiche individuelle
 * (res.partner agent) ET la société agence à laquelle il est rattaché
 * (son parent_id, qui doit être une société).
 *
 * Ce module est purement additif : il ne touche pas au filtre d'affichage.
 */

/** Champ Odoo "many2one" sérialisé : `[id, display_name]` ou `false`. */
export type OdooMany2One = [number, string] | false;

/** Sous-ensemble des champs res.partner utilisés ici. */
export type AgentPartnerRecord = {
  id: number;
  name?: string;
  email?: string | false;
  is_company?: boolean;
  parent_id?: OdooMany2One;
};

export type ParentPartnerRecord = {
  id: number;
  is_company?: boolean;
};

export type ResolveAgencyFailureReason =
  | "EMPTY_EMAIL"
  | "NOT_FOUND"
  | "MULTIPLE_MATCHES"
  | "NO_PARENT"
  | "PARENT_NOT_COMPANY";

export type ResolveAgencyResult =
  | { ok: true; agentContactId: number; agencyId: number }
  | { ok: false; reason: ResolveAgencyFailureReason };

/**
 * Sélectionne la fiche agent unique parmi les résultats de recherche.
 * - 0 résultat  → NOT_FOUND
 * - >1 résultat → MULTIPLE_MATCHES (email ambigu, on ne devine pas)
 * - 1 résultat  → ok
 */
export function selectAgent(
  records: AgentPartnerRecord[]
):
  | { ok: true; agent: AgentPartnerRecord }
  | { ok: false; reason: Extract<ResolveAgencyFailureReason, "NOT_FOUND" | "MULTIPLE_MATCHES"> } {
  if (records.length === 0) return { ok: false, reason: "NOT_FOUND" };
  if (records.length > 1) return { ok: false, reason: "MULTIPLE_MATCHES" };
  return { ok: true, agent: records[0] };
}

/**
 * Extrait l'ID de la société agence depuis le parent_id de l'agent.
 * Retourne null si l'agent n'a pas de parent (parent_id = false).
 */
export function getParentId(agent: AgentPartnerRecord): number | null {
  const parent = agent.parent_id;
  if (!parent || !Array.isArray(parent)) return null;
  const id = parent[0];
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

/**
 * Valide que le parent de l'agent est bien une société et construit le
 * résultat de succès. Logique pure (testable sans Odoo).
 */
export function validateParent(
  agent: AgentPartnerRecord,
  parentRecord: ParentPartnerRecord | null
): ResolveAgencyResult {
  const parentId = getParentId(agent);
  if (parentId === null) return { ok: false, reason: "NO_PARENT" };
  if (!parentRecord || parentRecord.is_company !== true) {
    return { ok: false, reason: "PARENT_NOT_COMPANY" };
  }
  return { ok: true, agentContactId: agent.id, agencyId: parentId };
}

/**
 * Résout l'agence d'un agent à partir de son email (insensible à la casse).
 *
 * Ne throw pas : retourne toujours un statut explicite afin que l'appelant
 * puisse retomber sur le comportement actuel en cas d'échec.
 */
export async function resolveAgentAgency(
  userEmail: string | null | undefined
): Promise<ResolveAgencyResult> {
  const email = (userEmail ?? "").trim();
  if (!email) return { ok: false, reason: "EMPTY_EMAIL" };

  // Match email INSENSIBLE À LA CASSE et exact via "=ilike" (sans wildcard,
  // "=ilike" se comporte comme une égalité insensible à la casse).
  const agents = (await odooSearch(
    "res.partner",
    [
      ["email", "=ilike", email],
      ["x_studio_agent_partenaire", "=", true],
    ],
    ["id", "name", "parent_id", "is_company", "email"],
    2
  )) as AgentPartnerRecord[];

  const selection = selectAgent(agents);
  if (!selection.ok) return selection;

  const agent = selection.agent;
  const parentId = getParentId(agent);
  if (parentId === null) return { ok: false, reason: "NO_PARENT" };

  // Vérifie que le parent est bien une société (is_company = true).
  const parents = (await odooSearch(
    "res.partner",
    [["id", "=", parentId]],
    ["id", "is_company"],
    1
  )) as ParentPartnerRecord[];

  return validateParent(agent, parents[0] ?? null);
}
