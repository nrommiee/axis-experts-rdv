"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any;
  }
}

interface QuickProduct {
  id: number;
  odooName: string;
  defaultCode: string;
  displayLabel: string;
  listPrice: number;
  isOption: boolean;
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

interface Draft {
  id: string;
  title: string | null;
  current_step: number;
  form_data: { typeMission?: string; locatairePrenom?: string; locataireNom?: string } | null;
  created_at: string;
  updated_at: string;
  document_paths: { path: string; name: string }[];
}

function getDraftMissionLabel(draft: Draft): string {
  const tm = draft.form_data?.typeMission;
  if (tm === "entree") return "Entrée";
  if (tm === "sortie") return "Sortie";
  return "–";
}

function getDraftLocataire(draft: Draft): string {
  const p = draft.form_data?.locatairePrenom || "";
  const n = draft.form_data?.locataireNom || "";
  const full = `${p} ${n}`.trim();
  return full || "–";
}

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
  const [attachModalOrderId, setAttachModalOrderId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  // Quick draft modal
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickMission, setQuickMission] = useState<"entree" | "sortie" | "">("");
  const [quickProducts, setQuickProducts] = useState<QuickProduct[]>([]);
  const [quickProductsLoading, setQuickProductsLoading] = useState(false);
  const [quickSelectedProduct, setQuickSelectedProduct] = useState<QuickProduct | null>(null);
  const [quickRue, setQuickRue] = useState("");
  const [quickNumero, setQuickNumero] = useState("");
  const [quickCodePostal, setQuickCodePostal] = useState("");
  const [quickCommune, setQuickCommune] = useState("");
  const [quickLocatairePrenom, setQuickLocatairePrenom] = useState("");
  const [quickLocataireNom, setQuickLocataireNom] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const quickAddressRef = useRef<HTMLInputElement>(null);
  const quickAutoRef = useRef<any>(null);
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

      // Load drafts
      fetch("/api/drafts")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setDrafts(data); })
        .catch(() => {})
        .finally(() => setDraftsLoading(false));

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

  const deleteDraft = useCallback(async (id: string) => {
    setDeletingDraftId(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setDeletingDraftId(null);
    }
  }, []);

  // Load products when quick modal opens
  useEffect(() => {
    if (!quickOpen || quickProducts.length > 0) return;
    setQuickProductsLoading(true);
    fetch("/api/odoo/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setQuickProducts(data); })
      .catch(() => {})
      .finally(() => setQuickProductsLoading(false));
  }, [quickOpen, quickProducts.length]);

  // Filtered products for quick modal based on mission type
  const quickMainProducts = useMemo(() => {
    if (!quickMission) return [];
    const code = quickMission === "entree" ? "ELLE" : "ELLS";
    const oppositeCode = quickMission === "entree" ? "ELLS" : "ELLE";
    const isEntree = quickMission === "entree";
    return quickProducts
      .filter((p) => {
        if (p.isOption) return false;
        if (isEntree && p.displayLabel.toLowerCase().includes("sortie")) return false;
        if (p.defaultCode.includes(code)) return true;
        if (p.defaultCode.toUpperCase().includes("COMMUNS")) return !p.defaultCode.includes(oppositeCode);
        return false;
      })
      .sort((a, b) => {
        const aEnd = a.defaultCode.toUpperCase().includes("COMMUNS") || a.defaultCode.includes("Bureau");
        const bEnd = b.defaultCode.toUpperCase().includes("COMMUNS") || b.defaultCode.includes("Bureau");
        if (aEnd === bEnd) return 0;
        return aEnd ? 1 : -1;
      });
  }, [quickProducts, quickMission]);

  // Google Maps autocomplete for quick modal
  // Uses a delay to ensure the modal input is mounted in the DOM before init
  useEffect(() => {
    if (!quickOpen) return;
    const tryInit = () => {
      const input = quickAddressRef.current;
      if (!input || !window.google?.maps?.places) return false;
      if (quickAutoRef.current && quickAutoRef.current._input === input) return true;
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "be" },
        fields: ["address_components", "formatted_address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const get = (type: string) =>
          place.address_components?.find((c: any) => c.types.includes(type))?.long_name ?? "";
        setQuickRue(get("route"));
        setQuickNumero(get("street_number"));
        setQuickCodePostal(get("postal_code"));
        setQuickCommune(get("locality"));
      });
      quickAutoRef.current = autocomplete;
      quickAutoRef.current._input = input;
      return true;
    };
    // Try immediately in case everything is ready
    if (tryInit()) return;
    // Retry after a short delay to let the modal DOM mount
    const t1 = setTimeout(() => { if (tryInit()) return; }, 150);
    // Final retry for slow script loads
    const t2 = setTimeout(() => { tryInit(); }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [quickOpen, mapsReady]);

  const openQuickModal = useCallback(() => {
    setQuickMission("");
    setQuickSelectedProduct(null);
    setQuickRue("");
    setQuickNumero("");
    setQuickCodePostal("");
    setQuickCommune("");
    setQuickLocatairePrenom("");
    setQuickLocataireNom("");
    setQuickError("");
    setQuickSubmitting(false);
    quickAutoRef.current = null;
    setQuickOpen(true);
  }, []);

  const submitQuickDraft = useCallback(async () => {
    // Validate
    if (!quickMission) { setQuickError("Type de mission requis"); return; }
    if (!quickSelectedProduct) { setQuickError("Type de bien requis"); return; }
    if (!quickRue || !quickCommune) { setQuickError("Adresse (rue + commune) requise"); return; }
    if (!quickLocataireNom) { setQuickError("Nom du locataire requis"); return; }
    setQuickError("");
    setQuickSubmitting(true);

    try {
      const missionLabel = quickMission === "entree" ? "Entrée" : "Sortie";
      const adresse = `${quickRue} ${quickNumero}, ${quickCommune}`;
      const title = `${missionLabel} – ${adresse}`;

      const formData = {
        typeMission: quickMission,
        typeBien: quickSelectedProduct.defaultCode,
        rue: quickRue,
        numero: quickNumero,
        boite: "",
        codePostal: quickCodePostal,
        commune: quickCommune,
        dateDebut: "",
        dateFin: "",
        bailleurSociete: "",
        bailleurNom: "",
        bailleurPrenom: "",
        bailleurEmail: "",
        bailleurTelephone: "",
        locataireNom: quickLocataireNom,
        locatairePrenom: quickLocatairePrenom,
        locataireEmail: "",
        locataireTelephone: "",
        locataireNewRue: "",
        locataireNewNumero: "",
        locataireNewBoite: "",
        locataireNewCodePostal: "",
        locataireNewCommune: "",
        representantEnabled: false,
        representantPrenom: "",
        representantNom: "",
        representantRole: "",
        representantRoleCustom: "",
        representantEmail: "",
        representantTelephone: "",
        locataireDecede: false,
        numeroPO: "",
        notesLibres: "",
        compteurEau: "",
        compteurGaz: "",
        compteurElec: "",
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          selectedProduct: {
            id: quickSelectedProduct.id,
            odooName: quickSelectedProduct.odooName,
            defaultCode: quickSelectedProduct.defaultCode,
            displayLabel: quickSelectedProduct.displayLabel,
            listPrice: quickSelectedProduct.listPrice,
          },
          selectedOptions: [],
          currentStep: 0,
          documentPaths: [],
          title,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setDrafts((prev) => [result, ...prev]);
        setQuickOpen(false);
      } else {
        const err = await res.json();
        setQuickError(err.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setQuickError("Erreur lors de la sauvegarde");
    } finally {
      setQuickSubmitting(false);
    }
  }, [quickMission, quickSelectedProduct, quickRue, quickNumero, quickCodePostal, quickCommune, quickLocatairePrenom, quickLocataireNom]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => { if (window.google?.maps?.places) setMapsReady(true); }}
        onReady={() => { if (window.google?.maps?.places) setMapsReady(true); }}
      />
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
              onClick={openQuickModal}
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

        {/* Drafts section */}
        {!draftsLoading && drafts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-dark">En préparation</h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {drafts.length}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Titre</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Locataire</th>
                    <th className="px-6 py-3 font-medium">Date de création</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-dark">
                        {draft.title || `Brouillon du ${formatDate(draft.created_at)}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {getDraftMissionLabel(draft)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getDraftLocataire(draft)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(draft.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/demande?draftId=${draft.id}`)}
                            className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            disabled={deletingDraftId === draft.id}
                            className="text-gray-400 hover:text-red-500 text-sm transition-colors disabled:opacity-50"
                          >
                            {deletingDraftId === draft.id ? "..." : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {drafts.map((draft) => (
                <div key={draft.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-dark text-sm truncate">
                        {draft.title || `Brouillon du ${formatDate(draft.created_at)}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {getDraftMissionLabel(draft)}
                        </span>
                        <span className="text-xs text-gray-600">{getDraftLocataire(draft)}</span>
                        <span className="text-xs text-gray-400">{formatDate(draft.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/demande?draftId=${draft.id}`)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        disabled={deletingDraftId === draft.id}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingDraftId === draft.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Quick Draft Modal */}
      {quickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">&#9889; Demande rapide</h3>
              <button
                onClick={() => setQuickOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Mission type */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Type de mission *</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "entree" as const, label: "Entrée locative" },
                    { value: "sortie" as const, label: "Sortie locative" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setQuickMission(opt.value); setQuickSelectedProduct(null); }}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        quickMission === opt.value
                          ? "border-primary bg-primary-light text-dark"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product type */}
              {quickMission && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type de bien *</label>
                  {quickProductsLoading ? (
                    <div className="text-sm text-gray-400 animate-pulse">Chargement...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {quickMainProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setQuickSelectedProduct(p)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            quickSelectedProduct?.id === p.id
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {p.displayLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Adresse *</label>
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
                  </svg>
                  <input
                    ref={quickAddressRef}
                    type="text"
                    placeholder="Rechercher une adresse..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <input
                    placeholder="Rue *"
                    value={quickRue}
                    onChange={(e) => setQuickRue(e.target.value)}
                    className="col-span-4 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                  <input
                    placeholder="N°"
                    value={quickNumero}
                    onChange={(e) => setQuickNumero(e.target.value)}
                    className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                  <input
                    placeholder="CP"
                    value={quickCodePostal}
                    onChange={(e) => setQuickCodePostal(e.target.value)}
                    className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                  <input
                    placeholder="Commune *"
                    value={quickCommune}
                    onChange={(e) => setQuickCommune(e.target.value)}
                    className="col-span-4 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {/* Locataire */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Locataire *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Prénom"
                    value={quickLocatairePrenom}
                    onChange={(e) => setQuickLocatairePrenom(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                  <input
                    placeholder="Nom *"
                    value={quickLocataireNom}
                    onChange={(e) => setQuickLocataireNom(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {quickError && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{quickError}</div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={submitQuickDraft}
                disabled={quickSubmitting}
                className="w-full py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {quickSubmitting ? "Enregistrement..." : "Enregistrer en brouillon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
