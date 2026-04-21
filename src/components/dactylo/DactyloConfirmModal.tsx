"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DactyloOrder } from "@/lib/odoo/dactylo";
import type { SendRow } from "./types";

interface DactyloConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: SendRow[];
  orders: DactyloOrder[];
  onConfirm: () => void;
}

export function DactyloConfirmModal({
  open,
  onOpenChange,
  rows,
  orders,
  onConfirm,
}: DactyloConfirmModalProps) {
  const validRows = rows.filter(
    (r) => r.orderId !== null && r.files.length > 0
  );
  const totalFiles = validRows.reduce((n, r) => n + r.files.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer l&apos;envoi</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d&apos;envoyer{" "}
            <strong>{validRows.length} devis</strong> ({totalFiles} fichier
            {totalFiles > 1 ? "s" : ""} au total) vers Odoo. Cette action est
            irréversible.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2 text-sm">
          {validRows.map((r) => {
            const order = orders.find((o) => o.id === r.orderId);
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded px-2 py-1"
              >
                <span className="truncate font-medium text-gray-800">
                  {order?.name ?? `#${r.orderId}`}
                </span>
                <span className="shrink-0 text-xs text-gray-500">
                  {r.files.length} fichier{r.files.length > 1 ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Confirmer l&apos;envoi
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
