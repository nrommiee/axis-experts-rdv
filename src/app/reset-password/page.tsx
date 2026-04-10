"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Capture auth params synchronously during initial render, BEFORE
  // createBrowserClient's auto-detection can strip them via history.replaceState().
  // Supports both PKCE (?code=) and implicit (#access_token=&type=recovery) flows.
  const [authParams] = useState(() => {
    if (typeof window === "undefined") return null;
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) return { kind: "pkce" as const, code };
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hp = new URLSearchParams(hash);
    const access_token = hp.get("access_token");
    const refresh_token = hp.get("refresh_token");
    const type = hp.get("type");
    if (access_token && refresh_token && type === "recovery") {
      return { kind: "implicit" as const, access_token, refresh_token };
    }
    return null;
  });

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function establishRecoverySession() {
      try {
        if (authParams?.kind === "pkce") {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(authParams.code);

          if (exchangeError) {
            // The code may have been already exchanged by Supabase
            // auto-detection (detectSessionInUrl). Fall back to checking
            // whether a valid recovery session already exists.
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              setSessionReady(true);
              setChecking(false);
              return;
            }

            setSessionError(
              "Le lien de réinitialisation a expiré. Veuillez en demander un nouveau."
            );
            setChecking(false);
            return;
          }

          setSessionReady(true);
        } else if (authParams?.kind === "implicit") {
          const { error: setSessionError_ } = await supabase.auth.setSession({
            access_token: authParams.access_token,
            refresh_token: authParams.refresh_token,
          });

          if (setSessionError_) {
            // Auto-detection may have already consumed the hash tokens.
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              setSessionReady(true);
              setChecking(false);
              return;
            }

            setSessionError(
              "Le lien de réinitialisation a expiré. Veuillez en demander un nouveau."
            );
            setChecking(false);
            return;
          }

          setSessionReady(true);
        } else {
          // No token in URL — auto-detection may have already exchanged it.
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
          } else {
            setSessionError(
              "Le lien de réinitialisation est invalide. Veuillez en demander un nouveau."
            );
          }
        }
      } catch {
        setSessionError(
          "Erreur lors de la vérification du lien. Veuillez réessayer."
        );
      } finally {
        setChecking(false);
      }
    }

    establishRecoverySession();
  }, [supabase, authParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Erreur lors de la mise à jour du mot de passe.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <img src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png" alt="Axis Experts" className="mx-auto mb-4" style={{ height: '60px', objectFit: 'contain' }} />
          <p className="text-gray-400 mt-1">Réinitialisation du mot de passe</p>
        </div>

        {checking ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Vérification du lien...</div>
          </div>
        ) : sessionError ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100">
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
              {sessionError}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        ) : success ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100">
            <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
              Mot de passe mis à jour avec succès. Redirection vers la connexion...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm text-primary hover:underline"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-400 text-sm mt-6">
          {`© ${new Date().getFullYear()} Axis Experts. Tous droits réservés.`}
        </p>
      </div>
    </div>
  );
}
