"use client";

import { useCallback, useEffect, useState } from "react";

type Preferences = {
  notifications_enabled: boolean;
  notify_on_create: boolean;
  notify_on_update: boolean;
};

// Écran self-service des préférences de notification de l'agence.
// Honnête sur le périmètre : d'après l'audit, ces 2 préférences pilotent le
// MÊME e-mail de rendez-vous (date posée pour la 1re fois vs date modifiée).
export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [initial, setInitial] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/profile/notifications");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Erreur de chargement");
        }
        const loaded: Preferences = {
          notifications_enabled: !!json.notifications_enabled,
          notify_on_create: !!json.notify_on_create,
          notify_on_update: !!json.notify_on_update,
        };
        if (!cancelled) {
          setPrefs(loaded);
          setInitial(loaded);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Erreur de chargement"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setSuccessMessage("");
    setErrorMessage("");
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!prefs) return;
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");
      try {
        const res = await fetch("/api/profile/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Erreur lors de l'enregistrement");
        }
        const saved: Preferences = {
          notifications_enabled: !!json.notifications_enabled,
          notify_on_create: !!json.notify_on_create,
          notify_on_update: !!json.notify_on_update,
        };
        setPrefs(saved);
        setInitial(saved);
        setSuccessMessage("✓ Préférences enregistrées");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setSaving(false);
      }
    },
    [prefs]
  );

  const isDirty =
    !!prefs &&
    !!initial &&
    (prefs.notifications_enabled !== initial.notifications_enabled ||
      prefs.notify_on_create !== initial.notify_on_create ||
      prefs.notify_on_update !== initial.notify_on_update);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mt-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-dark">Notifications par e-mail</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Choisissez quand votre agence est prévenue par e-mail au sujet des
          rendez-vous.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-400">
            Chargement des préférences...
          </div>
        </div>
      ) : loadError ? (
        <div className="px-6 py-8 text-sm text-red-600">{loadError}</div>
      ) : prefs ? (
        <form onSubmit={handleSave} className="px-6 py-6">
          {/* Interrupteur principal */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="block font-medium text-gray-800">
                Recevoir les notifications de rendez-vous
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Active ou coupe tous les e-mails de rendez-vous ci-dessous.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.notifications_enabled}
              aria-label="Recevoir les notifications de rendez-vous"
              onClick={() =>
                update({ notifications_enabled: !prefs.notifications_enabled })
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                prefs.notifications_enabled ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  prefs.notifications_enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Sous-préférences */}
          {prefs.notifications_enabled && (
            <div className="mt-5 ml-1 pl-4 border-l-2 border-gray-100 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.notify_on_create}
                  onChange={(e) =>
                    update({ notify_on_create: e.target.checked })
                  }
                  className="mt-0.5 accent-primary h-4 w-4"
                />
                <span className="text-sm">
                  <span className="block font-medium text-gray-800">
                    À la planification d&apos;un rendez-vous
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    E-mail envoyé quand Axis Experts fixe la date et l&apos;heure
                    d&apos;un rendez-vous.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.notify_on_update}
                  onChange={(e) =>
                    update({ notify_on_update: e.target.checked })
                  }
                  className="mt-0.5 accent-primary h-4 w-4"
                />
                <span className="text-sm">
                  <span className="block font-medium text-gray-800">
                    Lors d&apos;un changement de date ou d&apos;heure
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    E-mail envoyé quand la date ou l&apos;heure d&apos;un
                    rendez-vous déjà planifié est modifiée.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center gap-3 pt-6">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            {successMessage && (
              <span className="text-sm text-green-600 font-medium">
                {successMessage}
              </span>
            )}
            {errorMessage && (
              <span className="text-sm text-red-600 font-medium">
                {errorMessage}
              </span>
            )}
          </div>
        </form>
      ) : null}
    </div>
  );
}
