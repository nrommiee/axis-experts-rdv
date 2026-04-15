import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["text", "number", "boolean", "date", "select"] as const;
const ALLOWED_MISSIONS = ["entree", "sortie", "both"] as const;

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
    const { data, error } = await admin
      .from("custom_fields")
      .select("*")
      .order("mission_type", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customFields: data ?? [] });
  } catch (err) {
    console.error("GET /api/admin/custom-fields error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    const label = typeof body.label === "string" ? body.label.trim() : "";
    const field_key =
      typeof body.field_key === "string" ? body.field_key.trim() : "";
    const field_type =
      typeof body.field_type === "string" ? body.field_type.trim() : "";
    const mission_type =
      typeof body.mission_type === "string" ? body.mission_type.trim() : "";

    if (!label) return NextResponse.json({ error: "Label requis" }, { status: 400 });
    if (!/^[a-z0-9_]+$/.test(field_key)) {
      return NextResponse.json(
        { error: "field_key invalide (minuscules, chiffres, _ uniquement)" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(field_type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json({ error: "field_type invalide" }, { status: 400 });
    }
    if (
      !ALLOWED_MISSIONS.includes(
        mission_type as (typeof ALLOWED_MISSIONS)[number]
      )
    ) {
      return NextResponse.json({ error: "mission_type invalide" }, { status: 400 });
    }

    let options: string[] | null = null;
    if (field_type === "select") {
      if (!Array.isArray(body.options) || body.options.length === 0) {
        return NextResponse.json(
          { error: "options requises pour un champ select" },
          { status: 400 }
        );
      }
      options = body.options
        .filter((o: unknown) => typeof o === "string" && o.trim())
        .map((o: string) => o.trim());
      if (options && options.length === 0) {
        return NextResponse.json({ error: "options vides" }, { status: 400 });
      }
    }

    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("custom_fields")
      .insert({
        label,
        field_key,
        field_type,
        mission_type,
        options,
        description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, customField: data });
  } catch (err) {
    console.error("POST /api/admin/custom-fields error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
