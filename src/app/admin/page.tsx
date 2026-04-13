"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  organizations: number;
  users: number;
  pending_invitations: number;
}

interface PortalOrdersData {
  months: string[];
  series: { name: string; data: number[] }[];
  total: number;
}

const CHART_COLORS = [
  "#F5B800", // Jaune Axis
  "#374151", // Gris fonce
  "#FCD34D", // Jaune clair
  "#9CA3AF", // Gris moyen
  "#D97706", // Jaune fonce
  "#6B7280", // Gris
  "#FBBF24", // Jaune dore
  "#4B5563", // Gris charbon
];

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const names = [
    "Jan",
    "Fev",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aou",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<PortalOrdersData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

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

    (async () => {
      try {
        const res = await fetch("/api/admin/stats/portal-orders", {
          cache: "no-store",
        });
        if (res.ok) {
          setChartData(await res.json());
        } else {
          setChartError(true);
        }
      } catch {
        setChartError(true);
      } finally {
        setChartLoading(false);
      }
    })();
  }, []);

  const statCards = [
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

  // Transform API data to Recharts format
  const rechartsData =
    chartData?.months.map((month, i) => {
      const row: Record<string, string | number> = {
        month: formatMonth(month),
      };
      for (const s of chartData.series) {
        row[s.name] = s.data[i];
      }
      return row;
    }) ?? [];

  const hasChartData =
    chartData && chartData.series.length > 0 && chartData.total > 0;

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
        {statCards.map((card) => (
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

      {/* Portal orders chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            RDV portail par mois
          </h2>
          {hasChartData && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
              {chartData.total} total
            </span>
          )}
        </div>

        {chartLoading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">
              Chargement du graphique...
            </div>
          </div>
        ) : chartError ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-red-500">
              Erreur lors du chargement des donnees.
            </p>
          </div>
        ) : !hasChartData ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center max-w-md">
              Aucune donnee disponible. Les prochains RDV soumis via le portail
              apparaitront ici.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
              {chartData.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  stackId="portal"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={
                    i === chartData.series.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link
          href="/admin/organizations"
          className="text-gray-500 hover:text-primary transition-colors"
        >
          Gestion des organisations &rarr;
        </Link>
        <Link
          href="/admin/users"
          className="text-gray-500 hover:text-primary transition-colors"
        >
          Gestion des utilisateurs &rarr;
        </Link>
      </div>
    </div>
  );
}
