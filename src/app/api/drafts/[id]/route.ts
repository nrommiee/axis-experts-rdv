import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/drafts/[id] — get a single draft (full data)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rdv_drafts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Brouillon introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/drafts/[id] — delete draft + storage files
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Fetch draft first to get document_paths
  const { data: draft } = await supabase
    .from("rdv_drafts")
    .select("document_paths")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!draft) {
    return NextResponse.json(
      { error: "Brouillon introuvable" },
      { status: 404 }
    );
  }

  // Delete storage files if any
  const docPaths = Array.isArray(draft.document_paths)
    ? draft.document_paths
    : [];
  if (docPaths.length > 0) {
    const admin = createAdminClient();
    const storagePaths = docPaths
      .map((d: { path?: string }) => d.path)
      .filter((p): p is string => !!p);
    if (storagePaths.length > 0) {
      await admin.storage.from("rdv-documents").remove(storagePaths);
    }
  }

  // Delete draft row
  const { error } = await supabase
    .from("rdv_drafts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
