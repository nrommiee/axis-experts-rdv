import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit/log-action";

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

    const admin = createAdminClient();

    // Verify the order_ref belongs to the user's organization. portal_submissions
    // is the source of truth: every submit-rdv writes the Odoo order name there
    // tagged with organization_id. Without this check, a value posted for an
    // arbitrary order_ref would still be accepted as long as it landed under
    // the user's own org.
    const { data: submission } = await admin
      .from("portal_submissions")
      .select("id, organization_id")
      .eq("odoo_order_name", order_ref)
      .eq("organization_id", clientRow.organization_id)
      .maybeSingle();

    if (!submission) {
      console.warn("[rdv-custom-values] invalid order_ref", {
        user_id: user.id,
        order_ref,
        organization_id: clientRow.organization_id,
      });
      return NextResponse.json(
        { error: "order_ref invalide" },
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

    // Whitelist custom_field_ids: each one must be activated for this org via
    // organization_custom_fields (active = true). Reject the whole payload if
    // any value points at a foreign / inactive field; this prevents cross-org
    // pollution of rdv_custom_values.
    const incomingFieldIds = [...new Set(rows.map((r) => r.custom_field_id))];
    const { data: activations, error: activationError } = await admin
      .from("organization_custom_fields")
      .select("custom_field_id")
      .eq("organization_id", clientRow.organization_id)
      .eq("active", true)
      .in("custom_field_id", incomingFieldIds);

    if (activationError) {
      return NextResponse.json(
        { error: activationError.message },
        { status: 500 }
      );
    }

    const allowedFieldIds = new Set(
      (activations ?? []).map((a) => a.custom_field_id)
    );
    const rejected = incomingFieldIds.filter((id) => !allowedFieldIds.has(id));
    if (rejected.length > 0) {
      console.warn("[rdv-custom-values] invalid custom_field_id", {
        user_id: user.id,
        organization_id: clientRow.organization_id,
        order_ref,
        rejected,
      });
      return NextResponse.json(
        { error: "custom_field_id invalide" },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("rdv_custom_values")
      .upsert(rows, { onConflict: "organization_id,custom_field_id,order_ref" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAction({
      userId: user.id,
      organizationId: clientRow.organization_id,
      action: "rdv.update",
      resourceType: "rdv",
      resourceId: order_ref,
      metadata: {
        scope: "custom_values",
        custom_field_ids: incomingFieldIds,
        count: rows.length,
      },
    });

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
