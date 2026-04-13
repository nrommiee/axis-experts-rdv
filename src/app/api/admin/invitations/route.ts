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
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/invitations] select failed:", error);
      return NextResponse.json(
        { error: error.message || "Erreur lors du chargement des invitations." },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations: data ?? [] });
  } catch (err) {
    console.error("GET /api/admin/invitations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
