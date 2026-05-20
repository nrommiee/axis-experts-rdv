import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface InvitationRow {
  id: string;
  token: string;
  email: string;
  organization_id: string;
  client_type: string;
  expires_at: string;
  used_at: string | null;
}

interface OrgRow {
  id: string;
  name: string;
  odoo_partner_id: number;
  odoo_agency_id: number | null;
  odoo_template_prefix: string;
  client_type: string;
  logo_url: string | null;
  product_config: unknown;
}

export async function POST(request: Request) {
  try {
    const ipAddress = extractClientIp(request);
    const rl = await checkRateLimit({
      ipAddress,
      endpoint: "auth-setup-account",
      limit: 5,
      windowMinutes: 60,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes, réessayez plus tard" },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rawFirstName =
      typeof body.first_name === "string" ? body.first_name.trim() : "";
    const rawLastName =
      typeof body.last_name === "string" ? body.last_name.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Token d'invitation requis" },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caracteres." },
        { status: 400 }
      );
    }
    if (rawFirstName.length === 0) {
      return NextResponse.json(
        { error: "Le prenom est requis." },
        { status: 400 }
      );
    }
    if (rawFirstName.length > 50) {
      return NextResponse.json(
        { error: "Le prenom ne doit pas depasser 50 caracteres." },
        { status: 400 }
      );
    }
    if (rawLastName.length === 0) {
      return NextResponse.json(
        { error: "Le nom est requis." },
        { status: 400 }
      );
    }
    if (rawLastName.length > 50) {
      return NextResponse.json(
        { error: "Le nom ne doit pas depasser 50 caracteres." },
        { status: 400 }
      );
    }

    const firstName = rawFirstName;
    const lastName = rawLastName;

    const admin = createAdminClient();

    // 1. Validate invitation
    const { data: invitation, error: inviteError } = await admin
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle<InvitationRow>();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Token invalide ou expire" },
        { status: 400 }
      );
    }

    // 2. Get organization data
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("*")
      .eq("id", invitation.organization_id)
      .single<OrgRow>();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 400 }
      );
    }

    // 3. Detect a prior soft-deleted account for this email.
    // portal_clients.email_bailleur is stamped with the invitation email at
    // initial setup, so it doubles as a lookup key for reactivation.
    const { data: priorClient } = await admin
      .from("portal_clients")
      .select("id, user_id, deleted_at")
      .ilike("email_bailleur", invitation.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let userId: string;

    if (priorClient?.user_id) {
      // Pre-existing account: verify auth.users state and reactivate.
      const { data: priorAuth } = await admin.auth.admin.getUserById(
        priorClient.user_id
      );
      const priorUser = priorAuth?.user ?? null;
      const isBanned =
        !!priorUser?.banned_until &&
        new Date(priorUser.banned_until) > new Date();

      if (priorUser && !isBanned && priorClient.deleted_at === null) {
        // Active account already exists for this email: refuse to reuse it.
        // This prevents an invitation flow from being used to take over an
        // unrelated, active account.
        return NextResponse.json(
          {
            error:
              "Cet email est deja utilise par un compte actif. Demandez a l'administrateur de bloquer ou supprimer ce compte avant d'envoyer une nouvelle invitation.",
          },
          { status: 409 }
        );
      }

      if (!priorUser) {
        // The portal_clients row references a user that no longer exists in
        // auth.users. Fall through to the fresh-create path.
        const { data: createdUser, error: createError } =
          await admin.auth.admin.createUser({
            email: invitation.email,
            password,
            email_confirm: true,
          });
        if (createError || !createdUser?.user) {
          return NextResponse.json(
            {
              error:
                createError?.message ||
                "Impossible de creer le compte. Cet email est peut-etre deja utilise.",
            },
            { status: 400 }
          );
        }
        userId = createdUser.user.id;
      } else {
        userId = priorUser.id;
        const { error: reactivateError } =
          await admin.auth.admin.updateUserById(userId, {
            ban_duration: "none",
            password,
          });
        if (reactivateError) {
          console.error(
            "[setup-account] failed to lift ban / set password:",
            reactivateError
          );
          return NextResponse.json(
            {
              error:
                reactivateError.message ||
                "Impossible de reactiver le compte.",
            },
            { status: 500 }
          );
        }
      }
    } else {
      // No prior portal_clients row: standard fresh-create path.
      const { data: createdUser, error: createError } =
        await admin.auth.admin.createUser({
          email: invitation.email,
          password,
          email_confirm: true,
        });
      if (createError || !createdUser?.user) {
        return NextResponse.json(
          {
            error:
              createError?.message ||
              "Impossible de creer le compte. Cet email est peut-etre deja utilise.",
          },
          { status: 400 }
        );
      }
      userId = createdUser.user.id;
    }

    // 4. Insert or update portal_clients row with the new organization.
    const portalClientPayload = {
      user_id: userId,
      odoo_partner_id: org.odoo_partner_id,
      odoo_agency_id: org.odoo_agency_id,
      client_type: org.client_type,
      nom_societe: org.name,
      nom_bailleur: org.name,
      email_bailleur: invitation.email,
      odoo_template_prefix: org.odoo_template_prefix,
      organization_id: org.id,
      logo_url: org.logo_url,
      product_config: org.product_config,
      first_name: firstName,
      last_name: lastName,
      deleted_at: null,
      deleted_by: null,
      blocked_at: null,
      blocked_by: null,
    };

    const { error: clientError } = await admin
      .from("portal_clients")
      .upsert(portalClientPayload, { onConflict: "user_id" })
      .select("id")
      .single();

    if (clientError) {
      return NextResponse.json(
        {
          error:
            clientError.message ||
            "Erreur lors de la creation du profil client.",
        },
        { status: 500 }
      );
    }

    // 5. Mark invitation as used
    const { error: markError } = await admin
      .from("invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (markError) {
      console.error(
        "[setup-account] failed to mark invitation as used:",
        markError
      );
    }

    // 6. Sign the user in
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError) {
      console.error("[setup-account] auto sign-in failed:", signInError);
      return NextResponse.json(
        {
          ok: true,
          warning:
            "Compte cree, mais la connexion automatique a echoue. Connectez-vous manuellement.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/setup-account error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
