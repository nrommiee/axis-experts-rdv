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
