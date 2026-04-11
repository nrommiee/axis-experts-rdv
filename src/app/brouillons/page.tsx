"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import QuickRequestModal from "@/components/QuickRequestModal";

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

export default function BrouillonsPage() {
  const [nomSociete, setNomSociete] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const loadDrafts = useCallback(() => {
    fetch("/api/drafts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDrafts(data); })
      .catch(() => {})
      .finally(() => setDraftsLoading(false));
  }, []);

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
      loadDrafts();

      const { data: clientRow } = await supabase
        .from("portal_clients")
        .select("nom_societe, logo_url")
        .eq("user_id", user.id)
        .single();

      if (clientRow) {
        if (clientRow.nom_societe) setNomSociete(clientRow.nom_societe);
        if (clientRow.logo_url) setLogoUrl(clientRow.logo_url);
      }
    }
    load();
  }, [router, supabase, loadDrafts]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  const deleteDraft = useCallback((id: string) => {
    setDraftToDelete(id);
  }, []);

  const confirmDeleteDraft = useCallback(async () => {
    const id = draftToDelete;
    if (!id) return;
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
      setDraftToDelete(null);
    }
  }, [draftToDelete]);

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
        {/* Page title with back button */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-dark">Mes brouillons</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Retour au tableau de bord
            </button>
            <button
              onClick={() => setQuickOpen(true)}
              className="px-5 py-2.5 rounded-full border-2 font-semibold transition-colors"
              style={{ borderColor: "#F5B800", color: "#F5B800" }}
            >
              &#9889; Demande rapide
            </button>
          </div>
        </div>

        {/* Drafts section */}
        {draftsLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center py-16">
            <div className="animate-pulse text-gray-400">Chargement des brouillons...</div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 text-gray-400">
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
            <p>Aucun brouillon pour le moment</p>
          </div>
        ) : (
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
      </main>

      {/* Delete draft confirmation modal */}
      {draftToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">Supprimer le brouillon ?</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600">
                Cette action est irréversible. Le brouillon et ses documents seront définitivement supprimés.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                disabled={deletingDraftId === draftToDelete}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDraft}
                disabled={deletingDraftId === draftToDelete}
                className="px-5 py-2.5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingDraftId === draftToDelete ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickRequestModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSuccess={loadDrafts}
      />
    </div>
  );
}
