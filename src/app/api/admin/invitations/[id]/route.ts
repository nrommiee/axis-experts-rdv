import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
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

    // Only delete invitations that haven't been used
    const { data: invitation, error: fetchError } = await admin
      .from("invitations")
      .select("id, used_at")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    if (invitation.used_at) {
      return NextResponse.json(
        { error: "Impossible d'annuler une invitation deja utilisee" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from("invitations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[admin/invitations/[id]] delete failed:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/invitations/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
