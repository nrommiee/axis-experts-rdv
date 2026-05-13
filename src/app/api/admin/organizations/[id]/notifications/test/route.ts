import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  isValidEmail,
  normalizeAndValidateEmails,
  resolveNotificationRecipients,
  type NotificationOrganization,
  type NotificationRecipientsMode,
} from "@/lib/notification-recipients";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MODE_LABELS: Record<NotificationRecipientsMode, string> = {
  creator_only: "Créateur uniquement",
  all_org_users: "Tous les utilisateurs de l'organisation",
  custom_list: "Liste personnalisée",
};

function buildTestEmail(
  orgName: string,
  mode: NotificationRecipientsMode,
  adminEmail: string
): { subject: string; html: string } {
  const subject = `[Axis Experts] Email de test notifications — ${orgName}`;
  const now = new Date();
  const timestampFr = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  }).format(now);

  const html = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #F5B800; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">Email de test — Notifications RDV</h1>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Bonjour,</p>
    <p>Ceci est un email de test des notifications du portail Axis Experts.</p>
    <p>Si vous le recevez, les notifications sont correctement configurées pour <strong>${escapeHtml(orgName)}</strong>.</p>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="color: #737373; padding: 6px 0;">Mode</td><td style="font-weight: 600; color: #333;">${escapeHtml(MODE_LABELS[mode])}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Envoyé par</td><td style="font-weight: 600; color: #333;">${escapeHtml(adminEmail)}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Date du test</td><td style="font-weight: 600; color: #333;">${escapeHtml(timestampFr)}</td></tr>
    </table>
    <p style="color: #737373; font-size: 14px;">Aucune action n'est requise de votre part.</p>
    <p style="color: #737373; font-size: 13px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
      <strong>Axis Experts</strong> — Cabinet d'expertise immobilière
    </p>
  </div>
</div>`;

  return { subject, html };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const overrideRaw = body?.override_recipients;

    const admin = createAdminClient();

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select(
        "id, name, notification_recipients_mode, notification_custom_emails"
      )
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    let recipients: string[] = [];

    if (Array.isArray(overrideRaw) && overrideRaw.length > 0) {
      const candidates: string[] = [];
      for (const raw of overrideRaw) {
        if (typeof raw !== "string") continue;
        const normalized = raw.trim().toLowerCase();
        if (!normalized) continue;
        if (!isValidEmail(normalized)) {
          return NextResponse.json(
            { error: `Email invalide : ${raw}` },
            { status: 400 }
          );
        }
        candidates.push(normalized);
      }
      recipients = normalizeAndValidateEmails(candidates);
    } else {
      const orgForResolver: NotificationOrganization = {
        id: org.id,
        notification_recipients_mode:
          (org.notification_recipients_mode as NotificationRecipientsMode) ??
          "all_org_users",
        notification_custom_emails: org.notification_custom_emails,
      };
      recipients = await resolveNotificationRecipients(admin, orgForResolver);
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "Aucun destinataire valide trouvé" },
        { status: 400 }
      );
    }

    const mode =
      (org.notification_recipients_mode as NotificationRecipientsMode) ??
      "all_org_users";
    const { subject, html } = buildTestEmail(
      org.name || "—",
      mode,
      user.email ?? "—"
    );

    const results: { email: string; status: "sent" | "failed"; error?: string }[] = [];
    for (const email of recipients) {
      const r = await sendEmail({
        to: email,
        subject,
        html,
        tags: [
          { name: "type", value: "rdv_notification_test" },
          { name: "organization_id", value: org.id },
        ],
      });
      if (r.success) {
        results.push({ email, status: "sent" });
      } else {
        results.push({ email, status: "failed", error: r.error });
      }
      await sleep(200);
    }

    console.log(
      `[admin] org ${id} test notification sent by ${user.email}`,
      {
        recipients_count: recipients.length,
        success: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
      }
    );

    return NextResponse.json({
      success: true,
      recipients_count: recipients.length,
      results,
    });
  } catch (err) {
    console.error(
      "POST /api/admin/organizations/[id]/notifications/test error:",
      err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
