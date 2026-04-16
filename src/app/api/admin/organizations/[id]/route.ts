import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(
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

    // Fetch organization
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Fetch users linked to this organization (exclude soft-deleted)
    const { data: clients } = await admin
      .from("portal_clients")
      .select(
        "id, user_id, email_bailleur, nom_bailleur, created_at, blocked_at, blocked_by, deleted_at, deleted_by"
      )
      .eq("organization_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Fetch auth users' emails + last_sign_in + ban status for each client
    const users = [];
    for (const client of clients ?? []) {
      const { data: authData } = await admin.auth.admin.getUserById(
        client.user_id
      );
      users.push({
        ...client,
        email: authData?.user?.email ?? client.email_bailleur ?? "—",
        last_sign_in_at: authData?.user?.last_sign_in_at ?? null,
        is_banned: authData?.user?.banned_until
          ? new Date(authData.user.banned_until) > new Date()
          : false,
      });
    }

    // Fetch pending invitations (used_at IS NULL) for this organization
    const { data: invitations } = await admin
      .from("invitations")
      .select("*")
      .eq("organization_id", id)
      .is("used_at", null)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      organization: org,
      users,
      invitations: invitations ?? [],
    });
  } catch (err) {
    console.error("GET /api/admin/organizations/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    // Build update payload — only include fields that are present
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.odoo_partner_id !== undefined)
      updates.odoo_partner_id = Number(body.odoo_partner_id);
    if (body.odoo_agency_id !== undefined)
      updates.odoo_agency_id =
        body.odoo_agency_id === null || body.odoo_agency_id === ""
          ? null
          : Number(body.odoo_agency_id);
    if (typeof body.odoo_template_prefix === "string")
      updates.odoo_template_prefix = body.odoo_template_prefix.trim();
    if (typeof body.client_type === "string")
      updates.client_type = body.client_type === "agency" ? "agency" : "social";
    if (typeof body.logo_url === "string")
      updates.logo_url = body.logo_url.trim() || null;
    if (typeof body.contact_name === "string")
      updates.contact_name = body.contact_name.trim() || null;
    if (typeof body.contact_email === "string")
      updates.contact_email = body.contact_email.trim() || null;
    if (typeof body.contact_phone === "string")
      updates.contact_phone = body.contact_phone.trim() || null;
    if (body.product_config !== undefined)
      updates.product_config = body.product_config;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("[admin/organizations/[id]] update failed:", updateError);
      return NextResponse.json(
        { error: updateError?.message || "Erreur lors de la mise a jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, organization: updated });
  } catch (err) {
    console.error("PATCH /api/admin/organizations/[id] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
