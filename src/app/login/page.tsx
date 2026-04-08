"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error("[Supabase Auth Error]", authError);
        console.error("[Supabase Auth Error raw]", JSON.stringify(authError));

        const messages: Record<string, string> = {
          invalid_credentials: "Email ou mot de passe incorrect.",
          email_not_confirmed: "Veuillez confirmer votre email avant de vous connecter.",
          user_not_found: "Aucun compte trouvé avec cet email.",
          too_many_requests: "Trop de tentatives. Réessayez dans quelques minutes.",
        };

        setError(
          messages[authError.code ?? ""] ||
          authError.message ||
          "Erreur de connexion. Vérifiez vos identifiants."
        );
        setLoading(false);
        return;
      }

      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      console.error("[Login unexpected error]", err);
      setError("Erreur de connexion au serveur. Vérifiez votre connexion internet.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <img src="https://axis-experts.be/wp-content/uploads/2023/01/Axis-LOGO-2_VERT_JAUNE_BLANC.png" alt="Axis Experts" className="mx-auto mb-4" style={{ height: '60px', objectFit: 'contain' }} />
          <p className="text-gray-400 mt-1">Portail de demande de rendez-vous</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          &copy; {new Date().getFullYear()} Axis Experts. Tous droits r&eacute;serv&eacute;s.
        </p>
      </div>
    </div>
  );
}
