export const PARTNER_PREFIXES: Record<string, string> = {
  "cpas-bruxelles": "CPASBXL",
};

export function filterProductsByPartner(
  products: { name: string; [key: string]: unknown }[],
  partnerPrefix: string,
): { name: string; [key: string]: unknown }[] {
  return products.filter((p) => p.name.includes(partnerPrefix));
}
