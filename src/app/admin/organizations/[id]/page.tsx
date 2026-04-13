"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  odoo_partner_id: number;
  odoo_agency_id: number | null;
  odoo_template_prefix: string;
  client_type: string;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  product_config: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrgUser {
  id: string;
  user_id: string;
  email: string;
  nom_bailleur: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Invitation {
  id: string;
  email: string;
  token?: string;
  code?: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [org, setOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Organization>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Organisation introuvable");
        return;
      }
      setOrg(data.organization);
      setUsers(data.users ?? []);
      setInvitations(data.invitations ?? []);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function startEdit() {
    if (!org) return;
    setEditForm({
      name: org.name,
      odoo_partner_id: org.odoo_partner_id,
      odoo_agency_id: org.odoo_agency_id,
      odoo_template_prefix: org.odoo_template_prefix,
      client_type: org.client_type,
      contact_name: org.contact_name,
      contact_email: org.contact_email,
      contact_phone: org.contact_phone,
      is_active: org.is_active,
    });
    setEditing(true);
    setSaveError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveLoading(true);

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setSaveError(data.error || "Erreur lors de la sauvegarde");
        return;
      }

      setOrg(data.organization);
      setEditing(false);
    } catch {
      setSaveError("Erreur de connexion");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviteLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          organization_id: id,
          // These fields come from the organization
          odoo_partner_id: org?.odoo_partner_id,
          odoo_agency_id: org?.odoo_agency_id,
          nom_societe: org?.name,
          client_type: org?.client_type,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setInviteError(data.error || "Erreur lors de l'envoi");
        return;
      }

      setInviteSuccess("Invitation envoyee !");
      setInviteEmail("");
      loadData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess("");
      }, 1500);
    } catch {
      setInviteError("Erreur de connexion");
    } finally {
      setInviteLoading(false);
    }
  }

  function invitationStatus(inv: Invitation): {
    label: string;
    className: string;
  } {
    if (inv.used_at) {
      return { label: "Utilise", className: "bg-gray-100 text-gray-600" };
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return { label: "Expire", className: "bg-red-50 text-red-600" };
    }
    return { label: "Actif", className: "bg-green-50 text-green-600" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/organizations"
          className="text-sm text-primary hover:underline"
        >
          &larr; Retour aux organisations
        </Link>
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">
          {error || "Organisation introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/organizations"
        className="text-sm text-primary hover:underline"
      >
        &larr; Retour aux organisations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{org.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                org.client_type === "agency"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {org.client_type === "agency" ? "Agence" : "Social"}
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                org.is_active
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {org.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Modifier
          </button>
        )}
      </div>

      {/* Organization info */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Modifier l&apos;organisation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Odoo Partner ID
                </label>
                <input
                  type="number"
                  value={editForm.odoo_partner_id ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      odoo_partner_id: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Odoo Agency ID
                </label>
                <input
                  type="number"
                  value={editForm.odoo_agency_id ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      odoo_agency_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                  placeholder="(optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Prefix template
                </label>
                <input
                  type="text"
                  value={editForm.odoo_template_prefix ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      odoo_template_prefix: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Type
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_type"
                      checked={editForm.client_type === "social"}
                      onChange={() =>
                        setEditForm({ ...editForm, client_type: "social" })
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">Social</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_type"
                      checked={editForm.client_type === "agency"}
                      onChange={() =>
                        setEditForm({ ...editForm, client_type: "agency" })
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">Agence</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nom du contact
                </label>
                <input
                  type="text"
                  value={editForm.contact_name ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email du contact
                </label>
                <input
                  type="email"
                  value={editForm.contact_email ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact_email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Telephone du contact
                </label>
                <input
                  type="tel"
                  value={editForm.contact_phone ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact_phone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active ?? true}
                    onChange={(e) =>
                      setEditForm({ ...editForm, is_active: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Organisation active
                  </span>
                </label>
              </div>
            </div>

            {saveError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saveLoading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Odoo Partner ID</span>
              <p className="text-gray-800 font-mono mt-0.5">
                {org.odoo_partner_id}
              </p>
            </div>
            {org.odoo_agency_id && (
              <div>
                <span className="text-gray-500">Odoo Agency ID</span>
                <p className="text-gray-800 font-mono mt-0.5">
                  {org.odoo_agency_id}
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Prefix template</span>
              <p className="text-gray-800 font-mono mt-0.5">
                {org.odoo_template_prefix}
              </p>
            </div>
            {org.contact_name && (
              <div>
                <span className="text-gray-500">Contact</span>
                <p className="text-gray-800 mt-0.5">{org.contact_name}</p>
              </div>
            )}
            {org.contact_email && (
              <div>
                <span className="text-gray-500">Email contact</span>
                <p className="text-gray-800 mt-0.5">{org.contact_email}</p>
              </div>
            )}
            {org.contact_phone && (
              <div>
                <span className="text-gray-500">Telephone contact</span>
                <p className="text-gray-800 mt-0.5">{org.contact_phone}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Users */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Utilisateurs ({users.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowInviteModal(true);
              setInviteError("");
              setInviteSuccess("");
              setInviteEmail("");
            }}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Inviter un collaborateur
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun utilisateur pour cette organisation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Inscription</th>
                  <th className="py-2 font-medium">Derniere connexion</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2 pr-4 text-gray-700">{u.email}</td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("fr-BE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2 text-gray-500">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString(
                            "fr-BE",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Jamais"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invitations */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Invitations ({invitations.length})
        </h2>

        {invitations.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune invitation pour cette organisation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Envoyee le</th>
                  <th className="py-2 pr-4 font-medium">Expire le</th>
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
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(inv.created_at).toLocaleDateString("fr-BE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(inv.expires_at).toLocaleDateString("fr-BE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
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

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Inviter un collaborateur
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              L&apos;invitation sera envoyee par email pour rejoindre{" "}
              <strong>{org.name}</strong>.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="collaborateur@example.com"
                  autoFocus
                />
              </div>

              {inviteError && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3">
                  {inviteSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? "Envoi..." : "Envoyer l'invitation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
