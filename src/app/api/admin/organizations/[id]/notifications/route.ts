import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  isValidEmail,
  type NotificationRecipientsMode,
} from "@/lib/notification-recipients";

export const dynamic = "force-dynamic";

const VALID_MODES: NotificationRecipientsMode[] = [
  "creator_only",
  "all_org_users",
  "custom_list",
];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
      user: null,
    };
  }
  if (!isAdmin(user.email)) {
    return {
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const admin = createAdminClient();

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select(
        "id, notifications_enabled, notification_recipients_mode, notification_custom_emails"
      )
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Fetch active portal_clients to derive emails for autocomplete
    const { data: clients } = await admin
      .from("portal_clients")
      .select("user_id")
      .eq("organization_id", id)
      .is("deleted_at", null)
      .is("blocked_at", null);

    const emailsSet = new Set<string>();
    for (const row of clients ?? []) {
      const userId = (row as { user_id: string | null }).user_id;
      if (!userId) continue;
      const { data: u } = await admin.auth.admin.getUserById(userId);
      const e = u?.user?.email?.trim().toLowerCase();
      if (e) emailsSet.add(e);
    }
    const org_users_emails = [...emailsSet].sort();

    const customEmailsRaw = Array.isArray(org.notification_custom_emails)
      ? (org.notification_custom_emails as unknown[])
      : [];
    const notification_custom_emails = customEmailsRaw.filter(
      (e): e is string => typeof e === "string"
    );

    return NextResponse.json({
      notifications_enabled: Boolean(org.notifications_enabled),
      notification_recipients_mode:
        (org.notification_recipients_mode as NotificationRecipientsMode) ??
        "all_org_users",
      notification_custom_emails,
      org_users_emails,
    });
  } catch (err) {
    console.error("GET /api/admin/organizations/[id]/notifications error:", err);
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
    const { error: authError, user } = await requireAdmin();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: current, error: currentErr } = await admin
      .from("organizations")
      .select(
        "id, notifications_enabled, notification_recipients_mode, notification_custom_emails"
      )
      .eq("id", id)
      .single();

    if (currentErr || !current) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.notifications_enabled === "boolean") {
      updates.notifications_enabled = body.notifications_enabled;
    }

    if (body.notification_recipients_mode !== undefined) {
      if (
        typeof body.notification_recipients_mode !== "string" ||
        !VALID_MODES.includes(
          body.notification_recipients_mode as NotificationRecipientsMode
        )
      ) {
        return NextResponse.json(
          { error: "Mode de destinataires invalide" },
          { status: 400 }
        );
      }
      updates.notification_recipients_mode = body.notification_recipients_mode;
    }

    let customEmails: string[] | undefined;
    if (body.notification_custom_emails !== undefined) {
      if (!Array.isArray(body.notification_custom_emails)) {
        return NextResponse.json(
          { error: "notification_custom_emails doit être un tableau" },
          { status: 400 }
        );
      }
      customEmails = [];
      const seen = new Set<string>();
      for (const raw of body.notification_custom_emails) {
        if (typeof raw !== "string") continue;
        const normalized = raw.trim().toLowerCase();
        if (!normalized) continue;
        if (!isValidEmail(normalized)) {
          return NextResponse.json(
            { error: `Email invalide : ${raw}` },
            { status: 400 }
          );
        }
        if (!seen.has(normalized)) {
          seen.add(normalized);
          customEmails.push(normalized);
        }
      }
      updates.notification_custom_emails = customEmails;
    }

    // Compute the effective post-update state for validation
    const effectiveEnabled =
      typeof updates.notifications_enabled === "boolean"
        ? (updates.notifications_enabled as boolean)
        : Boolean(current.notifications_enabled);
    const effectiveMode =
      (updates.notification_recipients_mode as
        | NotificationRecipientsMode
        | undefined) ??
      (current.notification_recipients_mode as NotificationRecipientsMode) ??
      "all_org_users";
    const effectiveCustomList =
      customEmails ??
      (Array.isArray(current.notification_custom_emails)
        ? (current.notification_custom_emails as unknown[]).filter(
            (e): e is string => typeof e === "string"
          )
        : []);

    if (
      effectiveEnabled &&
      effectiveMode === "custom_list" &&
      effectiveCustomList.length === 0
    ) {
      return NextResponse.json(
        { error: "Custom list requires at least one email" },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await admin
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select(
        "id, notifications_enabled, notification_recipients_mode, notification_custom_emails"
      )
      .single();

    if (updateError || !updated) {
      console.error(
        "[admin/organizations/[id]/notifications] update failed:",
        updateError
      );
      return NextResponse.json(
        { error: updateError?.message || "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    console.log(
      `[admin] org ${id} notifications updated by ${user?.email}`,
      {
        notifications_enabled: updated.notifications_enabled,
        mode: updated.notification_recipients_mode,
      }
    );

    const customEmailsOut = Array.isArray(updated.notification_custom_emails)
      ? (updated.notification_custom_emails as unknown[]).filter(
          (e): e is string => typeof e === "string"
        )
      : [];

    return NextResponse.json({
      notifications_enabled: Boolean(updated.notifications_enabled),
      notification_recipients_mode:
        updated.notification_recipients_mode as NotificationRecipientsMode,
      notification_custom_emails: customEmailsOut,
    });
  } catch (err) {
    console.error(
      "PATCH /api/admin/organizations/[id]/notifications error:",
      err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
