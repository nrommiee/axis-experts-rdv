"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [nomSociete, setNomSociete] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
      setEmail(user.email ?? "");

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
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          const name = typeof json?.display_name === "string" ? json.display_name : "";
          setDisplayName(name);
          setInitialDisplayName(name);
        }
      } catch {
        // ignore, user can still edit
      } finally {
        setProfileLoading(false);
      }
    }
    load();
  }, [router, supabase]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: displayName }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Erreur lors de l'enregistrement");
        }
        const saved = typeof json?.display_name === "string" ? json.display_name : "";
        setDisplayName(saved);
        setInitialDisplayName(saved);
        setSuccessMessage("\u2713 Nom enregistr\u00e9");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setSaving(false);
      }
    },
    [displayName]
  );

  const isDirty = displayName.trim() !== initialDisplayName.trim();

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
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-dark">Mon profil</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
          {profileLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-gray-400">Chargement du profil...</div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-dark mb-1.5">
                  Nom affiché
                </label>
                <input
                  id="display_name"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (successMessage) setSuccessMessage("");
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Prénom Nom"
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Ce nom apparaîtra dans vos messages envoyés à Axis Experts
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                {successMessage && (
                  <span className="text-sm text-green-600 font-medium">{successMessage}</span>
                )}
                {errorMessage && (
                  <span className="text-sm text-red-600 font-medium">{errorMessage}</span>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
