"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Mode = "creator_only" | "all_org_users" | "custom_list";

interface NotificationsConfig {
  notifications_enabled: boolean;
  notification_recipients_mode: Mode;
  notification_custom_emails: string[];
}

interface NotificationsApiResponse extends NotificationsConfig {
  org_users_emails: string[];
}

interface TestResult {
  email: string;
  status: "sent" | "failed";
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MODE_LABELS: Record<Mode, string> = {
  creator_only: "Créateur uniquement",
  all_org_users: "Tous les utilisateurs",
  custom_list: "Liste personnalisée",
};

interface EmailChipsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  disabled?: boolean;
}

function EmailChipsInput({
  value,
  onChange,
  suggestions,
  disabled,
}: EmailChipsInputProps) {
  const [draft, setDraft] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lowerExisting = useMemo(
    () => new Set(value.map((e) => e.toLowerCase())),
    [value]
  );

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((e) => !lowerExisting.has(e.toLowerCase()))
      .filter((e) => (q ? e.toLowerCase().includes(q) : true))
      .slice(0, 5);
  }, [draft, suggestions, lowerExisting]);

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
    };
  }, []);

  function flagInvalid() {
    setIsInvalid(true);
    if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
    invalidTimerRef.current = setTimeout(() => setIsInvalid(false), 2000);
  }

  function tryAdd(raw: string) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    if (!EMAIL_RE.test(normalized)) {
      flagInvalid();
      return;
    }
    if (lowerExisting.has(normalized)) {
      setDraft("");
      return;
    }
    onChange([...value, normalized]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tryAdd(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    setTimeout(() => setFocused(false), 150);
    if (draft.trim()) tryAdd(draft);
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="relative">
      <div
        className={`min-h-[48px] flex flex-wrap gap-2 p-2 rounded-xl border bg-gray-50 transition-colors ${
          isInvalid
            ? "border-red-400 ring-2 ring-red-100"
            : "border-gray-200 focus-within:border-primary"
        } ${disabled ? "opacity-60" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email, i) => (
          <span
            key={`${email}-${i}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 text-sm"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="text-teal-700 hover:text-teal-900 leading-none"
                aria-label={`Supprimer ${email}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={value.length === 0 ? "email@exemple.com" : ""}
          className="flex-1 min-w-[180px] bg-transparent outline-none text-sm text-dark placeholder-gray-400"
        />
      </div>
      {isInvalid && (
        <p className="absolute -bottom-5 left-0 text-xs text-red-600">
          Email invalide
        </p>
      )}
      {focused && filteredSuggestions.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filteredSuggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  tryAdd(s);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface NotificationsTabProps {
  organizationId: string;
  organizationName: string;
}

export default function NotificationsTab({
  organizationId,
  organizationName,
}: NotificationsTabProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [initialConfig, setInitialConfig] =
    useState<NotificationsConfig | null>(null);
  const [orgUsersEmails, setOrgUsersEmails] = useState<string[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("all_org_users");
  const [customEmails, setCustomEmails] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [enableModalOpen, setEnableModalOpen] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testOverride, setTestOverride] = useState("");
  const [testSending, setTestSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/notifications`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as
        | NotificationsApiResponse
        | { error: string };
      if (!res.ok || "error" in data) {
        setLoadError(
          ("error" in data && data.error) || "Erreur de chargement"
        );
        return;
      }
      setInitialConfig({
        notifications_enabled: data.notifications_enabled,
        notification_recipients_mode: data.notification_recipients_mode,
        notification_custom_emails: data.notification_custom_emails,
      });
      setNotificationsEnabled(data.notifications_enabled);
      setMode(data.notification_recipients_mode);
      setCustomEmails(data.notification_custom_emails);
      setOrgUsersEmails(data.org_users_emails);
    } catch {
      setLoadError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setAdminEmail(data.user.email);
    });
  }, []);

  const isDirty = useMemo(() => {
    if (!initialConfig) return false;
    if (initialConfig.notifications_enabled !== notificationsEnabled)
      return true;
    if (initialConfig.notification_recipients_mode !== mode) return true;
    const a = initialConfig.notification_custom_emails;
    const b = customEmails;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return true;
    }
    return false;
  }, [initialConfig, notificationsEnabled, mode, customEmails]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleToggleClick() {
    if (!notificationsEnabled) {
      setEnableModalOpen(true);
    } else {
      setNotificationsEnabled(false);
    }
  }

  function confirmEnable() {
    setNotificationsEnabled(true);
    setEnableModalOpen(false);
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    if (
      notificationsEnabled &&
      mode === "custom_list" &&
      customEmails.length === 0
    ) {
      toast.error(
        "Ajoutez au moins un email à la liste personnalisée avant d'activer."
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/notifications`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications_enabled: notificationsEnabled,
            notification_recipients_mode: mode,
            notification_custom_emails: customEmails,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erreur lors de l'enregistrement");
        return;
      }
      setInitialConfig({
        notifications_enabled: data.notifications_enabled,
        notification_recipients_mode: data.notification_recipients_mode,
        notification_custom_emails: data.notification_custom_emails,
      });
      setNotificationsEnabled(data.notifications_enabled);
      setMode(data.notification_recipients_mode);
      setCustomEmails(data.notification_custom_emails);
      toast.success("Paramètres enregistrés");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  const testDisabled =
    !notificationsEnabled ||
    (mode === "custom_list" && customEmails.length === 0);

  function openTestModal() {
    if (testDisabled) return;
    setTestOverride(adminEmail);
    setTestModalOpen(true);
  }

  async function handleSendTest() {
    setTestSending(true);
    try {
      const override = testOverride.trim();
      const payload: { override_recipients?: string[] } = {};
      if (override) {
        if (!EMAIL_RE.test(override.toLowerCase())) {
          toast.error("Email invalide");
          setTestSending(false);
          return;
        }
        payload.override_recipients = [override];
      }
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/notifications/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Échec d'envoi");
        return;
      }
      const results = (data.results ?? []) as TestResult[];
      const failed = results.filter((r) => r.status === "failed");
      const sent = results.filter((r) => r.status === "sent");
      if (failed.length === 0) {
        toast.success(
          `Email de test envoyé à ${sent.length} destinataire${sent.length > 1 ? "s" : ""}`
        );
      } else if (sent.length === 0) {
        toast.error(
          `Échec d'envoi : ${failed[0].error || "erreur inconnue"}`
        );
      } else {
        toast.warning(
          `Envoyé à ${sent.length} destinataire(s), échecs : ${failed.map((f) => f.email).join(", ")}`
        );
      }
      setTestModalOpen(false);
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setTestSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Section A — Activation */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              Notifications email actives pour cette organisation
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Les utilisateurs recevront un email lorsqu&apos;un RDV est planifié
              ou modifié dans Odoo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleClick}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              notificationsEnabled ? "bg-primary" : "bg-gray-300"
            }`}
            aria-pressed={notificationsEnabled}
            aria-label="Activer les notifications"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                notificationsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section B — Destinataires */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Destinataires
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Choisissez qui reçoit les notifications.
        </p>

        <div className="space-y-3">
          {(
            [
              {
                key: "creator_only" as Mode,
                title: "Uniquement le créateur de la demande",
                desc: "L'utilisateur qui a soumis le dossier via le portail. Si non disponible, fallback sur tous les utilisateurs de l'organisation.",
              },
              {
                key: "all_org_users" as Mode,
                title: "Tous les utilisateurs de l'organisation",
                desc: `Tous les comptes actifs liés à ${organizationName}.`,
              },
              {
                key: "custom_list" as Mode,
                title: "Liste personnalisée",
                desc: "Emails spécifiques, indépendamment des comptes portail.",
              },
            ] as const
          ).map((opt) => {
            const selected = mode === opt.key;
            return (
              <label
                key={opt.key}
                className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="recipients_mode"
                    checked={selected}
                    onChange={() => setMode(opt.key)}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {opt.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {mode === "custom_list" && (
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-2">
              Emails (Entrée ou virgule pour ajouter)
            </label>
            <EmailChipsInput
              value={customEmails}
              onChange={setCustomEmails}
              suggestions={orgUsersEmails}
            />
            {notificationsEnabled && customEmails.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                Au moins un email est requis pour activer les notifications.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Section C — Test */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Tester les notifications
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Envoyez un email de test pour vérifier la configuration.
        </p>
        <button
          type="button"
          onClick={openTestModal}
          disabled={testDisabled}
          title={
            testDisabled
              ? "Activez les notifications et configurez au moins un destinataire."
              : undefined
          }
          className="px-4 py-2.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: testDisabled ? undefined : "#0ABFB8" }}
        >
          Envoyer un email de test
        </button>
      </section>

      {/* Section D — Save bar (sticky) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-6 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          {isDirty && (
            <span className="text-xs text-gray-500">
              Modifications non enregistrées
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving && (
              <span className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>

      {/* Enable confirmation modal */}
      <AlertDialog
        open={enableModalOpen}
        onOpenChange={(open) => setEnableModalOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer les notifications email ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les destinataires configurés ci-dessous commenceront à recevoir
              des emails à chaque changement de date dans Odoo. Cette action
              prend effet immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmEnable();
              }}
              style={{ backgroundColor: "#0ABFB8" }}
              className="text-white hover:opacity-90"
            >
              Activer les notifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test send modal */}
      {testModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Envoyer un email de test
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Vérifiez la configuration des notifications.
            </p>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Envoyer à
            </label>
            <input
              type="email"
              value={testOverride}
              onChange={(e) => setTestOverride(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
            />
            <p className="text-xs text-gray-500 mt-2">
              Par défaut, votre propre email. Modifiez pour tester avec un
              destinataire spécifique. Laissez vide pour envoyer aux
              destinataires configurés (mode actuel : {MODE_LABELS[mode]}).
            </p>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testSending}
                className="flex-1 py-3 rounded-full text-white font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: "#0ABFB8" }}
              >
                {testSending && (
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                {testSending ? "Envoi..." : "Envoyer"}
              </button>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                disabled={testSending}
                className="px-5 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
