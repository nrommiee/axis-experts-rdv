import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_DRAFTS_PER_USER = 250;

// GET /api/drafts — list drafts for current user (lightweight)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rdv_drafts")
    .select("id, title, current_step, created_at, updated_at, document_paths")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/drafts — create or update a draft
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const {
    id,
    formData,
    selectedProduct,
    selectedOptions,
    currentStep,
    documentPaths,
    title,
  } = body;

  if (!formData || typeof formData !== "object") {
    return NextResponse.json(
      { error: "formData requis" },
      { status: 400 }
    );
  }

  // Upsert: if id is provided, update; otherwise insert
  if (id) {
    const { data, error } = await supabase
      .from("rdv_drafts")
      .update({
        title: title || null,
        form_data: formData,
        selected_product: selectedProduct || null,
        selected_options: selectedOptions || [],
        current_step: currentStep ?? 0,
        document_paths: documentPaths || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Insert — check limit first
  const { count, error: countError } = await supabase
    .from("rdv_drafts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= MAX_DRAFTS_PER_USER) {
    return NextResponse.json(
      { error: `Limite de ${MAX_DRAFTS_PER_USER} brouillons atteinte` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("rdv_drafts")
    .insert({
      user_id: user.id,
      title: title || null,
      form_data: formData,
      selected_product: selectedProduct || null,
      selected_options: selectedOptions || [],
      current_step: currentStep ?? 0,
      document_paths: documentPaths || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
