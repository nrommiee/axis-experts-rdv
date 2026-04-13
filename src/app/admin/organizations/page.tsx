"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  odoo_partner_id: number;
  odoo_template_prefix: string;
  client_type: string;
  is_active: boolean;
  user_count: number;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPartnerId, setFormPartnerId] = useState("");
  const [formAgencyId, setFormAgencyId] = useState("");
  const [formPrefix, setFormPrefix] = useState("AXIS");
  const [formType, setFormType] = useState<"social" | "agency">("social");
  const [formContactName, setFormContactName] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const loadOrganizations = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organizations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de chargement");
        return;
      }
      setOrganizations(data.organizations ?? []);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          odoo_partner_id: Number(formPartnerId),
          odoo_agency_id: formAgencyId ? Number(formAgencyId) : null,
          odoo_template_prefix: formPrefix,
          client_type: formType,
          contact_name: formContactName || null,
          contact_email: formContactEmail || null,
          contact_phone: formContactPhone || null,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError(data.error || "Erreur lors de la creation");
        return;
      }

      setFormSuccess("Organisation creee !");
      setFormName("");
      setFormPartnerId("");
      setFormAgencyId("");
      setFormPrefix("AXIS");
      setFormType("social");
      setFormContactName("");
      setFormContactEmail("");
      setFormContactPhone("");
      loadOrganizations();
      setTimeout(() => setShowForm(false), 1000);
    } catch {
      setFormError("Erreur de connexion");
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organisations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {organizations.length} organisation{organizations.length !== 1 ? "s" : ""} enregistree{organizations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          {showForm ? "Annuler" : "Ajouter une organisation"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Nouvelle organisation
          </h2>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="CPAS de Bruxelles"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Odoo Partner ID *
                </label>
                <input
                  type="number"
                  min={1}
                  value={formPartnerId}
                  onChange={(e) => setFormPartnerId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="77104"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Odoo Agency ID
                </label>
                <input
                  type="number"
                  min={1}
                  value={formAgencyId}
                  onChange={(e) => setFormAgencyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Prefix template
                </label>
                <input
                  type="text"
                  value={formPrefix}
                  onChange={(e) => setFormPrefix(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="AXIS"
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
                      name="org_type"
                      value="social"
                      checked={formType === "social"}
                      onChange={() => setFormType("social")}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700">Social</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="org_type"
                      value="agency"
                      checked={formType === "agency"}
                      onChange={() => setFormType("agency")}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700">Agence</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nom du contact
                </label>
                <input
                  type="text"
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email du contact
                </label>
                <input
                  type="email"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Telephone du contact
                </label>
                <input
                  type="tel"
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400"
                  placeholder="(optionnel)"
                />
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
              disabled={formSubmitting}
              className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formSubmitting ? "Creation..." : "Creer l'organisation"}
            </button>
          </form>
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse text-gray-400">Chargement...</div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Aucune organisation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 font-medium">Nom</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Partner ID</th>
                  <th className="py-3 px-4 font-medium">Prefix</th>
                  <th className="py-3 px-4 font-medium">Utilisateurs</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-gray-800 font-medium hover:text-primary"
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          org.client_type === "agency"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {org.client_type === "agency" ? "Agence" : "Social"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {org.odoo_partner_id}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {org.odoo_template_prefix}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {org.user_count}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          org.is_active
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {org.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
