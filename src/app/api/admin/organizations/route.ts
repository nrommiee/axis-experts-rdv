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

    // Fetch organizations with user count
    const { data: orgs, error } = await admin
      .from("organizations")
      .select("*, portal_clients(count)")
      .order("name");

    if (error) {
      console.error("[admin/organizations] select failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const organizations = (orgs ?? []).map((org) => ({
      ...org,
      user_count:
        Array.isArray(org.portal_clients) && org.portal_clients.length > 0
          ? (org.portal_clients[0] as { count: number }).count
          : 0,
      portal_clients: undefined,
    }));

    return NextResponse.json({ organizations });
  } catch (err) {
    console.error("GET /api/admin/organizations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const odooPartnerId = Number(body.odoo_partner_id);
    if (!Number.isFinite(odooPartnerId) || odooPartnerId <= 0) {
      return NextResponse.json(
        { error: "Odoo Partner ID requis" },
        { status: 400 }
      );
    }

    const odooAgencyId =
      body.odoo_agency_id === null ||
      body.odoo_agency_id === undefined ||
      body.odoo_agency_id === ""
        ? null
        : Number(body.odoo_agency_id);

    const clientType =
      body.client_type === "agency" ? "agency" : "social";

    const admin = createAdminClient();
    const { data: inserted, error: insertError } = await admin
      .from("organizations")
      .insert({
        name,
        odoo_partner_id: odooPartnerId,
        odoo_agency_id: odooAgencyId,
        odoo_template_prefix:
          typeof body.odoo_template_prefix === "string"
            ? body.odoo_template_prefix.trim() || "AXIS"
            : "AXIS",
        client_type: clientType,
        logo_url: typeof body.logo_url === "string" ? body.logo_url.trim() || null : null,
        contact_name: typeof body.contact_name === "string" ? body.contact_name.trim() || null : null,
        contact_email: typeof body.contact_email === "string" ? body.contact_email.trim() || null : null,
        contact_phone: typeof body.contact_phone === "string" ? body.contact_phone.trim() || null : null,
        product_config: body.product_config ?? null,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("[admin/organizations] insert failed:", insertError);
      return NextResponse.json(
        { error: insertError?.message || "Erreur lors de la creation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, organization: inserted });
  } catch (err) {
    console.error("POST /api/admin/organizations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
