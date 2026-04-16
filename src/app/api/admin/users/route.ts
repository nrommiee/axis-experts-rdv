import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch all active (non-soft-deleted) portal_clients with their organization
    const { data: clients, error } = await admin
      .from("portal_clients")
      .select(
        "id, user_id, nom_societe, client_type, created_at, organization_id, blocked_at, blocked_by, deleted_at, deleted_by, organizations(id, name)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/users] select failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with auth user data
    const users = [];
    for (const client of clients ?? []) {
      const { data: authData } = await admin.auth.admin.getUserById(
        client.user_id
      );
      users.push({
        id: client.id,
        user_id: client.user_id,
        email: authData?.user?.email ?? "—",
        nom_societe: client.nom_societe,
        client_type: client.client_type,
        organization_name:
          client.organizations && typeof client.organizations === "object" && !Array.isArray(client.organizations)
            ? (client.organizations as { name: string }).name
            : client.nom_societe ?? "—",
        created_at: client.created_at,
        last_sign_in_at: authData?.user?.last_sign_in_at ?? null,
        blocked_at: client.blocked_at,
        deleted_at: client.deleted_at,
        is_banned: authData?.user?.banned_until
          ? new Date(authData.user.banned_until) > new Date()
          : false,
      });
    }

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
