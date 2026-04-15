import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow?.organization_id) {
      return NextResponse.json({ customFields: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organization_custom_fields")
      .select(
        "required, position, active, custom_field:custom_fields(id, label, field_key, field_type, options, mission_type, description)"
      )
      .eq("organization_id", clientRow.organization_id)
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customFields = (data ?? [])
      .filter((row) => row.custom_field)
      .map((row) => {
        const cf = row.custom_field as unknown as {
          id: string;
          label: string;
          field_key: string;
          field_type: string;
          options: string[] | null;
          mission_type: string;
          description: string | null;
        };
        return {
          id: cf.id,
          label: cf.label,
          field_key: cf.field_key,
          field_type: cf.field_type,
          options: cf.options,
          mission_type: cf.mission_type,
          description: cf.description,
          required: !!row.required,
          position: row.position ?? 0,
        };
      });

    return NextResponse.json({ customFields });
  } catch (err) {
    console.error("GET /api/custom-fields error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
