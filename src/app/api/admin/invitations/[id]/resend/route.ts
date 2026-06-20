import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit/log-action";
import { buildInvitationEmail } from "@/lib/email-templates/invitation";

export const dynamic = "force-dynamic";

const INVITE_TTL_DAYS = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth: only admins may resend invitations ──
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rl = await checkRateLimit({
      userId: user.id,
      endpoint: "admin-invite",
      limit: 20,
      windowMinutes: 60,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes, réessayez plus tard" },
        { status: 429 }
      );
    }

    const admin = createAdminClient();

    // ── Load invitation (+ org for the email) ──
    const { data: invitation, error: fetchError } = await admin
      .from("invitations")
      .select(
        "id, email, organization_id, used_at, organizations:organization_id(name)"
      )
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
        { error: "Impossible de réinviter une invitation déjà acceptée" },
        { status: 409 }
      );
    }

    const orgRel = invitation.organizations as
      | { name: string }
      | { name: string }[]
      | null;
    const orgName = Array.isArray(orgRel)
      ? (orgRel[0]?.name ?? "")
      : (orgRel?.name ?? "");

    // ── Regenerate on the same row ──
    // The DB default for `token` only fires on INSERT, so we generate a fresh
    // UUID here. Rotating the token automatically invalidates the old link.
    const newToken = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: updated, error: updateError } = await admin
      .from("invitations")
      .update({
        token: newToken,
        expires_at: expiresAt,
        used_at: null,
      })
      .eq("id", id)
      .select("token")
      .single();

    if (updateError || !updated) {
      console.error(
        "[admin/invitations/[id]/resend] update failed:",
        updateError
      );
      return NextResponse.json(
        {
          error:
            updateError?.message ||
            "Erreur lors de la régénération de l'invitation.",
        },
        { status: 500 }
      );
    }

    await logAction({
      userId: user.id,
      organizationId: invitation.organization_id,
      action: "user.reinvite",
      resourceType: "invitation",
      resourceId: id,
      metadata: {
        email: invitation.email,
        organization_name: orgName,
      },
    });

    // ── Send invitation email via Resend ──
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      new URL(request.url).origin;
    const inviteUrl = `${origin}/setup-account?token=${encodeURIComponent(
      updated.token
    )}`;

    const { subject, text: textBody, html: htmlBody } = buildInvitationEmail({
      inviteUrl,
      orgName,
      ttlDays: INVITE_TTL_DAYS,
    });

    const emailResult = await sendEmail({
      to: invitation.email,
      subject,
      text: textBody,
      html: htmlBody,
    });
    if (!emailResult.success) {
      return NextResponse.json(
        {
          error:
            "Invitation régénérée mais l'envoi de l'email a echoue. Le lien peut etre copie manuellement.",
          invite_url: inviteUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, invitation_id: id });
  } catch (err) {
    console.error("POST /api/admin/invitations/[id]/resend error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
