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

    const [orgsRes, activationsRes] = await Promise.all([
      admin
        .from("organizations")
        .select("id, name")
        .order("name", { ascending: true }),
      admin
        .from("organization_custom_fields")
        .select("organization_id, custom_field_id, active, required, position"),
    ]);

    if (orgsRes.error) {
      return NextResponse.json(
        { error: orgsRes.error.message },
        { status: 500 }
      );
    }
    if (activationsRes.error) {
      return NextResponse.json(
        { error: activationsRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizations: orgsRes.data ?? [],
      activations: activationsRes.data ?? [],
    });
  } catch (err) {
    console.error("GET /api/admin/custom-fields/activations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
