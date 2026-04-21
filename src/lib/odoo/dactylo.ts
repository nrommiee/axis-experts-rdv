import { odooExecute } from "@/lib/odoo";

// Hard safety limit — pagination not implemented yet. If we start routinely
// hitting this, the Passe 5 plan mentions lifting it or paginating.
export const DACTYLO_ORDERS_LIMIT = 200;

// Odoo value of the "Suivi expert" Studio field that marks a quote as
// "waiting for the dactylo team".
const DACTYLO_STATUS_VALUE = "Dactylo";

// TODO(passe 5): verify xmlrpc@1.3.2 correctly encodes accented domain values
// like "A vérifier par expert" before shipping status transition logic.

export interface DactyloOrder {
  id: number;
  name: string;
  partner_name: string | null;
  mission_address: string;
  expert_name: string | null;
  type_de_bien: string | null;
  tags: string[];
  next_rdv: string | null;
  date_order: string | null;
  create_date: string | null;
}

type Many2One = [number, string] | false | null | undefined;

interface RawOrder {
  id: number;
  name: string;
  partner_id: Many2One;
  partner_shipping_id: Many2One;
  x_studio_expert_externe_: Many2One;
  x_studio_type_de_bien_1: string | false;
  tag_ids: number[] | false;
  x_studio_date_prochain_rendez_vous_1: string | false;
  date_order: string | false;
  create_date: string | false;
}

interface RawPartner {
  id: number;
  street: string | false;
  street2: string | false;
  zip: string | false;
  city: string | false;
}

interface RawTag {
  id: number;
  name: string;
}

const ORDER_FIELDS = [
  "id",
  "name",
  "partner_id",
  "partner_shipping_id",
  "x_studio_expert_externe_",
  "x_studio_type_de_bien_1",
  "tag_ids",
  "x_studio_date_prochain_rendez_vous_1",
  "date_order",
  "create_date",
];

function many2oneName(v: Many2One): string | null {
  return Array.isArray(v) ? v[1] : null;
}

function many2oneId(v: Many2One): number | null {
  return Array.isArray(v) ? v[0] : null;
}

function charOrNull(v: string | false): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function formatAddress(p: RawPartner | undefined): string {
  if (!p) return "Adresse non renseignée";
  const street = (typeof p.street === "string" ? p.street : "").trim();
  const street2 = (typeof p.street2 === "string" ? p.street2 : "").trim();
  const zip = (typeof p.zip === "string" ? p.zip : "").trim();
  const city = (typeof p.city === "string" ? p.city : "").trim();

  if (!street && !street2 && !zip && !city) return "Adresse non renseignée";

  const streetPart = [street, street2].filter(Boolean).join(", ");
  const cityPart = [zip, city].filter(Boolean).join(" ");
  return [streetPart, cityPart].filter(Boolean).join(", ");
}

/**
 * Returns every sale.order whose `x_studio_suivi_expert` equals "Dactylo",
 * across all client organizations. Performs up to 3 Odoo round-trips:
 *   1. search_read on sale.order (hard capped at DACTYLO_ORDERS_LIMIT)
 *   2. batch search_read on res.partner for shipping addresses
 *   3. batch search_read on crm.tag for tag names
 * Missing many2one values and empty fields are mapped to sensible fallbacks
 * (null or "Adresse non renseignée") — never throws on a missing field.
 */
export async function listOrdersInDactyloStatus(): Promise<DactyloOrder[]> {
  const rawOrders = (await odooExecute(
    "sale.order",
    "search_read",
    [[["x_studio_suivi_expert", "=", DACTYLO_STATUS_VALUE]]],
    {
      fields: ORDER_FIELDS,
      limit: DACTYLO_ORDERS_LIMIT,
      order: "create_date desc",
    }
  )) as RawOrder[];

  if (rawOrders.length >= DACTYLO_ORDERS_LIMIT) {
    console.warn(
      `[dactylo/orders] Hit hard limit of ${DACTYLO_ORDERS_LIMIT} orders. Pagination needed.`
    );
  }

  const shippingIds = [
    ...new Set(
      rawOrders
        .map((o) => many2oneId(o.partner_shipping_id))
        .filter((id): id is number => typeof id === "number")
    ),
  ];

  const addressMap = new Map<number, RawPartner>();
  if (shippingIds.length > 0) {
    const partners = (await odooExecute(
      "res.partner",
      "search_read",
      [[["id", "in", shippingIds]]],
      { fields: ["id", "street", "street2", "zip", "city"] }
    )) as RawPartner[];
    for (const p of partners) addressMap.set(p.id, p);
  }

  const tagIds = [
    ...new Set(
      rawOrders.flatMap((o) => (Array.isArray(o.tag_ids) ? o.tag_ids : []))
    ),
  ];

  const tagMap = new Map<number, string>();
  if (tagIds.length > 0) {
    const tags = (await odooExecute(
      "crm.tag",
      "search_read",
      [[["id", "in", tagIds]]],
      { fields: ["id", "name"] }
    )) as RawTag[];
    for (const t of tags) tagMap.set(t.id, t.name);
  }

  return rawOrders.map((o): DactyloOrder => {
    const shippingId = many2oneId(o.partner_shipping_id);
    const partner = shippingId !== null ? addressMap.get(shippingId) : undefined;
    const tagNames = Array.isArray(o.tag_ids)
      ? o.tag_ids.map((id) => tagMap.get(id)).filter((n): n is string => typeof n === "string")
      : [];

    return {
      id: o.id,
      name: o.name,
      partner_name: many2oneName(o.partner_id),
      mission_address: formatAddress(partner),
      expert_name: many2oneName(o.x_studio_expert_externe_),
      type_de_bien: charOrNull(o.x_studio_type_de_bien_1),
      tags: tagNames,
      next_rdv: charOrNull(o.x_studio_date_prochain_rendez_vous_1),
      date_order: charOrNull(o.date_order),
      create_date: charOrNull(o.create_date),
    };
  });
}
