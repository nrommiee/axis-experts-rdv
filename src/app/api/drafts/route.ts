import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_DRAFTS_PER_USER = 250;

// GET /api/drafts — list drafts for the current user's organization
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: portalClient } = await supabase
    .from("portal_clients")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!portalClient?.organization_id) {
    return NextResponse.json(
      { error: "Organisation introuvable" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: drafts, error } = await admin
    .from("rdv_drafts")
    .select(
      "id, title, current_step, form_data, created_at, updated_at, document_paths, created_by"
    )
    .eq("organization_id", portalClient.organization_id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = drafts ?? [];
  if (list.length === 0) {
    return NextResponse.json([]);
  }

  // Lookup creator names from portal_clients in a single query
  const creatorIds = Array.from(
    new Set(
      list
        .map((d) => d.created_by)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );

  const creatorNames = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from("portal_clients")
      .select("user_id, nom_bailleur, email_bailleur")
      .in("user_id", creatorIds);

    for (const c of creators ?? []) {
      const name =
        (typeof c.nom_bailleur === "string" && c.nom_bailleur.trim()) ||
        (typeof c.email_bailleur === "string" && c.email_bailleur.trim()) ||
        "";
      if (c.user_id && name) creatorNames.set(c.user_id, name);
    }
  }

  const enriched = list.map((d) => ({
    ...d,
    created_by_name: d.created_by ? creatorNames.get(d.created_by) ?? null : null,
  }));

  return NextResponse.json(enriched);
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

  const { data: portalClient } = await supabase
    .from("portal_clients")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!portalClient?.organization_id) {
    return NextResponse.json(
      { error: "Organisation introuvable" },
      { status: 400 }
    );
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

  const admin = createAdminClient();

  // Upsert: if id is provided, update; otherwise insert
  if (id) {
    const { data, error } = await admin
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
      .eq("organization_id", portalClient.organization_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Insert — check per-user limit first (still scoped to the creator)
  const { count, error: countError } = await admin
    .from("rdv_drafts")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= MAX_DRAFTS_PER_USER) {
    return NextResponse.json(
      { error: `Limite de ${MAX_DRAFTS_PER_USER} brouillons atteinte` },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("rdv_drafts")
    .insert({
      user_id: user.id,
      created_by: user.id,
      organization_id: portalClient.organization_id,
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
