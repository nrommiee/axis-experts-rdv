"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { FormData } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

const STEPS = ["Mission", "Parties", "Documents", "Récapitulatif"];

interface PortalClient {
  nom_societe: string | null;
  nom_bailleur: string | null;
  email_bailleur: string | null;
  telephone_bailleur: string | null;
}

interface Product {
  id: number;
  odooName: string;
  defaultCode: string;
  displayLabel: string;
  listPrice: number;
  isOption: boolean;
}

const HIDDEN_OPTIONS = ["DEP.INUTILE", "URGENT_24h", "URGENT_24h_CO"];

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
  bail: null,
  edlEntree: null,
};

export default function DemandePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [user, setUser] = useState<User | null>(null);
  const [portalClient, setPortalClient] = useState<PortalClient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Product[]>([]);
  const [addressSelected, setAddressSelected] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
  const router = useRouter();
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
        .select("nom_societe, nom_bailleur, email_bailleur, telephone_bailleur")
        .eq("user_id", user.id)
        .single();

      if (clientRow) {
        setPortalClient(clientRow);
        setForm((f) => ({
          ...f,
          bailleurSociete: clientRow.nom_societe || "",
          bailleurNom: clientRow.nom_bailleur || "",
          bailleurEmail: clientRow.email_bailleur || user.email || "",
          bailleurTelephone: clientRow.telephone_bailleur || "",
        }));
      } else {
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
    }
    load();
  }, [router, supabase]);

  useEffect(() => {
    fetch("/api/odoo/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !autocompleteRef.current) return;

    let listener: google.maps.MapsEventListener | null = null;

    const setupAutocomplete = () => {
      if (!autocompleteRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
        componentRestrictions: { country: "be" },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      });

      autocompleteInstanceRef.current = autocomplete;

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let rue = "";
        let numero = "";
        let codePostal = "";
        let commune = "";

        for (const comp of place.address_components) {
          const type = comp.types[0];
          if (type === "route") rue = comp.long_name;
          else if (type === "street_number") numero = comp.long_name;
          else if (type === "postal_code") codePostal = comp.long_name;
          else if (type === "locality") commune = comp.long_name;
        }

        setForm((f) => ({
          ...f,
          rue,
          numero,
          codePostal,
          commune,
          boite: "",
        }));
        setAddressSelected(true);
      });
    };

    // If Google Maps is already loaded (e.g. hot reload), init directly
    if (window.google?.maps?.places) {
      setupAutocomplete();
      return () => {
        if (listener) google.maps.event.removeListener(listener);
      };
    }

    // Define global callback before loading the script
    (window as unknown as Record<string, unknown>).initAutocomplete = setupAutocomplete;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      delete (window as unknown as Record<string, unknown>).initAutocomplete;
    };
  }, []);

  const mainProducts = useMemo(() => {
    if (!form.typeMission) return [];
    const code = form.typeMission === "entree" ? "ELLE" : "ELLS";
    return products
      .filter(
        (p) => !p.isOption && (p.defaultCode.includes(code) || p.defaultCode.includes("COMMUNS"))
      )
      .sort((a, b) => {
        const aEnd = a.defaultCode.includes("COMMUNS") || a.defaultCode.includes("Bureau");
        const bEnd = b.defaultCode.includes("COMMUNS") || b.defaultCode.includes("Bureau");
        if (aEnd === bEnd) return 0;
        return aEnd ? 1 : -1;
      });
  }, [products, form.typeMission]);

  const optionProducts = useMemo(() => {
    if (!form.typeMission || !selectedProduct) return [];
    const code = form.typeMission === "entree" ? "ELLE" : "ELLS";
    return products.filter(
      (p) =>
        p.isOption &&
        (p.defaultCode.includes(code) || p.defaultCode.includes("COMMUNS")) &&
        !HIDDEN_OPTIONS.includes(p.defaultCode)
    );
  }, [products, form.typeMission, selectedProduct]);

  const update = useCallback(
    (field: keyof FormData, value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
    []
  );

  const canNext = () => {
    if (step === 0)
      return form.typeMission && selectedProduct && form.rue && form.numero && form.codePostal && form.commune;
    if (step === 1)
      return form.locataireNom && form.locatairePrenom;
    return true;
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      // Convert files to base64 in browser (bypasses RLS issues with Storage)
      const files: { bail?: { name: string; base64: string }; edlEntree?: { name: string; base64: string } } = {};

      function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g. "data:application/pdf;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error(`Lecture échouée: ${file.name}`));
          reader.readAsDataURL(file);
        });
      }

      // Only include files under 3MB (base64 expands ~33%, Vercel limit ~4.5MB)
      const MAX_SIZE = 3 * 1024 * 1024;

      if (form.bail) {
        if (form.bail.size > MAX_SIZE) {
          console.warn(`[Upload] Bail "${form.bail.name}" too large (${form.bail.size} bytes), skipping`);
        } else {
          files.bail = { name: form.bail.name, base64: await fileToBase64(form.bail) };
        }
      }
      if (form.edlEntree) {
        if (form.edlEntree.size > MAX_SIZE) {
          console.warn(`[Upload] EDL "${form.edlEntree.name}" too large (${form.edlEntree.size} bytes), skipping`);
        } else {
          files.edlEntree = { name: form.edlEntree.name, base64: await fileToBase64(form.edlEntree) };
        }
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
          selectedProduct: selectedProduct
            ? { id: selectedProduct.id, odooName: selectedProduct.odooName, defaultCode: selectedProduct.defaultCode, displayLabel: selectedProduct.displayLabel, listPrice: selectedProduct.listPrice }
            : null,
          selectedOptions: selectedOptions.map((o) => ({
            id: o.id, odooName: o.odooName, defaultCode: o.defaultCode, displayLabel: o.displayLabel, listPrice: o.listPrice,
          })),
          files,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur serveur");
      router.push("/confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-lg text-dark">Axis Experts</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-dark transition-colors">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
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
                          onClick={() =>
                            setSelectedOptions((prev) =>
                              isSelected ? prev.filter((o) => o.id !== p.id) : [...prev, p]
                            )
                          }
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
                <label className="block text-sm font-medium text-gray-600 mb-2">Adresse du bien</label>
                <input
                  ref={autocompleteRef}
                  type="text"
                  placeholder="Rechercher une adresse..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm mb-2"
                />
                {addressSelected && (
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-4">
                      <input
                        placeholder="Rue"
                        value={form.rue}
                        onChange={(e) => update("rue", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        placeholder="N°"
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
                        placeholder="Code postal"
                        value={form.codePostal}
                        onChange={(e) => update("codePostal", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        placeholder="Commune"
                        value={form.commune}
                        onChange={(e) => update("commune", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm"
                      />
                    </div>
                  </div>
                )}
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
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Documents</h2>
              <p className="text-gray-500 text-sm">Joignez les documents utiles à votre demande (optionnel).</p>

              <FileUpload
                label="Bail"
                file={form.bail}
                onChange={(f) => setForm((prev) => ({ ...prev, bail: f }))}
              />

              {form.typeMission === "sortie" && (
                <FileUpload
                  label="État des lieux d'entrée"
                  file={form.edlEntree}
                  onChange={(f) => setForm((prev) => ({ ...prev, edlEntree: f }))}
                />
              )}
            </div>
          )}

          {/* Step 4: Récapitulatif */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-dark">Récapitulatif</h2>

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
                </SummarySection>

                <SummarySection title="Documents">
                  <SummaryRow label="Bail" value={form.bail?.name || "Non fourni"} />
                  {form.typeMission === "sortie" && (
                    <SummaryRow label="EDL entrée" value={form.edlEntree?.name || "Non fourni"} />
                  )}
                </SummarySection>
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

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi en cours..." : "Envoyer la demande"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatEuro(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + " €";
}

function FileUpload({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary transition-colors">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        id={`file-${label}`}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <label htmlFor={`file-${label}`} className="cursor-pointer">
        {file ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onChange(null); }}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              &times;
            </button>
          </div>
        ) : (
          <div>
            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-gray-500">{label} — Cliquez pour sélectionner un fichier</span>
            <span className="block text-xs text-gray-400 mt-1">PDF, JPG ou PNG</span>
          </div>
        )}
      </label>
    </div>
  );
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
