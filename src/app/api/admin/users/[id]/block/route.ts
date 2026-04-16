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

    if (user.id === userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bloquer vous-meme." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h", // ~100 years = effectively forever
    });

    if (banError) {
      console.error("[admin/users/[id]/block] auth ban error:", banError);
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    // Record the applicative block (traceability in portal_clients)
    const { error: dbError } = await admin
      .from("portal_clients")
      .update({
        blocked_at: new Date().toISOString(),
        blocked_by: user.id,
      })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (dbError) {
      console.error("[admin/users/[id]/block] db update error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
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
