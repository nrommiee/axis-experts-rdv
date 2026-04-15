"use client";

import { useCallback, useEffect, useState } from "react";

interface OrgCustomField {
  id: string;
  label: string;
  field_key: string;
  field_type: "text" | "number" | "boolean" | "date" | "select";
  options: string[] | null;
  mission_type: "entree" | "sortie" | "both";
  description: string | null;
  active: boolean;
  required: boolean;
  position: number;
}

const MISSION_LABEL: Record<OrgCustomField["mission_type"], string> = {
  entree: "Entrée",
  sortie: "Sortie",
  both: "Les deux",
};

const TYPE_LABEL: Record<OrgCustomField["field_type"], string> = {
  text: "Texte",
  number: "Nombre",
  boolean: "Booléen",
  date: "Date",
  select: "Liste",
};

export default function CustomFieldsTab({ organizationId }: { organizationId: string }) {
  const [fields, setFields] = useState<OrgCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // New field form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<OrgCustomField["field_type"]>("text");
  const [newMissionType, setNewMissionType] =
    useState<OrgCustomField["mission_type"]>("both");
  const [newOptions, setNewOptions] = useState("");
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/custom-fields`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de chargement");
        return;
      }
      setFields(data.customFields ?? []);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchActivation(
    fieldId: string,
    patch: Partial<Pick<OrgCustomField, "active" | "required" | "position">>
  ) {
    setSavingId(fieldId);
    // Optimistic update
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...patch } : f))
    );
    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/custom-fields`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ custom_field_id: fieldId, ...patch }),
        }
      );
      if (!res.ok) {
        // Rollback on failure by reloading
        await load();
      }
    } catch {
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault();
    setNewError("");
    setNewSaving(true);
    try {
      const payload: Record<string, unknown> = {
        label: newLabel.trim(),
        field_key: newFieldKey.trim(),
        field_type: newFieldType,
        mission_type: newMissionType,
      };
      if (newFieldType === "select") {
        payload.options = newOptions
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
      const res = await fetch(`/api/admin/custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewError(data.error || "Erreur");
        return;
      }
      setShowNewForm(false);
      setNewLabel("");
      setNewFieldKey("");
      setNewFieldType("text");
      setNewMissionType("both");
      setNewOptions("");
      await load();
    } catch {
      setNewError("Erreur de connexion");
    } finally {
      setNewSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4">
        {error}
      </div>
    );
  }

  const groups: OrgCustomField["mission_type"][] = ["entree", "sortie", "both"];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Champs personnalisés
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Activez les champs que vos utilisateurs doivent remplir lors d&apos;une
          demande. Les valeurs sont stockées dans Supabase — jamais envoyées à
          Odoo.
        </p>

        {groups.map((mt) => {
          const rows = fields.filter((f) => f.mission_type === mt);
          if (rows.length === 0) return null;
          return (
            <div key={mt} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {MISSION_LABEL[mt]}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-4 font-medium">Label</th>
                      <th className="py-2 pr-4 font-medium">Clé</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Actif</th>
                      <th className="py-2 pr-4 font-medium">Obligatoire</th>
                      <th className="py-2 font-medium">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 pr-4 text-gray-700">{f.label}</td>
                        <td className="py-2 pr-4 text-gray-500 font-mono text-xs">
                          {f.field_key}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {TYPE_LABEL[f.field_type]}
                          {f.field_type === "select" &&
                            Array.isArray(f.options) && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({f.options.join(", ")})
                              </span>
                            )}
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() =>
                              patchActivation(f.id, { active: !f.active })
                            }
                            disabled={savingId === f.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              f.active ? "bg-primary" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                f.active ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() =>
                              patchActivation(f.id, { required: !f.required })
                            }
                            disabled={savingId === f.id || !f.active}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              f.required ? "bg-primary" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                f.required ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={f.position}
                            disabled={savingId === f.id || !f.active}
                            onChange={(e) =>
                              setFields((prev) =>
                                prev.map((x) =>
                                  x.id === f.id
                                    ? { ...x, position: Number(e.target.value) || 0 }
                                    : x
                                )
                              )
                            }
                            onBlur={(e) =>
                              patchActivation(f.id, {
                                position: Number(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-dark text-sm disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="mt-6 pt-4 border-t border-gray-100">
          {showNewForm ? (
            <form
              onSubmit={handleCreateField}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Ajouter un champ à la bibliothèque
                </h3>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Clé (snake_case) *
                </label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) =>
                    setNewFieldKey(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_")
                    )
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Type *
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) =>
                    setNewFieldType(
                      e.target.value as OrgCustomField["field_type"]
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                >
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="boolean">Booléen</option>
                  <option value="date">Date</option>
                  <option value="select">Liste</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Mission *
                </label>
                <select
                  value={newMissionType}
                  onChange={(e) =>
                    setNewMissionType(
                      e.target.value as OrgCustomField["mission_type"]
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                >
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                  <option value="both">Les deux</option>
                </select>
              </div>
              {newFieldType === "select" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Options (séparées par des virgules) *
                  </label>
                  <input
                    type="text"
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                  />
                </div>
              )}
              {newError && (
                <div className="sm:col-span-2 bg-red-50 text-red-600 text-sm rounded-xl p-3">
                  {newError}
                </div>
              )}
              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={newSaving}
                  className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {newSaving ? "Enregistrement..." : "Créer le champ"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewError("");
                  }}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Ajouter un champ à la bibliothèque
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
