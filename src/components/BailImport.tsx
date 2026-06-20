"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { BailExtraction } from "@/lib/agency/bail-extraction";

const MAX_BAIL_BYTES = 10 * 1024 * 1024;

interface BailImportProps {
  userId: string;
  onExtracted: (extraction: BailExtraction) => void;
}

/**
 * Déposoir « Importer le bail (PDF) » — réservé aux agences.
 *
 * Flux : dépôt PDF → bouton explicite « Pré-remplir depuis le bail » (appel IA
 * UNIQUEMENT au clic) → chargement → mapping côté page (champs vides seulement).
 * Mode transitoire : le bail est supprimé après extraction (route serveur).
 * Le formulaire reste pleinement utilisable sans IA.
 */
export default function BailImport({ userId, onExtracted }: BailImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf") {
      toast.error("Format non supporté : PDF uniquement");
      return;
    }
    if (selected.size > MAX_BAIL_BYTES) {
      toast.error('"' + selected.name + '" dépasse 10 Mo');
      return;
    }
    setFile(selected);
  }

  async function handlePrefill() {
    if (!file || loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      // Upload direct Storage (même bucket que les documents), chemin préfixé user id.
      const storagePath = `${userId}/bail-extract/${crypto.randomUUID()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from("rdv-documents")
        .upload(storagePath, file, { contentType: "application/pdf", upsert: true });
      if (uploadErr) {
        toast.error("Lecture automatique impossible, complète manuellement.");
        return;
      }

      const res = await fetch("/api/agency/extract-bail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: storagePath }),
      });
      const json = (await res.json().catch(() => null)) as
        | { extraction?: BailExtraction; error?: string }
        | null;

      if (!res.ok || !json?.extraction) {
        toast.error(
          json?.error || "Lecture automatique impossible, complète manuellement."
        );
        return;
      }

      onExtracted(json.extraction);
      toast.success("Champs pré-remplis depuis le bail. Relisez et corrigez si besoin.");
      // Réinitialise le déposoir après succès.
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      toast.error("Lecture automatique impossible, complète manuellement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-5 space-y-3">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-semibold text-dark">Importer le bail (PDF)</h3>
          <p className="text-xs text-gray-500">
            Déposez le bail pour pré-remplir automatiquement le propriétaire, le
            locataire et l&apos;adresse du bien. Vous pourrez toujours relire et
            corriger. Le document n&apos;est pas conservé.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        id="bail-import-input"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="bail-import-input"
          className="cursor-pointer text-sm px-4 py-2 rounded-xl border border-gray-200 bg-white text-dark hover:border-primary transition-colors"
        >
          {file ? "Changer de fichier" : "Choisir un PDF"}
        </label>
        {file && (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">{file.name}</span>
        )}
        <button
          type="button"
          onClick={handlePrefill}
          disabled={!file || loading}
          className="text-sm px-4 py-2 rounded-xl bg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {loading ? "Lecture en cours…" : "Pré-remplir depuis le bail"}
        </button>
      </div>
    </div>
  );
}
