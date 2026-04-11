import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "n.rommiee@axis-experts.be";
const INVITE_TTL_DAYS = 7;

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode(): string {
  // URL-safe, unambiguous alphabet — 24 chars is plenty of entropy.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    // ── Auth: only the designated admin may send invitations ──
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const odooPartnerIdRaw = body.odoo_partner_id;
    const odooAgencyIdRaw = body.odoo_agency_id;
    const nomSociete =
      typeof body.nom_societe === "string" ? body.nom_societe.trim() : "";
    const clientTypeRaw =
      typeof body.client_type === "string" ? body.client_type : "agency";
    const clientType = clientTypeRaw === "social" ? "social" : "agency";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const odooPartnerId = Number(odooPartnerIdRaw);
    if (!Number.isFinite(odooPartnerId) || odooPartnerId <= 0) {
      return NextResponse.json(
        { error: "Odoo Partner ID requis" },
        { status: 400 }
      );
    }

    const odooAgencyId =
      odooAgencyIdRaw === null ||
      odooAgencyIdRaw === undefined ||
      odooAgencyIdRaw === ""
        ? null
        : Number(odooAgencyIdRaw);
    if (odooAgencyId !== null && !Number.isFinite(odooAgencyId)) {
      return NextResponse.json(
        { error: "Odoo Agency ID invalide" },
        { status: 400 }
      );
    }

    // ── Insert invitation ──
    const admin = createAdminClient();
    const code = generateCode();
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: inserted, error: insertError } = await admin
      .from("invitations")
      .insert({
        code,
        email,
        odoo_partner_id: odooPartnerId,
        odoo_agency_id: odooAgencyId,
        client_type: clientType,
        nom_societe: nomSociete || null,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("[admin/invite] insert failed:", insertError);
      return NextResponse.json(
        { error: insertError?.message || "Erreur lors de la création de l'invitation." },
        { status: 500 }
      );
    }

    // ── Send invitation email via Resend ──
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(request.url).origin;
    const inviteUrl = `${origin}/inscription?code=${encodeURIComponent(code)}`;

    const textBody = `Bonjour,

Vous êtes invité(e) à rejoindre le portail Axis Experts.
Créez votre compte en cliquant sur ce lien :
${inviteUrl}

Ce lien est valable 7 jours.`;

    const htmlBody = `<p>Bonjour,</p>
<p>Vous êtes invité(e) à rejoindre le portail Axis Experts.<br />
Créez votre compte en cliquant sur ce lien :</p>
<p><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
<p>Ce lien est valable 7 jours.</p>`;

    try {
      await resend.emails.send({
        from: "Axis Experts <noreply@axis-experts.be>",
        to: email,
        subject: "Votre invitation au portail Axis Experts",
        text: textBody,
        html: htmlBody,
      });
    } catch (emailErr) {
      console.error("[admin/invite] email send failed:", emailErr);
      return NextResponse.json(
        {
          error:
            "Invitation enregistrée mais l'envoi de l'email a échoué. Le lien peut être copié manuellement.",
          invite_url: inviteUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/invite error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
