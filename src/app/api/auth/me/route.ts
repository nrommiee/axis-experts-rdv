import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: clientRow, error } = await supabase
      .from("portal_clients")
      .select("client_type, nom_societe")
      .eq("user_id", user.id)
      .single();

    if (error || !clientRow) {
      return NextResponse.json(
        { error: "Client non configuré" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      client_type: clientRow.client_type ?? "social",
      nom_societe: clientRow.nom_societe ?? "",
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
