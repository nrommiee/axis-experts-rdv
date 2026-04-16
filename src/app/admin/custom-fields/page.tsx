"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { toast } from "@/lib/toast";

interface CustomField {
  id: string;
  label: string;
  field_key: string;
  field_type: "text" | "number" | "boolean" | "date" | "select";
  options: string[] | null;
  mission_type: "entree" | "sortie" | "both";
  description: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface Activation {
  organization_id: string;
  custom_field_id: string;
  active: boolean | null;
  required: boolean | null;
  position: number | null;
}

const MISSION_LABEL: Record<CustomField["mission_type"], string> = {
  entree: "Entrée",
  sortie: "Sortie",
  both: "Les deux",
};

const TYPE_LABEL: Record<CustomField["field_type"], string> = {
  text: "Texte",
  number: "Nombre",
  boolean: "Booléen",
  date: "Date",
  select: "Liste",
};

type EditState = {
  label: string;
  description: string;
  mission_type: CustomField["mission_type"];
  options: string;
};

export default function AdminCustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomField | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<CustomField["field_type"]>("text");
  const [newMissionType, setNewMissionType] =
    useState<CustomField["mission_type"]>("both");
  const [newDescription, setNewDescription] = useState("");
  const [newOptions, setNewOptions] = useState("");
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState("");

  const loadFields = useCallback(async () => {
    const res = await fetch("/api/admin/custom-fields", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur de chargement");
    setFields((data.customFields ?? []) as CustomField[]);
  }, []);

  const loadActivations = useCallback(async () => {
    const res = await fetch("/api/admin/custom-fields/activations", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur de chargement");
    setOrganizations((data.organizations ?? []) as Organization[]);
    setActivations((data.activations ?? []) as Activation[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadFields(), loadActivations()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [loadFields, loadActivations]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activationsByField = useMemo(() => {
    const map = new Map<string, Map<string, Activation>>();
    for (const a of activations) {
      if (!map.has(a.custom_field_id)) {
        map.set(a.custom_field_id, new Map());
      }
      map.get(a.custom_field_id)!.set(a.organization_id, a);
    }
    return map;
  }, [activations]);

  function startEdit(field: CustomField) {
    setEditingId(field.id);
    setEditState({
      label: field.label,
      description: field.description ?? "",
      mission_type: field.mission_type,
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
    });
    setRowError((prev) => ({ ...prev, [field.id]: "" }));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit(field: CustomField) {
    if (!editState) return;
    setSavingId(field.id);
    setRowError((prev) => ({ ...prev, [field.id]: "" }));
    try {
      const payload: Record<string, unknown> = {
        id: field.id,
        label: editState.label.trim(),
        description: editState.description.trim() || null,
        mission_type: editState.mission_type,
      };
      if (field.field_type === "select") {
        payload.options = editState.options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
      const res = await fetch("/api/admin/custom-fields", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setRowError((prev) => ({
          ...prev,
          [field.id]: data.error || "Erreur",
        }));
        return;
      }
      setFields((prev) =>
        prev.map((f) => (f.id === field.id ? (data.customField as CustomField) : f))
      );
      cancelEdit();
    } catch {
      setRowError((prev) => ({
        ...prev,
        [field.id]: "Erreur de connexion",
      }));
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDeleteField(field: CustomField) {
    setSavingId(field.id);
    setRowError((prev) => ({ ...prev, [field.id]: "" }));
    try {
      const res = await fetch(
        `/api/admin/custom-fields?id=${encodeURIComponent(field.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || "Erreur";
        setRowError((prev) => ({ ...prev, [field.id]: message }));
        toast.error(message);
        return;
      }
      setFields((prev) => prev.filter((f) => f.id !== field.id));
      setActivations((prev) =>
        prev.filter((a) => a.custom_field_id !== field.id)
      );
      if (expandedId === field.id) setExpandedId(null);
      toast.success(`« ${field.label} » supprimé.`);
    } catch {
      setRowError((prev) => ({
        ...prev,
        [field.id]: "Erreur de connexion",
      }));
      toast.error("Erreur de connexion");
    } finally {
      setSavingId(null);
      setPendingDelete(null);
    }
  }

  async function toggleOrgActivation(
    field: CustomField,
    org: Organization,
    nextActive: boolean
  ) {
    const key = `${field.id}:${org.id}`;
    setTogglingKey(key);

    const current = activationsByField.get(field.id)?.get(org.id);
    const optimistic: Activation = {
      organization_id: org.id,
      custom_field_id: field.id,
      active: nextActive,
      required: current?.required ?? false,
      position: current?.position ?? 0,
    };
    setActivations((prev) => {
      const without = prev.filter(
        (a) =>
          !(a.custom_field_id === field.id && a.organization_id === org.id)
      );
      return [...without, optimistic];
    });

    try {
      const res = await fetch(
        `/api/admin/organizations/${org.id}/custom-fields`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            custom_field_id: field.id,
            active: nextActive,
          }),
        }
      );
      if (!res.ok) {
        await loadActivations();
      }
    } catch {
      await loadActivations();
    } finally {
      setTogglingKey(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
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
      if (newDescription.trim()) payload.description = newDescription.trim();
      if (newFieldType === "select") {
        payload.options = newOptions
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
      const res = await fetch("/api/admin/custom-fields", {
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
      setNewDescription("");
      setNewOptions("");
      await loadFields();
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

  const groups: CustomField["mission_type"][] = ["entree", "sortie", "both"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Champs personnalisés
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bibliothèque globale. Les valeurs sont stockées dans Supabase —
            jamais envoyées à Odoo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          {showNewForm ? "Fermer" : "+ Nouveau champ"}
        </button>
      </div>

      {showNewForm && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Nouveau champ
          </h2>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
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
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")
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
                    e.target.value as CustomField["field_type"]
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
                    e.target.value as CustomField["mission_type"]
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
              >
                <option value="entree">Entrée</option>
                <option value="sortie">Sortie</option>
                <option value="both">Les deux</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
              />
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
        </section>
      )}

      {groups.map((mt) => {
        const rows = fields.filter((f) => f.mission_type === mt);
        if (rows.length === 0) return null;
        return (
          <section
            key={mt}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {MISSION_LABEL[mt]}
            </h2>
            <div className="space-y-3">
              {rows.map((field) => {
                const isEditing = editingId === field.id;
                const isSaving = savingId === field.id;
                const err = rowError[field.id];
                const fieldActivations =
                  activationsByField.get(field.id) ?? new Map();
                const activeOrgCount = Array.from(fieldActivations.values()).filter(
                  (a) => a.active
                ).length;
                const isExpanded = expandedId === field.id;

                return (
                  <div
                    key={field.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    {isEditing && editState ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Label
                            </label>
                            <input
                              type="text"
                              value={editState.label}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  label: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Mission
                            </label>
                            <select
                              value={editState.mission_type}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  mission_type: e.target
                                    .value as CustomField["mission_type"],
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                            >
                              <option value="entree">Entrée</option>
                              <option value="sortie">Sortie</option>
                              <option value="both">Les deux</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editState.description}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                            />
                          </div>
                          {field.field_type === "select" && (
                            <div className="sm:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">
                                Options (séparées par des virgules)
                              </label>
                              <input
                                type="text"
                                value={editState.options}
                                onChange={(e) =>
                                  setEditState({
                                    ...editState,
                                    options: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-dark text-sm"
                              />
                            </div>
                          )}
                        </div>
                        {err && (
                          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
                            {err}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(field)}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-800">
                                {field.label}
                              </h3>
                              <span className="text-xs font-mono text-gray-400">
                                {field.field_key}
                              </span>
                              <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">
                                {TYPE_LABEL[field.field_type]}
                              </span>
                            </div>
                            {field.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {field.description}
                              </p>
                            )}
                            {field.field_type === "select" &&
                              Array.isArray(field.options) && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Options : {field.options.join(", ")}
                                </p>
                              )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : field.id)
                              }
                              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Activations ({activeOrgCount}/{organizations.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(field)}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(field)}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-full border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                        {err && (
                          <div className="mt-2 bg-red-50 text-red-600 text-sm rounded-xl p-3">
                            {err}
                          </div>
                        )}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {organizations.length === 0 ? (
                              <p className="text-sm text-gray-400">
                                Aucune organisation.
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {organizations.map((org) => {
                                  const a = fieldActivations.get(org.id);
                                  const isActive = a?.active === true;
                                  const key = `${field.id}:${org.id}`;
                                  const busy = togglingKey === key;
                                  return (
                                    <div
                                      key={org.id}
                                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
                                    >
                                      <span className="text-sm text-gray-700 truncate">
                                        {org.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleOrgActivation(
                                            field,
                                            org,
                                            !isActive
                                          )
                                        }
                                        disabled={busy}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                                          isActive
                                            ? "bg-primary"
                                            : "bg-gray-300"
                                        }`}
                                        aria-label={
                                          isActive ? "Désactiver" : "Activer"
                                        }
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isActive
                                              ? "translate-x-6"
                                              : "translate-x-1"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {fields.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          Aucun champ personnalisé. Cliquez sur « Nouveau champ » pour
          commencer.
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && savingId === null) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          {pendingDelete && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Supprimer « {pendingDelete.label} » ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action désactive aussi le champ pour toutes les
                  organisations. Elle est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={savingId === pendingDelete.id}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (pendingDelete) confirmDeleteField(pendingDelete);
                  }}
                  disabled={savingId === pendingDelete.id}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {savingId === pendingDelete.id
                    ? "Suppression..."
                    : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
