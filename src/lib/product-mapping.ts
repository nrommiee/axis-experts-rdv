const NAME_RULES: { test: RegExp; label: string }[] = [
  { test: /A0|Studio/i, label: "Studio" },
  { test: /A1|1\s*chambre/i, label: "Appartement 1 chambre" },
  { test: /A2|2\s*chambres/i, label: "Appartement 2 chambres" },
  { test: /A3/i, label: "Appartement 3 chambres" },
  { test: /A4/i, label: "Appartement 4 chambres" },
  { test: /A5/i, label: "Appartement 5 chambres" },
  { test: /Maison/i, label: "Maison" },
  { test: /Bureau|Commerce/i, label: "Bureau / Commerce" },
  { test: /m[eé]tr[eé]/i, label: "Metré" },
  { test: /NL/, label: "Version NL" },
  { test: /communs/i, label: "Communs" },
];

export function mapProductName(odooName: string): string {
  for (const rule of NAME_RULES) {
    if (rule.test.test(odooName)) return rule.label;
  }
  return odooName;
}

const OPTION_PATTERNS = [/m[eé]tr[eé]/i, /NL/, /communs/i, /d[eé]placement\s+inutile/i];

export function isMainProduct(odooName: string): boolean {
  return !OPTION_PATTERNS.some((p) => p.test(odooName));
}

export function isOption(odooName: string): boolean {
  return !isMainProduct(odooName);
}
