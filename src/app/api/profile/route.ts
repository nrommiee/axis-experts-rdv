import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_DISPLAY_NAME_LENGTH = 80;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { data: clientRow, error } = await supabase
      .from("portal_clients")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    if (error || !clientRow) {
      return NextResponse.json(
        { error: "Client non configure" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      display_name:
        typeof clientRow.display_name === "string" ? clientRow.display_name : "",
    });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    if (!("display_name" in body)) {
      return NextResponse.json(
        { error: "display_name requis" },
        { status: 400 }
      );
    }

    const raw = body.display_name;
    let nextValue: string | null;
    if (raw === null || raw === "") {
      nextValue = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length === 0) {
        nextValue = null;
      } else if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
        return NextResponse.json(
          { error: `display_name trop long (max ${MAX_DISPLAY_NAME_LENGTH})` },
          { status: 400 }
        );
      } else {
        nextValue = trimmed;
      }
    } else {
      return NextResponse.json(
        { error: "display_name doit etre une chaine" },
        { status: 400 }
      );
    }

    // RLS ensures the user can only update their own row (auth.uid() = user_id).
    const { error: updateError } = await supabase
      .from("portal_clients")
      .update({ display_name: nextValue })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("PATCH /api/profile update failed:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Erreur lors de la mise a jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, display_name: nextValue ?? "" });
  } catch (err) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
