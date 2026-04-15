import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface OrgCustomFieldRow {
  custom_field_id: string;
  required: boolean | null;
  position: number | null;
  active: boolean | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch all global custom fields
    const { data: allFields, error: fieldsErr } = await admin
      .from("custom_fields")
      .select("*")
      .order("mission_type", { ascending: true })
      .order("label", { ascending: true });

    if (fieldsErr) {
      return NextResponse.json({ error: fieldsErr.message }, { status: 500 });
    }

    // Fetch activation rows for this org
    const { data: activations, error: actErr } = await admin
      .from("organization_custom_fields")
      .select("custom_field_id, required, position, active")
      .eq("organization_id", id);

    if (actErr) {
      return NextResponse.json({ error: actErr.message }, { status: 500 });
    }

    const map = new Map<string, OrgCustomFieldRow>();
    for (const a of (activations ?? []) as OrgCustomFieldRow[]) {
      map.set(a.custom_field_id, a);
    }

    const result = (allFields ?? []).map((f) => {
      const a = map.get(f.id);
      return {
        ...f,
        active: a?.active ?? false,
        required: a?.required ?? false,
        position: a?.position ?? 0,
      };
    });

    return NextResponse.json({ customFields: result });
  } catch (err) {
    console.error(
      "GET /api/admin/organizations/[id]/custom-fields error:",
      err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const custom_field_id =
      typeof body.custom_field_id === "string" ? body.custom_field_id : "";
    if (!custom_field_id) {
      return NextResponse.json(
        { error: "custom_field_id requis" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      organization_id: id,
      custom_field_id,
    };
    if (typeof body.active === "boolean") payload.active = body.active;
    if (typeof body.required === "boolean") payload.required = body.required;
    if (typeof body.position === "number" && Number.isFinite(body.position)) {
      payload.position = Math.trunc(body.position);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organization_custom_fields")
      .upsert(payload, { onConflict: "organization_id,custom_field_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, activation: data });
  } catch (err) {
    console.error(
      "PATCH /api/admin/organizations/[id]/custom-fields error:",
      err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
