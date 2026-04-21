"use client";

import { Loader2, RefreshCw } from "lucide-react";
import type { DactyloOrder } from "@/lib/odoo/dactylo";

interface DactyloOrdersListProps {
  orders: DactyloOrder[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DactyloOrdersList({
  orders,
  loading,
  refreshing,
  error,
  onRefresh,
}: DactyloOrdersListProps) {
  const showSkeleton = loading && orders.length === 0 && !error;

  return (
    <section className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {showSkeleton
            ? "Chargement des devis…"
            : `${orders.length} devis en attente de dactylographie`}
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Rafraîchir la liste des devis"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Rafraîchir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showSkeleton && <OrdersSkeleton />}

        {!showSkeleton && error && (
          <div className="flex flex-col items-start gap-3 px-4 py-6">
            <p className="text-sm text-gray-700">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              Réessayer
            </button>
          </div>
        )}

        {!showSkeleton && !error && orders.length === 0 && (
          <div className="flex flex-col items-start gap-3 px-4 py-8">
            <p className="text-sm text-gray-600">
              Aucun devis en attente de dactylographie pour le moment.
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              Rafraîchir
            </button>
          </div>
        )}

        {!showSkeleton && !error && orders.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: DactyloOrder }) {
  const typeAndTags = [order.type_de_bien, order.tags.join(", ")]
    .filter(Boolean)
    .join(" • ");

  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{order.name}</span>
        {order.partner_name && (
          <span className="truncate text-xs text-gray-500">
            {order.partner_name}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700">{order.mission_address}</p>
      {typeAndTags && (
        <p className="text-xs text-gray-500">{typeAndTags}</p>
      )}
      {order.expert_name && (
        <p className="text-xs italic text-gray-400">
          Expert : {order.expert_name}
        </p>
      )}
      {order.next_rdv && (
        <p className="text-xs text-gray-500">RDV : {order.next_rdv}</p>
      )}
    </li>
  );
}

function OrdersSkeleton() {
  return (
    <ul className="divide-y divide-gray-100" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-1.5 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
