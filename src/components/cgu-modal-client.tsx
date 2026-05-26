"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";

type Props = {
  cguMarkdown: string;
  nextPath: string;
};

export function CguModalClient({ cguMarkdown, nextPath }: Props) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cgu/accept", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // best effort — on redirige quoi qu'il arrive
    }
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Pour accéder au portail, vous devez prendre connaissance et accepter
          les présentes conditions.
        </p>

        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-700 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_strong]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_hr]:my-4 [&_hr]:border-gray-200">
          <ReactMarkdown>{cguMarkdown}</ReactMarkdown>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            J&apos;ai lu et j&apos;accepte les conditions générales
            d&apos;utilisation
          </span>
        </label>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!accepted || submitting}
            className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Enregistrement…" : "J'accepte et continue"}
          </button>
          <button
            type="button"
            onClick={handleRefuse}
            disabled={submitting}
            className="inline-flex items-center justify-center h-11 px-4 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Refuser et se déconnecter
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Version v1.0 — En vigueur au 26 mai 2026
        </p>
      </div>
    </div>
  );
}
