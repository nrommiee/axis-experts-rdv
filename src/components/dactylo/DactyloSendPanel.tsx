"use client";

import { PlusCircle } from "lucide-react";
import type { DactyloOrder } from "@/lib/odoo/dactylo";
import type { SendRow } from "./types";
import { DactyloSendRow } from "./DactyloSendRow";

interface DactyloSendPanelProps {
  rows: SendRow[];
  orders: DactyloOrder[];
  ordersLoading: boolean;
  totalFiles: number;
  canSubmit: boolean;
  hasUploadingRow: boolean;
  hasCompletedRow: boolean;
  availableOrdersFor: (rowId: string) => DactyloOrder[];
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateOrder: (rowId: string, orderId: number | null) => void;
  onAddFiles: (rowId: string, files: File[]) => void;
  onRemoveFile: (rowId: string, fileIndex: number) => void;
  onSubmitClick: () => void;
  onResetCompleted: () => void;
}

export function DactyloSendPanel({
  rows,
  orders,
  ordersLoading,
  totalFiles,
  canSubmit,
  hasUploadingRow,
  hasCompletedRow,
  availableOrdersFor,
  onAddRow,
  onRemoveRow,
  onUpdateOrder,
  onAddFiles,
  onRemoveFile,
  onSubmitClick,
  onResetCompleted,
}: DactyloSendPanelProps) {
  const validCount = rows.filter(
    (r) => r.orderId !== null && r.files.length > 0
  ).length;

  return (
    <section className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Envoi de devis dactylographiés
        </h2>
        {hasCompletedRow && (
          <button
            type="button"
            onClick={onResetCompleted}
            className="text-xs text-gray-600 underline-offset-2 hover:underline"
          >
            Nouvel envoi
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune ligne. Cliquez sur « Ajouter une ligne » pour commencer.
          </p>
        ) : (
          rows.map((row) => (
            <DactyloSendRow
              key={row.id}
              row={row}
              orders={orders}
              availableOrders={availableOrdersFor(row.id)}
              ordersLoading={ordersLoading}
              onUpdateOrder={onUpdateOrder}
              onAddFiles={onAddFiles}
              onRemoveFile={onRemoveFile}
              onRemove={onRemoveRow}
            />
          ))
        )}

        <button
          type="button"
          onClick={onAddRow}
          disabled={hasUploadingRow}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
        >
          <PlusCircle className="h-4 w-4" />
          Ajouter une ligne
        </button>
      </div>

      <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onSubmitClick}
          disabled={!canSubmit}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          {submitLabel(validCount, totalFiles)}
        </button>
      </div>
    </section>
  );
}

function submitLabel(validCount: number, totalFiles: number): string {
  if (validCount === 0) return "Tout envoyer";
  const devis = `${validCount} devis`;
  const fichiers = `${totalFiles} fichier${totalFiles > 1 ? "s" : ""}`;
  return `Envoyer ${devis} (${fichiers})`;
}
