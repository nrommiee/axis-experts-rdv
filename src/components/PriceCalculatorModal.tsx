"use client";

import { useEffect, useMemo, useState } from "react";

export type MissionType = "entree" | "sortie";
export type BienType = "appart" | "maison" | "studio" | "kot";
export type DefenseParty = "proprietaire" | "locataire";

export interface PriceSelection {
  missionType: MissionType;
  bienType: BienType;
  chambres: number | null;
  extraRooms: number;
  supplements: string[];
  basePrice: number;
  totalHtva: number;
  totalTvac: number;
  contreExpert: boolean;
  defenseParty: DefenseParty | null;
  odooCode: string | null;
}

interface CatalogEntry {
  odoo_default_code: string;
  label: string;
  price: number;
}

type Catalog = Record<string, CatalogEntry>;

interface PriceCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (selection: PriceSelection) => void;
}

// Fallback prices used when the catalog does not yet have a matching entry.
const FALLBACK_PRICES: Record<string, number> = {
  entree_appart_1: 165,
  entree_appart_2: 185,
  entree_appart_3: 205,
  entree_appart_4: 225,
  entree_appart_5: 245,
  entree_maison_1: 195,
  entree_maison_2: 215,
  entree_maison_3: 235,
  entree_maison_4: 255,
  entree_maison_5: 275,
  entree_studio: 145,
  entree_kot: 125,
  sortie_appart_1: 175,
  sortie_appart_2: 195,
  sortie_appart_3: 215,
  sortie_appart_4: 235,
  sortie_appart_5: 255,
  sortie_maison_1: 205,
  sortie_maison_2: 225,
  sortie_maison_3: 245,
  sortie_maison_4: 265,
  sortie_maison_5: 285,
  sortie_studio: 155,
  sortie_kot: 135,
};

const SUPPLEMENT_DEFS: { id: string; label: string; price: number }[] = [
  { id: "meuble", label: "Meublé", price: 60 },
  { id: "garage", label: "Garage", price: 15 },
  { id: "sanitaire", label: "Sanitaire suppl.", price: 15 },
  { id: "jardin", label: "Jardin", price: 15 },
];

const EXTRA_ROOM_PRICE = 15;
const TVA_RATE = 0.21;

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function buildCatalogKey(
  missionType: MissionType,
  bienType: BienType,
  chambres: number | null
): string {
  if (bienType === "studio" || bienType === "kot") {
    return `${missionType}_${bienType}`;
  }
  const count = chambres ?? 1;
  return `${missionType}_${bienType}_${count}`;
}

export default function PriceCalculatorModal({
  open,
  onClose,
  onSelect,
}: PriceCalculatorModalProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [missionType, setMissionType] = useState<MissionType>("entree");
  const [bienType, setBienType] = useState<BienType>("appart");
  const [chambres, setChambres] = useState<number>(1);
  const [extraRooms, setExtraRooms] = useState<number>(0);
  const [supplements, setSupplements] = useState<string[]>([]);
  const [contreExpert, setContreExpert] = useState<boolean>(false);
  const [defenseParty, setDefenseParty] =
    useState<DefenseParty>("proprietaire");

  // Reset local state each time the modal opens
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMissionType("entree");
      setBienType("appart");
      setChambres(1);
      setExtraRooms(0);
      setSupplements([]);
      setContreExpert(false);
      setDefenseParty("proprietaire");
    }
  }

  // Load catalog when modal opens
  useEffect(() => {
    if (!open) return;
    if (catalog !== null) return;
    setCatalogLoading(true);
    setCatalogError(null);
    fetch("/api/agency/price-catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement du catalogue impossible");
        return r.json();
      })
      .then((data) => {
        setCatalog((data ?? {}) as Catalog);
      })
      .catch((err) => {
        setCatalogError(
          err instanceof Error ? err.message : "Erreur inconnue"
        );
      })
      .finally(() => setCatalogLoading(false));
  }, [open, catalog]);

  const needsChambres = bienType === "appart" || bienType === "maison";

  const effectiveChambres = needsChambres ? chambres : null;

  const catalogKey = useMemo(
    () => buildCatalogKey(missionType, bienType, effectiveChambres),
    [missionType, bienType, effectiveChambres]
  );

  const catalogEntry: CatalogEntry | null = catalog?.[catalogKey] ?? null;

  const basePrice = useMemo(() => {
    if (catalogEntry && catalogEntry.price > 0) return catalogEntry.price;
    return FALLBACK_PRICES[catalogKey] ?? 0;
  }, [catalogEntry, catalogKey]);

  const supplementsTotal = useMemo(() => {
    let sum = 0;
    for (const id of supplements) {
      const def = SUPPLEMENT_DEFS.find((s) => s.id === id);
      if (def) sum += def.price;
    }
    return sum;
  }, [supplements]);

  const extraRoomsTotal = extraRooms * EXTRA_ROOM_PRICE;
  const totalHtva = basePrice + extraRoomsTotal + supplementsTotal;
  const totalTva = totalHtva * TVA_RATE;
  const totalTvac = totalHtva + totalTva;

  const toggleSupplement = (id: string) => {
    setSupplements((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreerDemande = () => {
    if (!onSelect) {
      onClose();
      return;
    }
    const selection: PriceSelection = {
      missionType,
      bienType,
      chambres: effectiveChambres,
      extraRooms,
      supplements,
      basePrice,
      totalHtva,
      totalTvac,
      contreExpert,
      defenseParty: contreExpert ? defenseParty : null,
      odooCode: catalogEntry?.odoo_default_code ?? null,
    };
    onSelect(selection);
    onClose();
  };

  if (!open) return null;

  const defenseLabel =
    defenseParty === "proprietaire" ? "Propriétaire" : "Locataire";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-dark">
              Simulateur d&apos;honoraires
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Estimation indicative — non contractuelle
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {catalogLoading && (
            <div className="text-sm text-gray-400 animate-pulse">
              Chargement du catalogue...
            </div>
          )}
          {catalogError && (
            <div className="bg-amber-50 text-amber-700 text-xs rounded-lg p-3">
              {catalogError} — les prix affichés sont des estimations.
            </div>
          )}

          {/* Mission type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type de mission
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "entree" as const, label: "Entrée" },
                  { value: "sortie" as const, label: "Sortie" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMissionType(opt.value)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    missionType === opt.value
                      ? "border-primary bg-primary-light text-dark"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={
                    missionType === opt.value
                      ? { borderColor: "#F5B800" }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bien type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type de bien
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: "appart" as const, label: "Appartement" },
                  { value: "maison" as const, label: "Maison" },
                  { value: "studio" as const, label: "Studio" },
                  { value: "kot" as const, label: "Kot" },
                ]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBienType(opt.value)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    bienType === opt.value
                      ? "border-primary bg-primary-light text-dark"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={
                    bienType === opt.value
                      ? { borderColor: "#F5B800" }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chambres (appart / maison only) */}
          {needsChambres && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Nombre de chambres
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setChambres(n)}
                    className={`flex-1 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                      chambres === n
                        ? "border-primary bg-primary-light text-dark"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={
                      chambres === n ? { borderColor: "#F5B800" } : undefined
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pièces supplémentaires */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Pièces supplémentaires ({formatEuro(EXTRA_ROOM_PRICE)} / pièce)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExtraRooms((n) => Math.max(0, n - 1))}
                className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-bold"
                aria-label="Retirer une pièce"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-lg font-semibold text-dark">
                {extraRooms}
              </span>
              <button
                type="button"
                onClick={() => setExtraRooms((n) => Math.min(20, n + 1))}
                className="w-9 h-9 rounded-full border-2 text-white font-bold"
                style={{ backgroundColor: "#F5B800", borderColor: "#F5B800" }}
                aria-label="Ajouter une pièce"
              >
                +
              </button>
              {extraRooms > 0 && (
                <span className="text-sm text-gray-500">
                  = {formatEuro(extraRoomsTotal)}
                </span>
              )}
            </div>
          </div>

          {/* Suppléments */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Suppléments
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPLEMENT_DEFS.map((s) => {
                const checked = supplements.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm transition-all ${
                      checked
                        ? "border-primary bg-primary-light"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={checked ? { borderColor: "#F5B800" } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSupplement(s.id)}
                      className="accent-[#F5B800]"
                    />
                    <span className="flex-1 text-gray-700">{s.label}</span>
                    <span className="text-gray-500 text-xs">
                      +{formatEuro(s.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Contre-expert */}
          <div>
            <label
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm transition-all ${
                contreExpert
                  ? "border-primary bg-primary-light"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={contreExpert ? { borderColor: "#F5B800" } : undefined}
            >
              <input
                type="checkbox"
                checked={contreExpert}
                onChange={(e) => setContreExpert(e.target.checked)}
                className="accent-[#F5B800]"
              />
              <span className="flex-1 text-gray-700 font-medium">
                Contre-expert
              </span>
            </label>
            {contreExpert && (
              <div className="mt-3 pl-3 border-l-2 border-gray-100">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Nous défendons :
                </p>
                <div className="flex gap-4">
                  {(
                    [
                      {
                        value: "proprietaire" as const,
                        label: "Propriétaire",
                      },
                      { value: "locataire" as const, label: "Locataire" },
                    ]
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="defenseParty"
                        checked={defenseParty === opt.value}
                        onChange={() => setDefenseParty(opt.value)}
                        className="accent-[#F5B800]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Résultat */}
          <div className="rounded-2xl border-2 p-4" style={{ borderColor: "#F5B800" }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-dark">Résultat</h4>
              {catalogEntry && (
                <span className="text-xs text-gray-400">
                  {catalogEntry.label}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Prix de base</span>
                <span>{formatEuro(basePrice)}</span>
              </div>
              {extraRoomsTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>
                    Pièces supplémentaires (×{extraRooms})
                  </span>
                  <span>{formatEuro(extraRoomsTotal)}</span>
                </div>
              )}
              {supplementsTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Suppléments</span>
                  <span>{formatEuro(supplementsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-dark pt-2 border-t border-gray-100">
                <span>Total HTVA</span>
                <span>{formatEuro(totalHtva)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA 21%</span>
                <span>{formatEuro(totalTva)}</span>
              </div>
              <div
                className="flex justify-between text-lg font-bold"
                style={{ color: "#F5B800" }}
              >
                <span>Total TVAC</span>
                <span>{formatEuro(totalTvac)}</span>
              </div>
            </div>

            {/* Répartition */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              {contreExpert ? (
                <div className="flex items-center justify-between bg-primary-light rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-dark">
                    Honoraires {defenseLabel}
                  </span>
                  <span className="text-base font-bold text-dark">
                    {formatEuro(totalTvac)}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-500">Propriétaire</span>
                    <span className="text-base font-semibold text-dark">
                      {formatEuro(totalTvac / 2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-500">Locataire</span>
                    <span className="text-base font-semibold text-dark">
                      {formatEuro(totalTvac / 2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleCreerDemande}
            className="px-6 py-2.5 rounded-full text-white font-semibold transition-colors"
            style={{ backgroundColor: "#F5B800" }}
          >
            Créer une demande ↗
          </button>
        </div>
      </div>
    </div>
  );
}
