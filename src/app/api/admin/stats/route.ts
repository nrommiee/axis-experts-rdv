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

    const [orgsResult, usersResult, invitationsResult] = await Promise.all([
      admin.from("organizations").select("id", { count: "exact", head: true }),
      admin.from("portal_clients").select("id", { count: "exact", head: true }),
      admin
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);

    return NextResponse.json({
      organizations: orgsResult.count ?? 0,
      users: usersResult.count ?? 0,
      pending_invitations: invitationsResult.count ?? 0,
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
