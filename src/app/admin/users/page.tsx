"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  user_id: string;
  email: string;
  nom_societe: string | null;
  client_type: string | null;
  organization_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_banned: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de chargement");
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} enregistre{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="text-sm text-primary hover:underline"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse text-gray-400">Chargement...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Aucun utilisateur.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Organisation</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Inscription</th>
                  <th className="py-3 px-4 font-medium">Derniere connexion</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-700">{u.email}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {u.organization_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.client_type === "agency"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {u.client_type === "agency" ? "Agence" : "Social"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("fr-BE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
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
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.is_banned
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {u.is_banned ? "Desactive" : "Actif"}
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
