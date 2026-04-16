"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  getUserStatus,
  type UserStatus,
  type UserStatusRow,
} from "@/lib/admin-users";

interface User extends UserStatusRow {
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

type UserActionKind = "block" | "unblock" | "delete";

interface UserActionTarget {
  user: User;
  kind: UserActionKind;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<UserActionTarget | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

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

  async function runUserAction(target: UserActionTarget) {
    const { user, kind } = target;
    setActionLoading(true);
    try {
      const endpointByKind: Record<UserActionKind, string> = {
        block: "block",
        unblock: "unblock",
        delete: "soft-delete",
      };
      const res = await fetch(
        `/api/admin/users/${user.user_id}/${endpointByKind[kind]}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Action impossible");
        return;
      }
      const successByKind: Record<UserActionKind, string> = {
        block: `${user.email} a été bloqué.`,
        unblock: `${user.email} a été débloqué.`,
        delete: `${user.email} a été supprimé.`,
      };
      toast.success(successByKind[kind]);
      await loadUsers();
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

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
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const status: UserStatus = getUserStatus(u);
                  const blocked = status === "blocked";
                  return (
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
                        <Badge
                          variant={blocked ? "destructive" : "secondary"}
                          className={
                            blocked
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          }
                        >
                          {blocked ? "Bloqué" : "Actif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {blocked ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setPendingAction({ user: u, kind: "unblock" })
                              }
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              Débloquer
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setPendingAction({ user: u, kind: "block" })
                              }
                              className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                              Bloquer
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPendingAction({ user: u, kind: "delete" })
                            }
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !actionLoading) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          {pendingAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingAction.kind === "block" &&
                    `Bloquer ${pendingAction.user.email} ?`}
                  {pendingAction.kind === "unblock" &&
                    `Débloquer ${pendingAction.user.email} ?`}
                  {pendingAction.kind === "delete" &&
                    `Supprimer ${pendingAction.user.email} ?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingAction.kind === "block" &&
                    "L'utilisateur ne pourra plus se connecter. Vous pourrez le débloquer à tout moment."}
                  {pendingAction.kind === "unblock" &&
                    "L'utilisateur pourra à nouveau se connecter."}
                  {pendingAction.kind === "delete" &&
                    "Cette action est irréversible (soft delete). L'historique des missions est conservé mais l'utilisateur ne pourra plus se connecter."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={actionLoading}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (pendingAction) runUserAction(pendingAction);
                  }}
                  disabled={actionLoading}
                  className={
                    pendingAction.kind === "delete"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : pendingAction.kind === "block"
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }
                >
                  {actionLoading
                    ? "..."
                    : pendingAction.kind === "block"
                      ? "Bloquer"
                      : pendingAction.kind === "unblock"
                        ? "Débloquer"
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
