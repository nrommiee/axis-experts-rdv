import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    const order_ref =
      typeof body.order_ref === "string" ? body.order_ref.trim() : "";
    if (!order_ref) {
      return NextResponse.json(
        { error: "order_ref requis" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.values)) {
      return NextResponse.json(
        { error: "values doit être un tableau" },
        { status: 400 }
      );
    }

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow?.organization_id) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 400 }
      );
    }

    const rows: {
      organization_id: string;
      custom_field_id: string;
      order_ref: string;
      value: string;
    }[] = [];

    for (const v of body.values) {
      if (!v || typeof v !== "object") continue;
      const custom_field_id =
        typeof v.custom_field_id === "string" ? v.custom_field_id : "";
      const value = v.value == null ? "" : String(v.value);
      if (!custom_field_id || !value) continue;
      rows.push({
        organization_id: clientRow.organization_id,
        custom_field_id,
        order_ref,
        value,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("rdv_custom_values")
      .upsert(rows, { onConflict: "organization_id,custom_field_id,order_ref" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("POST /api/rdv-custom-values error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("order_refs") || "";
    const order_refs = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (order_refs.length === 0) {
      return NextResponse.json({ values: {} });
    }

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow?.organization_id) {
      return NextResponse.json({ values: {} });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("rdv_custom_values")
      .select(
        "order_ref, value, custom_field:custom_fields(field_key)"
      )
      .eq("organization_id", clientRow.organization_id)
      .in("order_ref", order_refs);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const out: Record<string, Record<string, string>> = {};
    for (const row of data ?? []) {
      const cf = row.custom_field as unknown as { field_key?: string } | null;
      const fk = cf?.field_key;
      if (!fk) continue;
      if (!out[row.order_ref]) out[row.order_ref] = {};
      out[row.order_ref][fk] = row.value;
    }

    return NextResponse.json({ values: out });
  } catch (err) {
    console.error("GET /api/rdv-custom-values error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
