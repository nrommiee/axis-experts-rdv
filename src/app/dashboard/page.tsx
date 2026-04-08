"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  name: string;
  date_order: string | false;
  amount_total: number;
  state: string;
  x_studio_type_de_bien_1: string | false;
  x_studio_suivi_expert: string | false;
  x_studio_adresse_de_mission: [number, string] | false;
  tag_ids: number[];
}

interface TagInfo {
  id: number;
  name: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  "En attente": { label: "En attente", color: "gray" },
  "En cours": { label: "En cours", color: "yellow" },
  "Dactylo": { label: "En cours", color: "yellow" },
  "A facturer": { label: "En cours", color: "yellow" },
  "A vérifier par expert": { label: "En cours", color: "yellow" },
  "A envoyer au client": { label: "En cours", color: "yellow" },
  "En attente de paiement": { label: "En cours", color: "yellow" },
  "Recouvrement": { label: "En cours", color: "yellow" },
  "Clôturé expert": { label: "Clôturé", color: "green" },
  "Annulé": { label: "Annulé", color: "red" },
};

const BADGE_STYLES: Record<string, string> = {
  gray: "bg-gray-100 text-gray-600",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

function getStatusBadge(status: string | false | null) {
  const s = status ? String(status).trim() : "";
  const mapped = STATUS_MAP[s] ?? { label: "En attente", color: "gray" };
  return mapped;
}

function formatDate(dateStr: string | false) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return amount.toLocaleString("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomSociete, setNomSociete] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthenticated(true);

      const { data: clientRow } = await supabase
        .from("portal_clients")
        .select("nom_societe")
        .eq("user_id", user.id)
        .single();

      if (clientRow?.nom_societe) {
        setNomSociete(clientRow.nom_societe);
      }

      try {
        const res = await fetch("/api/odoo/orders");
        const json = await res.json();
        if (Array.isArray(json)) {
          setOrders(json);

          // Collect all unique tag IDs to resolve names
          const allTagIds = new Set<number>();
          for (const o of json) {
            if (Array.isArray(o.tag_ids)) {
              for (const tid of o.tag_ids) allTagIds.add(tid);
            }
          }
          if (allTagIds.size > 0) {
            try {
              const tagRes = await fetch(
                "/api/odoo/tags?" +
                  new URLSearchParams({ ids: Array.from(allTagIds).join(",") })
              );
              const tagJson = await tagRes.json();
              if (Array.isArray(tagJson)) setTags(tagJson);
            } catch {
              // tags are optional, continue without them
            }
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, supabase]);

  const tagMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tags) m.set(t.id, t.name);
    return m;
  }, [tags]);

  const getMissionType = useCallback(
    (order: Order) => {
      if (!Array.isArray(order.tag_ids) || order.tag_ids.length === 0)
        return "—";
      for (const tid of order.tag_ids) {
        const name = tagMap.get(tid) || "";
        if (name.includes("ELE")) return "Entrée";
        if (name.includes("ELS")) return "Sortie";
      }
      return "—";
    },
    [tagMap]
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark">
                Bonjour, {nomSociete || "Client"}
              </h1>
              <p className="text-sm text-gray-400">Portail Axis Experts</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-dark transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Action card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark">
              Nouvelle demande
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Planifier un état des lieux d&apos;entrée ou de sortie
            </p>
          </div>
          <button
            onClick={() => router.push("/demande")}
            className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            Créer une demande
          </button>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-dark">Mes demandes</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-gray-400">
                Chargement des demandes...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg
                className="w-12 h-12 mb-3 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>Aucune demande pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Référence</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Bien</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const badge = getStatusBadge(
                      order.x_studio_suivi_expert
                    );
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-dark">
                          {order.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {getMissionType(order)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.x_studio_type_de_bien_1 || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(order.date_order)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${BADGE_STYLES[badge.color]}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {formatAmount(order.amount_total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
