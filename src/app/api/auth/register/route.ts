import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Invitation {
  id: string;
  code: string;
  email: string;
  odoo_partner_id: number | null;
  odoo_agency_id: number | null;
  client_type: string | null;
  nom_societe: string | null;
  expires_at: string;
  used_at: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!code) {
      return NextResponse.json({ error: "Code d'invitation requis" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── 1. Validate invitation ──
    const { data: invitation, error: inviteError } = await admin
      .from("invitations")
      .select("*")
      .eq("code", code)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle<Invitation>();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    if (invitation.email.trim().toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Cet email ne correspond pas au code d'invitation" },
        { status: 400 }
      );
    }

    // ── 2. Create Supabase user ──
    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !createdUser?.user) {
      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Impossible de créer le compte. Cet email est peut-être déjà utilisé.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    // ── 3. Create portal_clients row ──
    const { error: clientError } = await admin.from("portal_clients").insert({
      user_id: userId,
      odoo_partner_id: invitation.odoo_partner_id,
      odoo_agency_id: invitation.odoo_agency_id,
      client_type: invitation.client_type ?? "agency",
      nom_societe: invitation.nom_societe,
      nom_bailleur: invitation.nom_societe,
      email_bailleur: email,
      odoo_template_prefix: "AXIS",
    });

    if (clientError) {
      // Roll back the auth user so the invitation can be retried cleanly.
      await admin.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: clientError.message || "Erreur lors de la création du profil client." },
        { status: 500 }
      );
    }

    // ── 4. Mark invitation as used ──
    const { error: markError } = await admin
      .from("invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (markError) {
      console.error("[register] failed to mark invitation as used:", markError);
    }

    // ── 5. Sign the user in (sets session cookies on the response) ──
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("[register] auto sign-in failed:", signInError);
      return NextResponse.json(
        {
          ok: true,
          warning:
            "Compte créé, mais la connexion automatique a échoué. Connectez-vous manuellement.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
