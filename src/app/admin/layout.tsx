"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS_PUBLIC = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ? [process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase()]
  : ["n.rommiee@axis-experts.be"];

const AdminContext = createContext<{ adminEmail: string }>({ adminEmail: "" });
export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (
        !user ||
        !ADMIN_EMAILS_PUBLIC.includes(user.email?.toLowerCase() ?? "")
      ) {
        router.replace("/dashboard");
        return;
      }

      setAdminEmail(user.email ?? "");
      setAuthChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">Verification...</div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/organizations", label: "Organisations" },
    { href: "/admin/users", label: "Utilisateurs" },
    { href: "/admin/custom-fields", label: "Champs personnalisés" },
  ];

  return (
    <AdminContext value={{ adminEmail }}>
      <div className="min-h-screen bg-gray-50">
        {/* Top nav */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link
                  href="/admin"
                  className="text-lg font-bold text-gray-800"
                >
                  Administration
                </Link>
                <nav className="hidden sm:flex gap-1">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                className="text-sm text-primary hover:underline"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-2 flex gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </AdminContext>
  );
}
