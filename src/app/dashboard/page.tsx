"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import QuickRequestModal from "@/components/QuickRequestModal";

declare global {
  interface Window {
    google: any;
  }
}

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
  has_messages?: boolean;
  has_unread?: boolean;
}

interface TagInfo {
  id: number;
  name: string;
}

interface Attachment {
  id: number;
  name: string;
  mimetype: string;
  file_size: number;
  datas: string | null;
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [attachModalOrderId, setAttachModalOrderId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [draftsCount, setDraftsCount] = useState(0);
  // Quick draft modal
  const [quickOpen, setQuickOpen] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Debounce searchQuery -> debouncedQuery (300ms) for server-side search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset pagination when the debounced query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

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

      // Load drafts count
      fetch("/api/drafts")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setDraftsCount(data.length); })
        .catch(() => {});

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
        const params = new URLSearchParams({
          offset: String(offset),
          limit: String(ORDERS_PER_PAGE),
        });
        if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
        const res = await fetch(`/api/odoo/orders?${params.toString()}`);
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
  }, [router, supabase, page, debouncedQuery]);

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

  const openAttachModal = useCallback(async (orderId: number) => {
    setAttachModalOrderId(orderId);
    setAttachments([]);
    setAttachError(null);
    setAttachLoading(true);
    try {
      const res = await fetch(`/api/odoo/attachments?orderId=${orderId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors du chargement");
      }
      const data: Attachment[] = await res.json();
      setAttachments(data);
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAttachLoading(false);
    }
  }, []);

  const downloadAttachment = useCallback((att: Attachment) => {
    if (!att.datas) return;
    const byteChars = atob(att.datas);
    const byteNumbers = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: att.mimetype || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

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

    return result;
  }, [orders, statusFilter]);

  // Server-side pagination: totalPages from server total, display filtered from current page
  const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders;

  const stats = useMemo(() => {
    let enCours = 0;
    let cloturees = 0;
    for (const o of orders) {
      const label = getStatusBadge(o.x_studio_suivi_expert).label;
      if (label === "Clôturé") cloturees++;
      else if (label !== "Annulé") enCours++;
    }
    return { enCours, cloturees };
  }, [orders]);

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-dark">
              Nouvelle demande
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Planifier un état des lieux d&apos;entrée ou de sortie
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/brouillons")}
              className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Mes brouillons ({draftsCount})
            </button>
            <button
              onClick={() => setQuickOpen(true)}
              className="px-5 py-2.5 rounded-full border-2 font-semibold transition-colors"
              style={{ borderColor: "#F5B800", color: "#F5B800" }}
            >
              &#9889; Demande rapide
            </button>
            <button
              onClick={() => router.push("/demande")}
              className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Créer une demande
            </button>
          </div>
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
                      <th className="px-6 py-3 font-medium">PJ</th>
                      <th className="px-6 py-3 font-medium">Messages</th>
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
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openAttachModal(order.id)}
                              className="text-gray-400 hover:text-amber-600 transition-colors"
                              title="Pièces jointes"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            {order.has_messages ? (
                              <button
                                onClick={() => { /* drawer phase 2 */ }}
                                className="relative inline-flex items-center justify-center transition-colors"
                                title={order.has_unread ? "Messages non lus" : "Messages"}
                                style={{ color: order.has_unread ? "#F5B800" : "#9CA3AF" }}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {order.has_unread && (
                                  <span
                                    className="absolute rounded-full"
                                    style={{
                                      top: "-2px",
                                      right: "-2px",
                                      width: "6px",
                                      height: "6px",
                                      backgroundColor: "#EF4444",
                                    }}
                                  />
                                )}
                              </button>
                            ) : null}
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

      {/* Attachments Modal */}
      {attachModalOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">Pièces jointes</h3>
              <button
                onClick={() => setAttachModalOrderId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {attachLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-gray-400">Chargement...</div>
                </div>
              ) : attachError ? (
                <div className="text-center py-12 text-red-500 text-sm">{attachError}</div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Aucune pièce jointe</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {attachments.map((att) => (
                    <li key={att.id}>
                      <button
                        onClick={() => downloadAttachment(att)}
                        className="w-full flex items-center gap-3 px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {att.mimetype?.startsWith("image/") ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          )}
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{att.name}</p>
                          <p className="text-xs text-gray-400">
                            {att.file_size > 0
                              ? att.file_size < 1024
                                ? `${att.file_size} o`
                                : att.file_size < 1048576
                                  ? `${(att.file_size / 1024).toFixed(1)} Ko`
                                  : `${(att.file_size / 1048576).toFixed(1)} Mo`
                              : ""}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <QuickRequestModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSuccess={() => setDraftsCount((c) => c + 1)}
      />

    </div>
  );
}
