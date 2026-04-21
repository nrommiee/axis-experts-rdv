"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DactyloOrder } from "@/lib/odoo/dactylo";
import type { SendRow } from "./types";

interface DactyloSendRowProps {
  row: SendRow;
  orders: DactyloOrder[];
  availableOrders: DactyloOrder[];
  ordersLoading: boolean;
  onUpdateOrder: (rowId: string, orderId: number | null) => void;
  onAddFiles: (rowId: string, files: File[]) => void;
  onRemoveFile: (rowId: string, fileIndex: number) => void;
  onRemove: (rowId: string) => void;
}

export function DactyloSendRow({
  row,
  orders,
  availableOrders,
  ordersLoading,
  onUpdateOrder,
  onAddFiles,
  onRemoveFile,
  onRemove,
}: DactyloSendRowProps) {
  const locked = row.status !== "idle" && row.status !== "error";
  const selectedOrder = useMemo(
    () => (row.orderId !== null ? orders.find((o) => o.id === row.orderId) ?? null : null),
    [row.orderId, orders]
  );

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${rowBorderClass(
        row.status
      )}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <OrderPicker
            row={row}
            availableOrders={availableOrders}
            selectedOrder={selectedOrder}
            ordersLoading={ordersLoading}
            locked={locked}
            onSelect={(id) => onUpdateOrder(row.id, id)}
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          disabled={locked}
          aria-label="Supprimer la ligne d'envoi"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Dropzone
        rowId={row.id}
        locked={locked}
        hasFiles={row.files.length > 0}
        onAddFiles={onAddFiles}
      />

      {row.files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {row.files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatSize(f.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(row.id, i)}
                disabled={locked}
                aria-label={`Retirer ${f.name}`}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <StatusBadge status={row.status} errorMessage={row.errorMessage} />
    </div>
  );
}

function rowBorderClass(status: SendRow["status"]): string {
  switch (status) {
    case "success":
      return "border-green-300 bg-green-50/30";
    case "error":
      return "border-red-300 bg-red-50/30";
    case "uploading":
    case "pending":
      return "border-gray-300 bg-gray-50/40";
    default:
      return "border-gray-200 bg-white";
  }
}

function StatusBadge({
  status,
  errorMessage,
}: {
  status: SendRow["status"];
  errorMessage?: string;
}) {
  if (status === "idle") return null;
  if (status === "pending") {
    return (
      <p className="text-xs text-gray-500">En attente…</p>
    );
  }
  if (status === "uploading") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-gray-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Envoi en cours…
      </p>
    );
  }
  if (status === "success") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
        <Check className="h-3.5 w-3.5" />
        Envoyé
      </p>
    );
  }
  return (
    <p className="inline-flex items-start gap-1.5 text-xs text-red-700">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{errorMessage ?? "Une erreur est survenue."}</span>
    </p>
  );
}

function OrderPicker({
  row,
  availableOrders,
  selectedOrder,
  ordersLoading,
  locked,
  onSelect,
}: {
  row: SendRow;
  availableOrders: DactyloOrder[];
  selectedOrder: DactyloOrder | null;
  ordersLoading: boolean;
  locked: boolean;
  onSelect: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableOrders;
    return availableOrders.filter((o) => {
      const hay =
        `${o.name} ${o.mission_address} ${o.partner_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [availableOrders, query]);

  const triggerLabel = ordersLoading
    ? "Chargement des devis…"
    : selectedOrder
    ? formatOrderLabel(selectedOrder)
    : "Sélectionner un devis";

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`order-trigger-${row.id}`}
        className="text-xs font-medium text-gray-600"
      >
        Devis
      </label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (locked) return;
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={`order-trigger-${row.id}`}
            type="button"
            disabled={locked || ordersLoading}
            aria-label="Sélectionner un devis"
            className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
          >
            <span
              className={`truncate text-left ${
                selectedOrder ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {triggerLabel}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(560px,calc(100vw-2rem))] p-0"
        >
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher (n°, adresse, client)…"
              aria-label="Rechercher un devis"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="border-b border-gray-100 px-3 py-1.5 text-xs text-gray-500">
            {filtered.length} devis trouvé{filtered.length > 1 ? "s" : ""}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">Aucun devis</p>
            ) : (
              <ul>
                {filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(o.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">
                        {o.name}
                        {o.type_de_bien && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            {o.type_de_bien}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-600">
                        {o.mission_address}
                      </span>
                      {o.partner_name && (
                        <span className="text-xs text-gray-400">
                          {o.partner_name}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selectedOrder && (
            <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs">
              <span className="text-gray-500">
                Sélection : {selectedOrder.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                  setQuery("");
                }}
                className="text-gray-600 underline-offset-2 hover:underline"
              >
                Effacer
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Dropzone({
  rowId,
  locked,
  hasFiles,
  onAddFiles,
}: {
  rowId: string;
  locked: boolean;
  hasFiles: boolean;
  onAddFiles: (rowId: string, files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (locked) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onAddFiles(rowId, files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!locked) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={openPicker}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-label="Zone de dépôt de fichiers .docx"
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-5 text-center transition-colors ${
        locked
          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
          : dragOver
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-primary hover:bg-gray-50"
      }`}
    >
      <Upload className="h-5 w-5 text-gray-400" />
      <p className="text-sm text-gray-600">
        {hasFiles ? "Ajouter d'autres fichiers" : "Glissez vos fichiers .docx ici"}
      </p>
      <p className="text-xs text-gray-400">ou cliquez pour parcourir</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onAddFiles(rowId, files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function formatOrderLabel(o: DactyloOrder): string {
  const parts = [o.name, o.mission_address];
  if (o.type_de_bien) parts.push(o.type_de_bien);
  return parts.filter(Boolean).join(" — ");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
