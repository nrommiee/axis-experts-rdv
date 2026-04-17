import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 50;

type NameField = "first_name" | "last_name";

function normalizeName(
  raw: unknown,
  field: NameField
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === null || raw === "") {
    return { ok: true, value: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: `${field} doit etre une chaine` };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `${field} trop long (max ${MAX_NAME_LENGTH})`,
    };
  }
  return { ok: true, value: trimmed };
}

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
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (error || !clientRow) {
      return NextResponse.json(
        { error: "Client non configure" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      first_name:
        typeof clientRow.first_name === "string" ? clientRow.first_name : "",
      last_name:
        typeof clientRow.last_name === "string" ? clientRow.last_name : "",
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

    if (!("first_name" in body) || !("last_name" in body)) {
      return NextResponse.json(
        { error: "first_name et last_name requis" },
        { status: 400 }
      );
    }

    const first = normalizeName(body.first_name, "first_name");
    if (!first.ok) {
      return NextResponse.json({ error: first.error }, { status: 400 });
    }
    const last = normalizeName(body.last_name, "last_name");
    if (!last.ok) {
      return NextResponse.json({ error: last.error }, { status: 400 });
    }

    // RLS ensures the user can only update their own row (auth.uid() = user_id).
    // Chaining .select() lets us verify that at least one row was actually
    // updated — otherwise supabase.update() returns success on 0 matches
    // (e.g. if the RLS policy silently filters everything out).
    const { data, error: updateError } = await supabase
      .from("portal_clients")
      .update({ first_name: first.value, last_name: last.value })
      .eq("user_id", user.id)
      .select("first_name, last_name");

    if (updateError) {
      console.error("PATCH /api/profile update failed:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Erreur lors de la mise a jour" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error(
        "PATCH /api/profile update matched 0 rows for user:",
        user.id
      );
      return NextResponse.json(
        { error: "Aucun profil n'a ete mis a jour (verifiez les permissions)" },
        { status: 500 }
      );
    }

    const updated = data[0];
    return NextResponse.json({
      ok: true,
      first_name: typeof updated.first_name === "string" ? updated.first_name : "",
      last_name: typeof updated.last_name === "string" ? updated.last_name : "",
    });
  } catch (err) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
