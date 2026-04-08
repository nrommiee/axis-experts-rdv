"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  name: string;
  date_order: string | false;
  appointment_date: string | null;
  state: string;
  x_studio_type_de_bien_1: string | false;
  x_studio_suivi_expert: string | false;
  address_display: string | null;
  locataire_name: string | null;
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

const FILTER_OPTIONS = [
  { key: "all", label: "Tous" },
  { key: "en_cours", label: "En cours" },
  { key: "cloture", label: "Clôturé" },
  { key: "annule", label: "Annulé" },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]["key"];

const ORDERS_PER_PAGE = 20;

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomSociete, setNomSociete] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
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
        .select("nom_societe, logo_url")
        .eq("user_id", user.id)
        .single();

      if (clientRow) {
        if (clientRow.nom_societe) setNomSociete(clientRow.nom_societe);
        if (clientRow.logo_url) setLogoUrl(clientRow.logo_url);
      }

      try {
        const offset = (page - 1) * ORDERS_PER_PAGE;
        const res = await fetch(`/api/odoo/orders?offset=${offset}&limit=${ORDERS_PER_PAGE}`);
        const json = await res.json();
        const orderList = json.orders ?? (Array.isArray(json) ? json : []);
        if (Array.isArray(orderList)) {
          // Sort by date_order descending (most recent first)
          orderList.sort((a: Order, b: Order) => {
            const da = a.date_order ? new Date(a.date_order).getTime() : 0;
            const db = b.date_order ? new Date(b.date_order).getTime() : 0;
            return db - da;
          });
          setOrders(orderList);
          if (typeof json.total === "number") setTotalOrders(json.total);

          // Collect all unique tag IDs to resolve names
          const allTagIds = new Set<number>();
          for (const o of orderList) {
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
  }, [router, supabase, page]);

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

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => {
        const badge = getStatusBadge(o.x_studio_suivi_expert);
        if (statusFilter === "en_cours") return badge.label === "En cours";
        if (statusFilter === "cloture") return badge.label === "Clôturé";
        if (statusFilter === "annule") return badge.label === "Annulé";
        return true;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((o) =>
        o.name.toLowerCase().includes(q) ||
        (o.locataire_name && o.locataire_name.toLowerCase().includes(q)) ||
        (o.address_display && o.address_display.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  // Server-side pagination: totalPages from server total, display filtered from current page
  const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders;

  const handleFilterChange = useCallback((key: FilterKey) => {
    setStatusFilter(key);
  }, []);

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
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png" alt="Axis Experts" style={{ height: '32px', objectFit: 'contain' }} />
            <div>
              <h1 className="text-lg font-bold text-dark">
                Bonjour, {nomSociete || "Client"}
              </h1>
              <p className="text-sm text-gray-400">Portail Axis Experts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="max-w-[120px] overflow-hidden">
                <img src={logoUrl} alt={nomSociete || "Client"} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-dark transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark">Mes demandes</h2>
            <div className="flex gap-2">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === f.key
                      ? "bg-amber-100 text-amber-700"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une mission..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-gray-400">
                Chargement des demandes...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                      <th className="px-6 py-3 font-medium">Référence</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Bien</th>
                      <th className="px-6 py-3 font-medium">Adresse</th>
                      <th className="px-6 py-3 font-medium">Locataire</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedOrders.map((order) => {
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
                            {order.address_display || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {order.locataire_name || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {order.appointment_date || formatDate(order.date_order)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${BADGE_STYLES[badge.color]}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-100">
                  <button
                    onClick={() => { setLoading(true); setPage((p) => Math.max(1, p - 1)); }}
                    disabled={page === 1 || loading}
                    className="px-3 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => { setLoading(true); setPage((p) => Math.min(totalPages, p + 1)); }}
                    disabled={page === totalPages || loading}
                    className="px-3 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
