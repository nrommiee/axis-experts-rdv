"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [nomSociete, setNomSociete] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [initialFirstName, setInitialFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
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
          const first = typeof json?.first_name === "string" ? json.first_name : "";
          const last = typeof json?.last_name === "string" ? json.last_name : "";
          setFirstName(first);
          setInitialFirstName(first);
          setLastName(last);
          setInitialLastName(last);
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
          body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Erreur lors de l'enregistrement");
        }
        const savedFirst = typeof json?.first_name === "string" ? json.first_name : "";
        const savedLast = typeof json?.last_name === "string" ? json.last_name : "";
        setFirstName(savedFirst);
        setInitialFirstName(savedFirst);
        setLastName(savedLast);
        setInitialLastName(savedLast);
        setSuccessMessage("\u2713 Nom enregistr\u00e9");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setSaving(false);
      }
    },
    [firstName, lastName]
  );

  const isDirty =
    firstName.trim() !== initialFirstName.trim() ||
    lastName.trim() !== initialLastName.trim();

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
                Bonjour, {firstName || email || "Client"}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-dark mb-1.5">
                    Prénom
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (successMessage) setSuccessMessage("");
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Julie"
                    maxLength={50}
                    autoComplete="given-name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-dark mb-1.5">
                    Nom
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (successMessage) setSuccessMessage("");
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Michaux"
                    maxLength={50}
                    autoComplete="family-name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-3">
                Ce nom apparaîtra dans vos messages envoyés à Axis Experts
              </p>

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
