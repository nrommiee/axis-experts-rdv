"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "n.rommiee@icloud.com";

interface Invitation {
  id: string;
  code: string;
  email: string;
  nom_societe: string | null;
  client_type: string | null;
  odoo_partner_id: number | null;
  odoo_agency_id: number | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

type ClientType = "social" | "agency";

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [authChecked, setAuthChecked] = useState(false);

  // ── Invitation form ──
  const [email, setEmail] = useState("");
  const [odooPartnerId, setOdooPartnerId] = useState("");
  const [odooAgencyId, setOdooAgencyId] = useState("");
  const [nomSociete, setNomSociete] = useState("");
  const [clientType, setClientType] = useState<ClientType>("agency");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Invitations list ──
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    setListError("");
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        cache: "no-store",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(payload?.error || "Impossible de charger les invitations.");
        setInvitations([]);
        return;
      }
      setInvitations(payload.invitations ?? []);
    } catch {
      setListError("Erreur de connexion au serveur.");
      setInvitations([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace("/dashboard");
        return;
      }

      setAuthChecked(true);
      loadInvitations();
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, loadInvitations]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!email.trim()) {
      setFormError("Email requis.");
      return;
    }
    if (!odooPartnerId.trim()) {
      setFormError("Odoo Partner ID requis.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          odoo_partner_id: Number(odooPartnerId),
          odoo_agency_id: odooAgencyId.trim()
            ? Number(odooAgencyId)
            : null,
          nom_societe: nomSociete.trim() || null,
          client_type: clientType,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        setFormError(
          payload?.error || "Erreur lors de l'envoi de l'invitation."
        );
        setSubmitting(false);
        return;
      }

      setFormSuccess("Invitation envoyée !");
      setEmail("");
      setOdooPartnerId("");
      setOdooAgencyId("");
      setNomSociete("");
      setClientType("agency");
      loadInvitations();
    } catch {
      setFormError("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  function invitationStatus(inv: Invitation): {
    label: string;
    className: string;
  } {
    if (inv.used_at) {
      return {
        label: "Utilisé",
        className: "bg-gray-100 text-gray-600",
      };
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return {
        label: "Expiré",
        className: "bg-red-50 text-red-600",
      };
    }
    return {
      label: "Actif",
      className: "bg-green-50 text-green-600",
    };
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Vérification...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Administration
            </h1>
            <p className="text-sm text-gray-500">
              Gestion des invitations au portail Axis Experts
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-primary hover:underline"
          >
            Retour au dashboard
          </button>
        </header>

        {/* ── Invitation form ── */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Envoyer une invitation
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="partner-id"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Odoo Partner ID *
                </label>
                <input
                  id="partner-id"
                  type="number"
                  min={1}
                  value={odooPartnerId}
                  onChange={(e) => setOdooPartnerId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="1234"
                />
              </div>

              <div>
                <label
                  htmlFor="agency-id"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Odoo Agency ID
                </label>
                <input
                  id="agency-id"
                  type="number"
                  min={1}
                  value={odooAgencyId}
                  onChange={(e) => setOdooAgencyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="nom-societe"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Nom société
                </label>
                <input
                  id="nom-societe"
                  type="text"
                  value={nomSociete}
                  onChange={(e) => setNomSociete(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="block text-sm font-medium text-gray-600 mb-2">
                  Type
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_type"
                      value="social"
                      checked={clientType === "social"}
                      onChange={() => setClientType("social")}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700">Social</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_type"
                      value="agency"
                      checked={clientType === "agency"}
                      onChange={() => setClientType("agency")}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700">Agence</span>
                  </label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </form>
        </section>

        {/* ── Invitations list ── */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Invitations envoyées
            </h2>
            <button
              type="button"
              onClick={loadInvitations}
              className="text-sm text-primary hover:underline"
            >
              Actualiser
            </button>
          </div>

          {listError && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="animate-pulse text-gray-400 text-sm">
              Chargement...
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune invitation pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Société</th>
                    <th className="py-2 pr-4 font-medium">Expires</th>
                    <th className="py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => {
                    const status = invitationStatus(inv);
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 pr-4 text-gray-700">{inv.email}</td>
                        <td className="py-2 pr-4 text-gray-700">
                          {inv.nom_societe || "—"}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {new Date(inv.expires_at).toLocaleDateString(
                            "fr-BE",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
