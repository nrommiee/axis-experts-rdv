export type ProductConfig = {
  optionKeys: string[]
  labelMap: Record<string, string>
}

export function mapProductName(defaultCode: string, config: ProductConfig): string {
  return config.labelMap[defaultCode] ?? defaultCode
}

export function isOption(defaultCode: string, config: ProductConfig): boolean {
  return config.optionKeys.includes(defaultCode)
}

// ── Dérivations sans product_config (agences / catalogue AXIS partagé) ──
// Les agences n'ont pas de product_config.labelMap : on déduit le statut option
// et le libellé directement du code Odoo et du `name` live, sans casser le
// mapping config-based des clients sociaux ci-dessus.

// Un supplément AXIS est identifié par "_OPT_" dans son default_code
// (ex. AXIS_OPT_FR, AXIS_OPT_METRE).
export function deriveOptionFromCode(defaultCode: string): boolean {
  return defaultCode.includes('_OPT_')
}

// Libellé live = nom Odoo de l'article ; fallback sur le code si absent.
export function deriveDisplayLabel(defaultCode: string, odooName: string | null | undefined): string {
  const name = typeof odooName === 'string' ? odooName.trim() : ''
  return name || defaultCode
}
