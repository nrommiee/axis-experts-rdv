"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useAddressAutocomplete } from "@/lib/useAddressAutocomplete";
import type { FormData, DocumentFile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface StoredDocument {
  path: string;
  name: string;
  customName: string;
  size: number;
}

declare global {
  interface Window {
    google: any;
  }
}

const STEPS = ["Mission", "Parties", "Documents", "Informations", "Récapitulatif"];

interface PortalClient {
  nom_societe: string | null;
  nom_bailleur: string | null;
  email_bailleur: string | null;
  telephone_bailleur: string | null;
  logo_url: string | null;
}

interface Product {
  id: number;
  odooName: string;
  defaultCode: string;
  displayLabel: string;
  listPrice: number;
  isOption: boolean;
}

const HIDDEN_OPTIONS = ["DEP.INUTILE", "URGENT_24h", "URGENT_24h_CO", "DEPL.INUT"];

const initialForm: FormData = {
  typeMission: "",
  typeBien: "",
  rue: "",
  numero: "",
  boite: "",
  codePostal: "",
  commune: "",
  dateDebut: "",
  dateFin: "",
  bailleurSociete: "",
  bailleurNom: "",
  bailleurPrenom: "",
  bailleurEmail: "",
  bailleurTelephone: "",
  locataireNom: "",
  locatairePrenom: "",
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
  documents: [],
  locataireDecede: false,
  numeroPO: "",
  notesLibres: "",
  compteurEau: "",
  compteurGaz: "",
  compteurElec: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DemandePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Chargement...</div></div>}>
      <DemandePageInner />
    </Suspense>
  );
}

function DemandePageInner() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [user, setUser] = useState<User | null>(null);
  const [portalClient, setPortalClient] = useState<PortalClient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Product[]>([]);
  const [addressSelected, setAddressSelected] = useState(false);
  const [newAddressSelected, setNewAddressSelected] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const newAddressAutocompleteRef = useRef<HTMLInputElement>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch bailleur info from portal_clients
      const { data: clientRow } = await supabase
        .from("portal_clients")
        .select("nom_societe, nom_bailleur, email_bailleur, telephone_bailleur, logo_url")
        .eq("user_id", user.id)
        .single();

      const hasDraft = !!searchParams.get("draftId");
      if (clientRow) {
        setPortalClient(clientRow);
        // Skip bailleur overwrite when loading a draft — draft has its own bailleur data
        if (!hasDraft) {
          setForm((f) => ({
            ...f,
            bailleurSociete: clientRow.nom_societe || "",
            bailleurNom: clientRow.nom_bailleur || "",
            bailleurEmail: clientRow.email_bailleur || user.email || "",
            bailleurTelephone: clientRow.telephone_bailleur || "",
          }));
        }
      } else if (!hasDraft) {
        // Fallback to user metadata
        const meta = user.user_metadata || {};
        setForm((f) => ({
          ...f,
          bailleurNom: meta.nom || meta.last_name || "",
          bailleurPrenom: meta.prenom || meta.first_name || "",
          bailleurEmail: user.email || "",
          bailleurTelephone: meta.telephone || meta.phone || "",
        }));
      }

      // Hydrate from draft if draftId is in URL
      const draftParam = searchParams.get("draftId");
      if (draftParam) {
        setDraftLoading(true);
        try {
          const res = await fetch(`/api/drafts/${draftParam}`);
          if (res.ok) {
            const draft = await res.json();
            setDraftId(draft.id);

            // Hydrate form data from draft
            const fd = draft.form_data;
            if (fd) {
              // If draft has empty bailleur fields (e.g. from quick draft), fill from portal_clients
              if (clientRow) {
                if (!fd.bailleurSociete) fd.bailleurSociete = clientRow.nom_societe || "";
                if (!fd.bailleurNom) fd.bailleurNom = clientRow.nom_bailleur || "";
                if (!fd.bailleurEmail) fd.bailleurEmail = clientRow.email_bailleur || user.email || "";
                if (!fd.bailleurTelephone) fd.bailleurTelephone = clientRow.telephone_bailleur || "";
              }
              setForm((f) => ({
                ...f,
                ...fd,
                documents: f.documents, // keep File objects separate
              }));
            }

            // Hydrate selected product/options — will be matched against loaded products
            if (draft.selected_product) {
              setSelectedProduct(draft.selected_product);
            }
            if (Array.isArray(draft.selected_options)) {
              setSelectedOptions(draft.selected_options);
            }

            // Hydrate stored documents
            if (Array.isArray(draft.document_paths) && draft.document_paths.length > 0) {
              setStoredDocuments(draft.document_paths);
            }

            // Restore step
            if (typeof draft.current_step === "number") {
              setStep(draft.current_step);
            }
          }
        } catch (err) {
          console.error("[Draft] Failed to load draft:", err);
        } finally {
          setDraftLoading(false);
        }
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  useEffect(() => {
    fetch("/api/odoo/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log("[Products] Loaded:", data.map((p: Product) => `${p.defaultCode} → ${p.displayLabel} (option=${p.isOption})`));
          setProducts(data);
        }
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, []);

  // Main address autocomplete — Step 0 (adresse du bien)
  useAddressAutocomplete(
    autocompleteRef,
    useCallback((f) => {
      setForm((p) => ({
        ...p,
        rue: f.rue,
        numero: f.numero,
        codePostal: f.codePostal,
        commune: f.commune,
        boite: "",
      }));
      setAddressSelected(true);
    }, []),
    step === 0,
  );

  // New tenant address autocomplete — Step 1 (sortie locative)
  useAddressAutocomplete(
    newAddressAutocompleteRef,
    useCallback((f) => {
      setForm((p) => ({
        ...p,
        locataireNewRue: f.rue,
        locataireNewNumero: f.numero,
        locataireNewCodePostal: f.codePostal,
        locataireNewCommune: f.commune,
        locataireNewBoite: "",
      }));
      setNewAddressSelected(true);
    }, []),
    step === 1 && form.typeMission === "sortie",
  );

  const mainProducts = useMemo(() => {
    if (!form.typeMission) return [];
    const code = form.typeMission === "entree" ? "ELLE" : "ELLS";
    const isEntree = form.typeMission === "entree";
    const filtered = products
      .filter(
        (p) => {
          if (p.isOption) return false;
          if (HIDDEN_OPTIONS.some((h) => p.defaultCode.includes(h))) return false;
          // Exclude products whose label contains "sortie" when mission is entree
          if (isEntree && p.displayLabel.toLowerCase().includes("sortie")) return false;
          // Product matches the mission type code directly
          if (p.defaultCode.includes(code)) return true;
          // COMMUNS products: filter by displayLabel to avoid code mismatch (ELE≠ELLE, ELS≠ELLS)
          if (p.defaultCode.toUpperCase().includes("COMMUNS")) {
            if (form.typeMission === "entree") {
              return !p.displayLabel.toLowerCase().includes("sortie");
            } else {
              return !p.displayLabel.toLowerCase().includes("entrée") &&
                     !p.displayLabel.toLowerCase().includes("entree");
            }
          }
          return false;
        }
      )
      .sort((a, b) => {
        const aEnd = a.defaultCode.toUpperCase().includes("COMMUNS") || a.defaultCode.includes("Bureau");
        const bEnd = b.defaultCode.toUpperCase().includes("COMMUNS") || b.defaultCode.includes("Bureau");
        if (aEnd === bEnd) return 0;
        return aEnd ? 1 : -1;
      });
    console.log(`[mainProducts] typeMission=${form.typeMission} code=${code}`, filtered.map(p => `${p.defaultCode} → "${p.displayLabel}"`));
    return filtered;
  }, [products, form.typeMission]);

  const optionProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products.filter(
      (p) =>
        (p.isOption || p.defaultCode.includes("OPT_METRE")) &&
        !HIDDEN_OPTIONS.some((h) => p.defaultCode.includes(h)) &&
        !p.defaultCode.includes("DEP.INUTILE") &&
        !p.defaultCode.includes("URGENT") &&
        !p.defaultCode.includes("COMMUNS") &&
        !p.defaultCode.includes("Bur.Com")
    );
  }, [products, selectedProduct]);

  // Auto-select OPT_FR by default when options become available
  useEffect(() => {
    const optFr = optionProducts.find((p) => p.defaultCode.includes("OPT_FR"));
    if (optFr && !selectedOptions.some((o) => o.id === optFr.id)) {
      setSelectedOptions((prev) => [...prev, optFr]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionProducts]);

  const update = useCallback(
    (field: keyof FormData, value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
    []
  );

  const canNext = () => {
    if (step === 0)
      return form.typeMission !== "" && !!form.rue && !!form.codePostal && !!form.commune;
    if (step === 1) {
      if (!form.locataireNom || !form.locatairePrenom) return false;
      if (form.locataireEmail && !EMAIL_REGEX.test(form.locataireEmail)) return false;
      if (form.representantEnabled) {
        if (!form.representantPrenom || !form.representantNom || !form.representantRole) return false;
        if (form.representantRole === "Autre" && !form.representantRoleCustom) return false;
        if (form.representantEmail && !EMAIL_REGEX.test(form.representantEmail)) return false;
      }
      return true;
    }
    return true;
  };

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setSubmitProgress(0);

    // Fake progress animation: 0→90% over ~8 seconds
    const progressStart = Date.now();
    const progressDuration = 8000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - progressStart;
      const pct = Math.min(90, (elapsed / progressDuration) * 90);
      setSubmitProgress(pct);
    }, 100);

    try {
      // Convert files to base64 in browser (bypasses RLS issues with Storage)
      function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error(`Lecture échouée: ${file.name}`));
          reader.readAsDataURL(file);
        });
      }

      const MAX_SIZE = 3 * 1024 * 1024;
      const documentsPayload: { name: string; customName: string; base64: string }[] = [];

      // Include stored documents from draft (already in Storage)
      for (const stored of storedDocuments) {
        try {
          const { data: blob } = await supabase.storage
            .from("rdv-documents")
            .download(stored.path);
          if (blob) {
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );
            documentsPayload.push({
              name: stored.name,
              customName: stored.customName,
              base64,
            });
          }
        } catch (err) {
          console.error(`[Submit] Failed to fetch stored doc "${stored.name}":`, err);
        }
      }

      // Include newly added files from the form
      for (const doc of form.documents) {
        if (doc.file.size > MAX_SIZE) {
          console.warn(`[Upload] "${doc.file.name}" too large (${doc.file.size} bytes), skipping`);
          continue;
        }
        const ext = doc.file.name.split(".").pop() || "";
        const finalName = (doc.customName || doc.file.name.replace(/\.[^/.]+$/, "")) + (ext ? `.${ext}` : "");
        documentsPayload.push({
          name: finalName,
          customName: doc.customName || doc.file.name.replace(/\.[^/.]+$/, ""),
          base64: await fileToBase64(doc.file),
        });
      }

      const res = await fetch("/api/submit-rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeMission: form.typeMission,
          typeBien: form.typeBien,
          rue: form.rue,
          numero: form.numero,
          boite: form.boite,
          codePostal: form.codePostal,
          commune: form.commune,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          bailleurSociete: form.bailleurSociete,
          bailleurNom: form.bailleurNom,
          bailleurPrenom: form.bailleurPrenom,
          bailleurEmail: form.bailleurEmail,
          bailleurTelephone: form.bailleurTelephone,
          locataireNom: form.locataireNom,
          locatairePrenom: form.locatairePrenom,
          locataireEmail: form.locataireEmail,
          locataireTelephone: form.locataireTelephone,
          locataireNewRue: form.locataireNewRue,
          locataireNewNumero: form.locataireNewNumero,
          locataireNewBoite: form.locataireNewBoite,
          locataireNewCodePostal: form.locataireNewCodePostal,
          locataireNewCommune: form.locataireNewCommune,
          representantEnabled: form.representantEnabled,
          representantPrenom: form.representantPrenom,
          representantNom: form.representantNom,
          representantRole: form.representantRole === "Autre" ? form.representantRoleCustom : form.representantRole,
          representantEmail: form.representantEmail,
          representantTelephone: form.representantTelephone,
          locataireDecede: form.locataireDecede,
          numeroPO: form.numeroPO,
          notesLibres: form.notesLibres,
          compteurEau: form.compteurEau,
          compteurGaz: form.compteurGaz,
          compteurElec: form.compteurElec,
          selectedProduct: selectedProduct
            ? { id: selectedProduct.id, odooName: selectedProduct.odooName, defaultCode: selectedProduct.defaultCode, displayLabel: selectedProduct.displayLabel, listPrice: selectedProduct.listPrice }
            : null,
          selectedOptions: selectedOptions.map((o) => ({
            id: o.id, odooName: o.odooName, defaultCode: o.defaultCode, displayLabel: o.displayLabel, listPrice: o.listPrice,
          })),
          documents: documentsPayload,
        }),
      });
      const json = await res.json();
      clearInterval(progressInterval);
      if (!res.ok) throw new Error(json.error || "Erreur serveur");
      setSubmitProgress(100);
      // Delete draft after successful submit
      if (draftId) {
        fetch(`/api/drafts/${draftId}`, { method: "DELETE" }).catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 400));
      router.push("/confirmation");
    } catch (err) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    if (savingDraft || !user) return;
    setSavingDraft(true);
    setDraftSaved(false);
    try {
      // Upload new files to Storage under drafts/{draftId}/
      const tempDraftId = draftId || crypto.randomUUID();
      const newDocPaths: StoredDocument[] = [];

      for (const doc of form.documents) {
        const ext = doc.file.name.split(".").pop() || "";
        const finalName = (doc.customName || doc.file.name.replace(/\.[^/.]+$/, "")) + (ext ? `.${ext}` : "");
        const storagePath = `${user.id}/drafts/${tempDraftId}/${finalName}`;

        const { error: uploadErr } = await supabase.storage
          .from("rdv-documents")
          .upload(storagePath, doc.file, { contentType: doc.file.type, upsert: true });

        if (!uploadErr) {
          newDocPaths.push({
            path: storagePath,
            name: doc.file.name,
            customName: doc.customName,
            size: doc.file.size,
          });
        } else {
          console.error(`[Draft] Upload failed for "${doc.file.name}":`, uploadErr.message);
        }
      }

      // Combine with existing stored documents
      const allDocPaths = [...storedDocuments, ...newDocPaths];

      // Serialize form without File objects
      const { documents: _docs, ...formWithoutFiles } = form;

      // Generate title
      const adresse = form.rue && form.commune ? `${form.rue} ${form.numero}, ${form.commune}` : "";
      const title = adresse
        || `Brouillon du ${new Date().toLocaleDateString("fr-BE")}`;

      const payload = {
        id: draftId || undefined,
        formData: formWithoutFiles,
        selectedProduct: selectedProduct
          ? { id: selectedProduct.id, odooName: selectedProduct.odooName, defaultCode: selectedProduct.defaultCode, displayLabel: selectedProduct.displayLabel, listPrice: selectedProduct.listPrice }
          : null,
        selectedOptions: selectedOptions.map((o) => ({
          id: o.id, odooName: o.odooName, defaultCode: o.defaultCode, displayLabel: o.displayLabel, listPrice: o.listPrice,
        })),
        currentStep: step,
        documentPaths: allDocPaths,
        title,
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/dashboard");
        return;
      } else {
        const err = await res.json();
        setError(err.error || "Erreur lors de la sauvegarde du brouillon");
      }
    } catch (err) {
      console.error("[Draft] Save failed:", err);
      setError("Erreur lors de la sauvegarde du brouillon");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!user || draftLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">{draftLoading ? "Chargement du brouillon..." : "Chargement..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png" alt="Axis Experts" style={{ height: '32px', objectFit: 'contain' }} />
            <span className="font-bold text-lg text-dark">Axis Experts</span>
          </div>
          <div className="flex items-center gap-4">
            {portalClient?.logo_url && (
              <div className="max-w-[120px] overflow-hidden">
                <img src={portalClient.logo_url} alt={portalClient.nom_societe || "Client"} style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            <button
              onClick={saveDraft}
              disabled={savingDraft}
              className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {savingDraft ? (
                <span className="animate-pulse">Sauvegarde...</span>
              ) : draftSaved ? (
                <span className="text-green-600">Brouillon enregistré</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Brouillon
                </>
              )}
            </button>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-dark transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-5 ${step === 4 ? "max-w-6xl" : "max-w-3xl"}`}>
        {/* Stepper — centered with fixed layout */}
        <div className="flex items-center justify-center mb-6 max-w-lg mx-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step
                      ? "bg-primary text-white"
                      : i === step
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1 whitespace-nowrap ${i <= step ? "text-dark font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 mt-[-12px] ${i < step ? "bg-primary" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7">
          {/* Step 1: Mission */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-dark">Type de mission</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "entree", label: "Entrée locative", icon: "M11 16l-4-4m0 0l4-4m-4 4h14" },
                  { value: "sortie", label: "Sortie locative", icon: "M13 16l4-4m0 0l-4-4m4 4H3" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (form.typeMission !== opt.value) {
                        setSelectedProduct(null);
                        setSelectedOptions([]);
                        update("typeBien", "");
                      }
                      update("typeMission", opt.value);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.typeMission === opt.value
                        ? "border-primary bg-primary-light"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <svg className={`w-5 h-5 mb-1 ${form.typeMission === opt.value ? "text-primary" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                    </svg>
                    <div className="font-semibold text-dark text-sm">{opt.label}</div>
                  </button>
                ))}
              </div>

              {form.typeMission && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Type de bien</label>
                  {productsLoading ? (
                    <div className="text-sm text-gray-400 animate-pulse">Chargement des produits...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {mainProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            setSelectedOptions([]);
                            update("typeBien", p.defaultCode);
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedProduct?.id === p.id
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

              {selectedProduct && optionProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Options</label>
                  <div className="flex flex-wrap gap-2">
                    {optionProducts.map((p) => {
                      const isSelected = selectedOptions.some((o) => o.id === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const isLang = p.defaultCode.includes("OPT_FR") || p.defaultCode.includes("OPT_NL");
                            setSelectedOptions((prev) => {
                              if (isSelected) return prev.filter((o) => o.id !== p.id);
                              const filtered = isLang
                                ? prev.filter((o) => !o.defaultCode.includes("OPT_FR") && !o.defaultCode.includes("OPT_NL"))
                                : prev;
                              return [...filtered, p];
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {p.displayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Adresse du bien</label>
                <p className="text-xs text-gray-400 mb-2">Tapez une adresse pour la rechercher automatiquement</p>
                <div className="relative mb-0">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z" />
                  </svg>
                  <input
                    ref={autocompleteRef}
                    type="text"
                    placeholder="Rechercher une adresse..."
                    className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-300 bg-gray-50 text-dark placeholder-gray-500 text-base"
                  />
                </div>
                <p className="text-sm text-gray-400 italic text-center my-3">ou remplissez manuellement</p>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-4">
                    <input
                      placeholder="Rue *"
                      value={form.rue}
                      onChange={(e) => update("rue", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      placeholder="N° *"
                      value={form.numero}
                      onChange={(e) => update("numero", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      placeholder="Boîte"
                      value={form.boite}
                      onChange={(e) => update("boite", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      placeholder="Code postal *"
                      value={form.codePostal}
                      onChange={(e) => update("codePostal", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      placeholder="Commune *"
                      value={form.commune}
                      onChange={(e) => update("commune", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Date souhaitée <span className="text-gray-400">(optionnel)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entre le</label>
                    <input
                      type="date"
                      value={form.dateDebut}
                      onChange={(e) => update("dateDebut", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Et le</label>
                    <input
                      type="date"
                      value={form.dateFin}
                      onChange={(e) => update("dateFin", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Parties */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Informations des parties</h2>

              {/* Bailleur — read-only from portal_clients */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-dark flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
                  Bailleur
                  {portalClient && <span className="text-xs text-gray-400 font-normal ml-auto">Depuis votre profil</span>}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {portalClient ? (
                    <>
                      {form.bailleurSociete && (
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Société</label>
                          <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-dark text-sm">{form.bailleurSociete}</div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nom</label>
                        <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-dark text-sm">{form.bailleurNom || "—"}</div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Email</label>
                        <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-dark text-sm">{form.bailleurEmail || "—"}</div>
                      </div>
                      {form.bailleurTelephone && (
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                          <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-dark text-sm">{form.bailleurTelephone}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        placeholder="Société (optionnel)"
                        value={form.bailleurSociete}
                        onChange={(e) => update("bailleurSociete", e.target.value)}
                        className="col-span-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                      <input
                        placeholder="Prénom"
                        value={form.bailleurPrenom}
                        onChange={(e) => update("bailleurPrenom", e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                      <input
                        placeholder="Nom"
                        value={form.bailleurNom}
                        onChange={(e) => update("bailleurNom", e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={form.bailleurEmail}
                        onChange={(e) => update("bailleurEmail", e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                      <input
                        placeholder="Téléphone"
                        value={form.bailleurTelephone}
                        onChange={(e) => update("bailleurTelephone", e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Locataire — editable */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-dark flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
                  Locataire
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Prénom *"
                    value={form.locatairePrenom}
                    onChange={(e) => update("locatairePrenom", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                  />
                  <input
                    placeholder="Nom *"
                    value={form.locataireNom}
                    onChange={(e) => update("locataireNom", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={form.locataireEmail}
                    onChange={(e) => update("locataireEmail", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                  />
                  <input
                    placeholder="Téléphone"
                    value={form.locataireTelephone}
                    onChange={(e) => update("locataireTelephone", e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Représentant du locataire */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, representantEnabled: !f.representantEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.representantEnabled ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.representantEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-gray-600">Le locataire est représenté par :</span>
              </div>

              {form.representantEnabled && (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-dark flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">3</span>
                    Contact représentant
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Prénom *"
                      value={form.representantPrenom}
                      onChange={(e) => update("representantPrenom", e.target.value)}
                      className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                    />
                    <input
                      placeholder="Nom *"
                      value={form.representantNom}
                      onChange={(e) => update("representantNom", e.target.value)}
                      className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                    />
                    <select
                      value={form.representantRole}
                      onChange={(e) => update("representantRole", e.target.value)}
                      className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark"
                    >
                      <option value="">Rôle *</option>
                      <option value="Assistant social">Assistant social</option>
                      <option value="Avocat">Avocat</option>
                      <option value="Administrateur provisoire">Administrateur provisoire</option>
                      <option value="Tuteur">Tuteur</option>
                      <option value="Autre">Autre</option>
                    </select>
                    {form.representantRole === "Autre" && (
                      <input
                        placeholder="Précisez le rôle *"
                        type="text"
                        value={form.representantRoleCustom}
                        onChange={(e) => update("representantRoleCustom", e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                      />
                    )}
                    <input
                      placeholder="Email"
                      type="email"
                      value={form.representantEmail}
                      onChange={(e) => update("representantEmail", e.target.value)}
                      className={`px-4 py-3 rounded-xl border bg-white text-dark placeholder-gray-400 ${form.representantEmail && !EMAIL_REGEX.test(form.representantEmail) ? "border-red-300" : "border-gray-200"}`}
                    />
                    <input
                      placeholder="Téléphone (optionnel)"
                      value={form.representantTelephone}
                      onChange={(e) => update("representantTelephone", e.target.value)}
                      className="col-span-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              {form.typeMission === "sortie" && (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-dark flex items-center gap-2">
                    Nouvelle adresse du locataire <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                  </h3>
                  <input
                    ref={newAddressAutocompleteRef}
                    type="text"
                    placeholder="Rechercher une adresse..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-dark placeholder-gray-400 text-sm"
                  />
                  {newAddressSelected && (
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-4">
                        <input
                          placeholder="Rue"
                          value={form.locataireNewRue}
                          onChange={(e) => update("locataireNewRue", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          placeholder="N°"
                          value={form.locataireNewNumero}
                          onChange={(e) => update("locataireNewNumero", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          placeholder="Boîte"
                          value={form.locataireNewBoite}
                          onChange={(e) => update("locataireNewBoite", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          placeholder="Code postal"
                          value={form.locataireNewCodePostal}
                          onChange={(e) => update("locataireNewCodePostal", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          placeholder="Commune"
                          value={form.locataireNewCommune}
                          onChange={(e) => update("locataireNewCommune", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Documents joints */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Documents joints</h2>
              <p className="text-gray-500 text-sm">Joignez les documents utiles à votre demande (optionnel). PDF, Word ou Excel, max 3 Mo par fichier.</p>

              {storedDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Fichiers déjà joints</p>
                  {storedDocuments.map((doc, index) => (
                    <div key={`stored-${index}`} className="flex items-center gap-3 bg-green-50 rounded-xl p-3 mb-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{doc.customName || doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size < 1024 ? `${doc.size} o` : doc.size < 1048576 ? `${(doc.size / 1024).toFixed(1)} Ko` : `${(doc.size / 1048576).toFixed(1)} Mo`}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStoredDocuments((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="text-gray-400 hover:text-red-500 text-xl leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{doc.file.name}</p>
                    <input
                      type="text"
                      value={doc.customName}
                      onChange={(e) => {
                        setForm((prev) => {
                          const docs = [...prev.documents];
                          docs[index] = { ...docs[index], customName: e.target.value };
                          return { ...prev, documents: docs };
                        });
                      }}
                      placeholder={doc.file.name.replace(/\.[^/.]+$/, "")}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-dark mt-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        documents: prev.documents.filter((_, i) => i !== index),
                      }));
                    }}
                    className="text-gray-400 hover:text-red-500 text-xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              ))}

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  multiple
                  accept="application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  id="file-documents"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const allowedTypes = [
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      "application/vnd.ms-excel",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ];
                    const valid: DocumentFile[] = [];
                    for (const file of files) {
                      if (!allowedTypes.includes(file.type)) continue;
                      if (file.size > 3 * 1024 * 1024) continue;
                      valid.push({ file, customName: file.name.replace(/\.[^/.]+$/, "") });
                    }
                    if (valid.length > 0) {
                      setForm((prev) => ({ ...prev, documents: [...prev.documents, ...valid] }));
                    }
                    e.target.value = "";
                  }}
                />
                <label htmlFor="file-documents" className="cursor-pointer">
                  <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-500">Cliquez pour sélectionner des fichiers</span>
                  <span className="block text-xs text-gray-400 mt-1">PDF, Word ou Excel, max 3 Mo par fichier</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Informations */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Informations complémentaires</h2>

              {form.typeMission === "sortie" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, locataireDecede: !f.locataireDecede }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.locataireDecede ? "bg-red-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.locataireDecede ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-gray-600">Le locataire est décédé</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Numéro de bon de commande (PO) <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: PO-2026-1234"
                  value={form.numeroPO}
                  onChange={(e) => update("numeroPO", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Notes libres <span className="text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  placeholder="Informations complémentaires pour notre équipe..."
                  value={form.notesLibres}
                  onChange={(e) => update("notesLibres", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Numéros de compteurs <span className="text-gray-400">(optionnel)</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">N° compteur eau</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345678"
                      value={form.compteurEau}
                      onChange={(e) => update("compteurEau", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">N° compteur gaz</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345678"
                      value={form.compteurGaz}
                      onChange={(e) => update("compteurGaz", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">N° compteur électricité</label>
                    <input
                      type="text"
                      placeholder="Ex: 12345678"
                      value={form.compteurElec}
                      onChange={(e) => update("compteurElec", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Récapitulatif */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Récapitulatif</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left column: Mission + Bailleur + Locataire + Représentant */}
                <div className="space-y-4">
                  <SummarySection title="Mission">
                    <SummaryRow label="Type" value={form.typeMission === "entree" ? "Entrée locative" : "Sortie locative"} />
                    <SummaryRow label="Bien" value={selectedProduct?.displayLabel || form.typeBien} />
                    <SummaryRow
                      label="Adresse"
                      value={`${form.rue} ${form.numero}${form.boite ? ` bte ${form.boite}` : ""}, ${form.codePostal} ${form.commune}`}
                    />
                    {form.dateDebut && (
                      <SummaryRow label="Date souhaitée" value={`Du ${form.dateDebut} au ${form.dateFin || "..."}`} />
                    )}
                  </SummarySection>

                  <SummarySection title="Bailleur">
                    {form.bailleurSociete && <SummaryRow label="Société" value={form.bailleurSociete} />}
                    <SummaryRow label="Nom" value={form.bailleurPrenom ? `${form.bailleurPrenom} ${form.bailleurNom}` : form.bailleurNom} />
                    <SummaryRow label="Email" value={form.bailleurEmail} />
                    {form.bailleurTelephone && <SummaryRow label="Tél." value={form.bailleurTelephone} />}
                  </SummarySection>

                  <SummarySection title="Locataire">
                    <SummaryRow label="Nom" value={`${form.locatairePrenom} ${form.locataireNom}`} />
                    {form.locataireEmail && <SummaryRow label="Email" value={form.locataireEmail} />}
                    {form.locataireTelephone && <SummaryRow label="Tél." value={form.locataireTelephone} />}
                    {form.locataireNewRue && (
                      <SummaryRow
                        label="Nouvelle adresse"
                        value={`${form.locataireNewRue} ${form.locataireNewNumero}${form.locataireNewBoite ? ` bte ${form.locataireNewBoite}` : ""}, ${form.locataireNewCodePostal} ${form.locataireNewCommune}`}
                      />
                    )}
                    {form.locataireDecede && <SummaryRow label="Statut" value="Locataire décédé" />}
                  </SummarySection>

                  {form.representantEnabled && form.representantNom && (
                    <SummarySection title="Représentant du locataire">
                      <SummaryRow label="Nom" value={`${form.representantPrenom} ${form.representantNom}`} />
                      <SummaryRow label="Rôle" value={form.representantRole === "Autre" ? form.representantRoleCustom : form.representantRole} />
                      <SummaryRow label="Email" value={form.representantEmail} />
                      {form.representantTelephone && <SummaryRow label="Tél." value={form.representantTelephone} />}
                    </SummarySection>
                  )}
                </div>

                {/* Right column: Tarification + Documents + Informations */}
                <div className="space-y-4">
                  {selectedProduct && (() => {
                    const articles = [selectedProduct, ...selectedOptions];
                    const subtotalHTVA = articles.reduce((sum, p) => sum + p.listPrice, 0);
                    const tva = subtotalHTVA * 0.21;
                    const totalTVAC = subtotalHTVA + tva;
                    return (
                      <SummarySection title="Tarification">
                        {articles.map((p) => (
                          <SummaryRow key={p.id} label={p.displayLabel} value={formatEuro(p.listPrice)} />
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 space-y-1">
                          <SummaryRow label="Sous-total HTVA" value={formatEuro(subtotalHTVA)} />
                          <SummaryRow label="TVA 21 %" value={formatEuro(tva)} />
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-dark">Total TVAC</span>
                            <span className="text-dark">{formatEuro(totalTVAC)}</span>
                          </div>
                        </div>
                      </SummarySection>
                    );
                  })()}

                  <SummarySection title="Documents joints">
                    {storedDocuments.length === 0 && form.documents.length === 0 ? (
                      <SummaryRow label="Fichiers" value="Aucun" />
                    ) : (
                      <>
                        {storedDocuments.map((doc, i) => (
                          <div key={`stored-${i}`} className="flex justify-between text-sm">
                            <span className="text-gray-500">Fichier {i + 1}</span>
                            <span className="font-medium text-dark max-w-xs truncate">{doc.customName || doc.name}</span>
                          </div>
                        ))}
                        {form.documents.map((doc, i) => (
                          <div key={`new-${i}`} className="flex justify-between text-sm">
                            <span className="text-gray-500">Fichier {storedDocuments.length + i + 1}</span>
                            <span className="font-medium text-dark max-w-xs truncate">{doc.customName || doc.file.name}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </SummarySection>

                  {(form.numeroPO || form.notesLibres || form.compteurEau || form.compteurGaz || form.compteurElec) && (
                    <SummarySection title="Informations">
                      {form.numeroPO && <SummaryRow label="N° PO" value={form.numeroPO} />}
                      {form.notesLibres && <SummaryRow label="Notes" value={form.notesLibres} />}
                      {form.compteurEau && <SummaryRow label="Eau" value={form.compteurEau} />}
                      {form.compteurGaz && <SummaryRow label="Gaz" value={form.compteurGaz} />}
                      {form.compteurElec && <SummaryRow label="Électricité" value={form.compteurElec} />}
                    </SummarySection>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              ) : submitting ? (
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${submitProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {submitProgress < 70
                      ? "Création de votre demande en cours..."
                      : "Finalisation..."}
                  </p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={savingDraft}
                    className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {savingDraft ? "Sauvegarde..." : draftSaved ? "Brouillon enregistré" : "Enregistrer en brouillon"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                    aria-disabled={submitting}
                    className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer la demande
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Submit confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#F5B800]/15 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F5B800"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-dark text-center">
              Confirmer l&apos;envoi de la demande
            </h3>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Votre demande de mission sera transmise à l&apos;équipe Axis Experts. Cette action est définitive.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                Confirmer l&apos;envoi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel request confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-dark">Abandonner la demande ?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Les données non sauvegardées seront perdues.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Continuer la demande
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                Abandonner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatEuro(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + " €";
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h3 className="font-semibold text-dark text-sm mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-dark">{value}</span>
    </div>
  );
}
