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
        { error: "Vous ne pouvez pas vous supprimer vous-meme." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Soft-delete the portal_clients row (keeps odoo_partner_id intact
    //    for mission history integrity).
    const { data: updated, error: dbError } = await admin
      .from("portal_clients")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (dbError) {
      console.error("[admin/users/[id]/soft-delete] db update error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Utilisateur introuvable ou deja supprime." },
        { status: 404 }
      );
    }

    // 2. Ban the auth user so existing sessions are revoked and they cannot
    //    log back in. We DO NOT hard-delete auth.users.
    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h",
    });

    if (banError) {
      console.error("[admin/users/[id]/soft-delete] ban error:", banError);
      return NextResponse.json({ error: banError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/users/[id]/soft-delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
