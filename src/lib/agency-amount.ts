// Durcissement honoraires côté serveur (Lot 2 — suite du masquage visuel B7).
//
// Objectif : pour une organisation AGENCE, le montant des honoraires ne doit
// plus QUITTER le serveur — pas seulement être caché à l'écran. Les routes API
// consommées par le portail ne doivent donc pas inclure les champs de montant
// `sale.order` dans la réponse renvoyée à une agence.
//
// Le type d'organisation est TOUJOURS lu côté serveur (session → `portal_clients`
// ou `organizations`), jamais depuis un paramètre fourni par le client (qui
// serait falsifiable). Ce module ne décide pas du type : il reçoit le
// `clientType` déjà résolu côté serveur et applique la règle `isAgency`.
import { isAgency } from "./client-type";

// Champs « montant / honoraires » d'une `sale.order` à ne jamais exposer à une
// agence. `amount_total` est le champ historiquement renvoyé par le listing ;
// les deux autres sont inclus par prudence (défense en profondeur) si une route
// venait à les demander.
export const ORDER_AMOUNT_FIELDS = [
  "amount_total",
  "amount_untaxed",
  "amount_tax",
] as const;

// Filtre la liste de champs demandée à Odoo : pour une agence, retire tout champ
// de montant afin qu'il ne soit même PAS lu côté Odoo ni renvoyé au client. Pour
// les organisations non-agence, la liste est renvoyée inchangée (montant visible).
export function selectOrderFields(
  fields: readonly string[],
  clientType: string | null | undefined
): string[] {
  if (!isAgency(clientType)) return [...fields];
  const amount = new Set<string>(ORDER_AMOUNT_FIELDS);
  return fields.filter((f) => !amount.has(f));
}

// Défense en profondeur : retire les champs de montant des objets commande déjà
// construits, pour une agence. Complète `selectOrderFields` au cas où un champ de
// montant aurait été ajouté en aval. Mutation en place puis renvoi du tableau.
// Pour une organisation non-agence, les objets sont laissés intacts.
export function stripOrderAmounts<T extends Record<string, unknown>>(
  orders: T[],
  clientType: string | null | undefined
): T[] {
  if (!isAgency(clientType)) return orders;
  for (const order of orders) {
    for (const field of ORDER_AMOUNT_FIELDS) {
      delete order[field];
    }
  }
  return orders;
}
