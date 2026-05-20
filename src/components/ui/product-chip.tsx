"use client";

import { Building2, Home, Bed, Store, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductChipProps {
  product: { id: number | string; defaultCode: string; displayLabel: string };
  selected: boolean;
  onClick: () => void;
}

function ProductIcon({ defaultCode, className }: { defaultCode: string; className?: string }) {
  if (/_A0|_KOT|STUDIO/i.test(defaultCode)) return <Bed className={className} />;
  if (/_A[1-9]/.test(defaultCode)) return <Building2 className={className} />;
  if (/_M[1-9]|MAISON/i.test(defaultCode)) return <Home className={className} />;
  if (/BUREAU|BUR\.COM/i.test(defaultCode)) return <Store className={className} />;
  if (/COMMUNS/i.test(defaultCode)) return <Warehouse className={className} />;
  return <Building2 className={className} />;
}

export function ProductChip({ product, selected, onClick }: ProductChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        selected
          ? "bg-primary text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
    >
      <ProductIcon defaultCode={product.defaultCode} className="h-4 w-4 flex-shrink-0" />
      <span>{product.displayLabel}</span>
    </button>
  );
}
