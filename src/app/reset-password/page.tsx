"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const recoveryDetected = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected.current = true;
        setSessionReady(true);
      }
    });

    // Timeout: if no PASSWORD_RECOVERY event after 5s, link is invalid/expired
    const timeout = setTimeout(() => {
      if (!recoveryDetected.current) {
        setSessionError("Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.");
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

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

        {sessionError ? (
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
        ) : !sessionReady ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Vérification du lien...</div>
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
