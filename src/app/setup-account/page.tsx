"use client";

import { Suspense, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

function SetupAccountInner({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const router = useRouter();
  const { token: rawToken } = use(searchParams);
  const token = typeof rawToken === "string" ? rawToken : "";

  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("Lien invalide : aucun token fourni.");
      setValidating(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/auth/validate-token?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.valid) {
          setError(data.error || "Ce lien d'invitation est invalide ou a expire.");
          setTokenValid(false);
        } else {
          setEmail(data.email);
          setOrgName(data.organization_name);
          setTokenValid(true);
        }
      } catch {
        if (!cancelled) {
          setError("Erreur de connexion au serveur.");
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (firstName.trim().length === 0) {
      setError("Le prenom est requis.");
      return;
    }
    if (lastName.trim().length === 0) {
      setError("Le nom est requis.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.error || "Erreur lors de la creation du compte.");
        setLoading(false);
        return;
      }

      setSuccess("Compte cree ! Redirection...");
      router.refresh();
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="animate-pulse text-gray-400">
          Verification de l&apos;invitation...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png"
            alt="Axis Experts"
            className="mx-auto mb-4"
            style={{ height: "60px", objectFit: "contain" }}
          />
          <p className="text-gray-400 mt-1">Portail de demande de rendez-vous</p>
        </div>

        {!tokenValid ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-4">
              {error || "Ce lien d'invitation est invalide ou a expire."}
            </div>
            <p className="text-sm text-gray-500 text-center">
              Contactez votre administrateur pour obtenir un nouveau lien
              d&apos;invitation.
            </p>
            <div className="text-center mt-4">
              <a
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Retour a la connexion
              </a>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100"
          >
            <div className="text-center mb-2">
              <h1 className="text-xl font-bold text-gray-800">
                Creer votre compte
              </h1>
              {orgName && (
                <p className="text-sm text-gray-500 mt-1">
                  Organisation : <strong>{orgName}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-dark cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Prenom
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={50}
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                  placeholder="Ex. Julie"
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Nom
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={50}
                  autoComplete="family-name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                  placeholder="Ex. Michaux"
                />
              </div>
            </div>
            <p className="-mt-3 text-xs text-gray-400">
              Affiche comme auteur sur les messages envoyes a Axis.
              Vous pourrez le modifier plus tard.
            </p>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="Minimum 8 caracteres"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password-confirm"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-colors"
                placeholder="Retapez votre mot de passe"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creation en cours..." : "Creer mon compte"}
            </button>
          </form>
        )}

        <p className="text-center text-gray-400 text-sm mt-6">
          {`\u00a9 ${new Date().getFullYear()} Axis Experts. Tous droits reserves.`}
        </p>
      </div>
    </div>
  );
}

export default function SetupAccountPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-pulse text-gray-400">Chargement...</div>
        </div>
      }
    >
      <SetupAccountInner searchParams={props.searchParams} />
    </Suspense>
  );
}
