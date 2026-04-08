export function filterProductsByPartner(
  products: any[],
  prefix: string
): any[] {
  return products.filter(p =>
    p.default_code && p.default_code.startsWith(prefix)
  )
}
