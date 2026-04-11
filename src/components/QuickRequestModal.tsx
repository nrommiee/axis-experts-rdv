"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAddressAutocomplete } from "@/lib/useAddressAutocomplete";

const HIDDEN_OPTIONS = ["DEP.INUTILE", "URGENT_24h", "URGENT_24h_CO", "DEPL.INUT"];

interface QuickProduct {
  id: number;
  odooName: string;
  defaultCode: string;
  displayLabel: string;
  listPrice: number;
  isOption: boolean;
}

interface QuickRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickRequestModal({ open, onClose, onSuccess }: QuickRequestModalProps) {
  const [quickMission, setQuickMission] = useState<"entree" | "sortie" | "">("");
  const [quickProducts, setQuickProducts] = useState<QuickProduct[]>([]);
  const [quickProductsLoading, setQuickProductsLoading] = useState(false);
  const [quickSelectedProduct, setQuickSelectedProduct] = useState<QuickProduct | null>(null);
  const [quickRue, setQuickRue] = useState("");
  const [quickNumero, setQuickNumero] = useState("");
  const [quickBoite, setQuickBoite] = useState("");
  const [quickCodePostal, setQuickCodePostal] = useState("");
  const [quickCommune, setQuickCommune] = useState("");
  const [quickLocatairePrenom, setQuickLocatairePrenom] = useState("");
  const [quickLocataireNom, setQuickLocataireNom] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState("");
  const quickAddressRef = useRef<HTMLInputElement>(null);

  // Reset state each time the modal opens, matching the original
  // openQuickModal behavior on the dashboard.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuickMission("");
      setQuickSelectedProduct(null);
      setQuickRue("");
      setQuickNumero("");
      setQuickBoite("");
      setQuickCodePostal("");
      setQuickCommune("");
      setQuickLocatairePrenom("");
      setQuickLocataireNom("");
      setQuickError("");
      setQuickSubmitting(false);
    }
  }

  // Load products when quick modal opens
  useEffect(() => {
    if (!open || quickProducts.length > 0) return;
    setQuickProductsLoading(true);
    fetch("/api/odoo/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setQuickProducts(data); })
      .catch(() => {})
      .finally(() => setQuickProductsLoading(false));
  }, [open, quickProducts.length]);

  // Filtered products for quick modal based on mission type
  const quickMainProducts = useMemo(() => {
    if (!quickMission) return [];
    const code = quickMission === "entree" ? "ELLE" : "ELLS";
    const oppositeCode = quickMission === "entree" ? "ELLS" : "ELLE";
    const isEntree = quickMission === "entree";
    return quickProducts
      .filter((p) => {
        if (p.isOption) return false;
        if (HIDDEN_OPTIONS.some((h) => p.defaultCode.includes(h))) return false;
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
  useAddressAutocomplete(
    quickAddressRef,
    useCallback((f) => {
      setQuickRue(f.rue);
      setQuickNumero(f.numero);
      setQuickBoite("");
      setQuickCodePostal(f.codePostal);
      setQuickCommune(f.commune);
    }, []),
    open,
  );

  const submitQuickDraft = useCallback(async () => {
    // Validate
    if (!quickMission) { setQuickError("Type de mission requis"); return; }
    if (!quickRue || !quickCommune) { setQuickError("Adresse (rue + commune) requise"); return; }
    if (!quickLocataireNom) { setQuickError("Nom du locataire requis"); return; }
    setQuickError("");
    setQuickSubmitting(true);

    try {
      const adresse = `${quickRue} ${quickNumero}, ${quickCommune}`;
      const title = adresse;

      const formData = {
        typeMission: quickMission,
        typeBien: quickSelectedProduct?.defaultCode ?? "",
        rue: quickRue,
        numero: quickNumero,
        boite: quickBoite,
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
          selectedProduct: quickSelectedProduct
            ? {
                id: quickSelectedProduct.id,
                odooName: quickSelectedProduct.odooName,
                defaultCode: quickSelectedProduct.defaultCode,
                displayLabel: quickSelectedProduct.displayLabel,
                listPrice: quickSelectedProduct.listPrice,
              }
            : null,
          selectedOptions: [],
          currentStep: 0,
          documentPaths: [],
          title,
        }),
      });

      if (res.ok) {
        await res.json();
        onSuccess?.();
        onClose();
      } else {
        const err = await res.json();
        setQuickError(err.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setQuickError("Erreur lors de la sauvegarde");
    } finally {
      setQuickSubmitting(false);
    }
  }, [quickMission, quickSelectedProduct, quickRue, quickNumero, quickBoite, quickCodePostal, quickCommune, quickLocatairePrenom, quickLocataireNom, onSuccess, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">&#9889; Demande rapide</h3>
          <button
            onClick={onClose}
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
                  onClick={() => { setQuickMission(opt.value); setQuickSelectedProduct(null); setQuickError(""); }}
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
              <label className="block text-sm font-medium text-gray-600 mb-2">Type de bien</label>
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
                className="col-span-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
              />
              <input
                placeholder="Boîte"
                value={quickBoite}
                onChange={(e) => setQuickBoite(e.target.value)}
                className="col-span-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
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
  );
}
