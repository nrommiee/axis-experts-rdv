"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "login" | "register";

function InscriptionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const initialTab: Tab =
    searchParams.get("tab") === "register" || searchParams.get("code")
      ? "register"
      : "login";
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Login tab state (mirror of /login) ──
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // ── Register tab state ──
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [regEmail, setRegEmail] = useState("");
  const [regEmailLocked, setRegEmailLocked] = useState(false);
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // ── Handle recovery link that lands here by mistake ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token=")) {
      window.location.replace("/reset-password" + hash);
    }
  }, []);

  // ── When the code changes, try to pre-fill email via invitation lookup ──
  useEffect(() => {
    let cancelled = false;
    const trimmed = code.trim();
    if (!trimmed) {
      setRegEmailLocked(false);
      return;
    }

    setLookupLoading(true);
    (async () => {
      try {
        // We use the public anon client — RLS on invitations should allow
        // selecting email by code. If it doesn't, the user can simply type
        // their email manually.
        const { data } = await supabase
          .from("invitations")
          .select("email, used_at, expires_at")
          .eq("code", trimmed)
          .maybeSingle();

        if (cancelled) return;

        if (data?.email && !data.used_at) {
          setRegEmail(data.email);
          setRegEmailLocked(true);
        } else {
          setRegEmailLocked(false);
        }
      } catch {
        if (!cancelled) setRegEmailLocked(false);
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, supabase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (authError) {
        const messages: Record<string, string> = {
          invalid_credentials: "Email ou mot de passe incorrect.",
          email_not_confirmed:
            "Veuillez confirmer votre email avant de vous connecter.",
          user_not_found: "Aucun compte trouvé avec cet email.",
          too_many_requests:
            "Trop de tentatives. Réessayez dans quelques minutes.",
        };

        setLoginError(
          messages[authError.code ?? ""] ||
            authError.message ||
            "Erreur de connexion. Vérifiez vos identifiants."
        );
        setLoginLoading(false);
        return;
      }

      router.refresh();
      router.push("/dashboard");
    } catch {
      setLoginError(
        "Erreur de connexion au serveur. Vérifiez votre connexion internet."
      );
      setLoginLoading(false);
    }
  }

  async function handleForgotPassword() {
    setLoginError("");
    setResetMessage("");
    if (!loginEmail.trim()) {
      setLoginError("Veuillez entrer votre adresse email.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(
      loginEmail.trim(),
      { redirectTo: window.location.origin + "/reset-password" }
    );
    if (error) {
      setLoginError(error.message || "Erreur lors de l'envoi. Réessayez.");
      return;
    }
    setResetMessage("Un email de réinitialisation a été envoyé.");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!code.trim()) {
      setRegError("Code d'invitation requis.");
      return;
    }
    if (!regEmail.trim()) {
      setRegError("Email requis.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setRegError("Les mots de passe ne correspondent pas.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        setRegError(
          payload?.error || "Erreur lors de la création du compte."
        );
        setRegLoading(false);
        return;
      }

      setRegSuccess("Compte créé ! Redirection...");
      router.refresh();
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setRegError("Erreur de connexion au serveur.");
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <img
            src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png"
            alt="Axis Experts"
            className="mx-auto mb-4"
            style={{ height: "60px", objectFit: "contain" }}
          />
          <p className="text-gray-400 mt-1">Portail de demande de rendez-vous</p>
          <p className="text-gray-400 text-xs italic mt-2">
            Accès réservé aux clients professionnels.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-full bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
              tab === "login"
                ? "bg-white text-primary shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
              tab === "register"
                ? "bg-white text-primary shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {tab === "login" ? (
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100"
          >
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Adresse email
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>

            {resetMessage && (
              <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
                {resetMessage}
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <div className="text-center pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-sm text-gray-500 hover:text-primary hover:underline"
              >
                Pas encore de compte ? Créer un compte
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleRegister}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100"
          >
            <div>
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Code d&apos;invitation
              </label>
              <input
                id="invite-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors font-mono"
                placeholder="Collez votre code ici"
              />
              {lookupLoading && (
                <p className="text-xs text-gray-400 mt-1">
                  Vérification du code...
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                readOnly={regEmailLocked}
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-dark placeholder-gray-400 transition-colors ${
                  regEmailLocked
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-gray-50"
                }`}
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">
                Au moins 8 caractères.
              </p>
            </div>

            <div>
              <label
                htmlFor="reg-password-confirm"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="reg-password-confirm"
                type="password"
                value={regPasswordConfirm}
                onChange={(e) => setRegPasswordConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {regError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
                {regSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regLoading ? "Création..." : "Créer mon compte"}
            </button>

            <div className="text-center pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-sm text-gray-500 hover:text-primary hover:underline"
              >
                Déjà un compte ? Se connecter
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

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400">Chargement...</div>
        </div>
      }
    >
      <InscriptionInner />
    </Suspense>
  );
}
