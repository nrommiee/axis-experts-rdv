"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  organizations: number;
  users: number;
  pending_invitations: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Organisations",
      value: stats?.organizations ?? "—",
      href: "/admin/organizations",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Utilisateurs actifs",
      value: stats?.users ?? "—",
      href: "/admin/users",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Invitations en attente",
      value: stats?.pending_invitations ?? "—",
      href: "/admin/organizations",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d&apos;ensemble du portail Axis Experts
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? (
                <span className="inline-block w-10 h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                <span className={card.color + " px-2 py-1 rounded-lg"}>
                  {card.value}
                </span>
              )}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/organizations"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">
            Gestion des organisations
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Ajouter, modifier et consulter les organisations clientes
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
        >
          <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">
            Gestion des utilisateurs
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Voir tous les utilisateurs et leur statut
          </p>
        </Link>
      </div>
    </div>
  );
}
