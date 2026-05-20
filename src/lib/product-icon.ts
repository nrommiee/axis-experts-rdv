import { Building2, Home, Bed, Store, Warehouse, type LucideIcon } from "lucide-react";

export function getProductIcon(defaultCode: string): LucideIcon {
  if (/_A0|_KOT|STUDIO/i.test(defaultCode)) return Bed;
  if (/_A[1-9]/.test(defaultCode)) return Building2;
  if (/_M[1-9]|MAISON/i.test(defaultCode)) return Home;
  if (/BUREAU|BUR\.COM/i.test(defaultCode)) return Store;
  if (/COMMUNS/i.test(defaultCode)) return Warehouse;
  return Building2;
}

export function getRoomCount(defaultCode: string): number | null {
  const match = defaultCode.match(/_[AM](\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10) || null;
}
