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

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (banError) {
      console.error("[admin/users/[id]/unblock] auth unban error:", banError);
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    // Clear the applicative block
    const { error: dbError } = await admin
      .from("portal_clients")
      .update({
        blocked_at: null,
        blocked_by: null,
      })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (dbError) {
      console.error("[admin/users/[id]/unblock] db update error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/users/[id]/unblock error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
