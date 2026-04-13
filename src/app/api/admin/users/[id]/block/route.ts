import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h", // ~100 years = effectively forever
    });

    if (error) {
      console.error("[admin/users/[id]/block] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/users/[id]/block error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
