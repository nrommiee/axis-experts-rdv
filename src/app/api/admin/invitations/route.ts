import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeUsed = searchParams.get("includeUsed") === "true";

    const admin = createAdminClient();
    let query = admin
      .from("invitations")
      .select("id, email, organization_id, client_type, expires_at, used_at, created_at, organizations:organization_id(name)")
      .order("created_at", { ascending: false });

    if (!includeUsed) {
      query = query.is("used_at", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[admin/invitations] select failed:", error);
      return NextResponse.json(
        { error: error.message || "Erreur lors du chargement des invitations." },
        { status: 500 }
      );
    }

    type InvitationRow = {
      id: string;
      email: string;
      organization_id: string;
      client_type: string;
      expires_at: string;
      used_at: string | null;
      created_at: string;
      organizations: { name: string } | { name: string }[] | null;
    };

    const invitations = ((data ?? []) as InvitationRow[]).map((row) => {
      const orgRel = row.organizations;
      const organization_name = Array.isArray(orgRel)
        ? (orgRel[0]?.name ?? "")
        : (orgRel?.name ?? "");
      return {
        id: row.id,
        email: row.email,
        organization_id: row.organization_id,
        organization_name,
        client_type: row.client_type,
        expires_at: row.expires_at,
        used_at: row.used_at,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ invitations });
  } catch (err) {
    console.error("GET /api/admin/invitations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
