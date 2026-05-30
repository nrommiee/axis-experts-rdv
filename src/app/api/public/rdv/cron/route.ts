import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { buildPublicRdvReminderEmail } from "@/lib/email-templates/public-rdv-reminder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron PUBLIC dédié (isolé du cron du portail) : relances + expiration des
// demandes publiques non confirmées. Sécurisé par Bearer CRON_SECRET (comme les
// crons du repo). Paliers : 24h -> 1er rappel ; 48h -> dernier rappel ;
// 72h/expires_at -> expired. Updates conditionnels AVANT envoi (anti double),
// expiration en dernier, idempotent.

interface PendingRow {
  id: string;
  email: string | null;
  token: string;
  form_data: Record<string, unknown> | null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function adresseFrom(form: Record<string, unknown> | null): string {
  const addr = ((form ?? {}).address ?? {}) as Record<string, unknown>;
  return [
    [str(addr.rue), str(addr.num)].filter(Boolean).join(" "),
    [str(addr.cp), str(addr.ville)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: NextRequest) {
  // ── Auth (identique au cron du repo) ──
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (
    !expected ||
    !authHeader.startsWith("Bearer ") ||
    authHeader.slice(7) !== expected
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const h24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const h48 = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const result = {
    ok: true,
    reminded1: 0,
    reminded2: 0,
    expired: 0,
    emailFailures: 0,
  };

  // Envoie un rappel pour une ligne dont le palier a été "gagné" (update OK).
  async function sendReminder(row: PendingRow, stage: 1 | 2) {
    if (!row.email) return; // pas d'email -> rien à envoyer (compteur déjà posé)
    const { subject, html } = buildPublicRdvReminderEmail({
      confirmUrl: `${baseUrl}/confirmer/${row.token}`,
      stage,
      nom: str((row.form_data ?? {}).nom),
      mission: str((row.form_data ?? {}).mission),
      adresse: adresseFrom(row.form_data),
    });
    const r = await sendEmail({ to: row.email, subject, html });
    if (!r.success) {
      // Compteur NON rollback (anti-boucle de renvoi) : on loggue seulement.
      result.emailFailures += 1;
      console.error("[public-rdv][cron] reminder email failed", {
        requestId: row.id,
        stage,
        error: r.error,
      });
    }
  }

  try {
    // ── Palier 1 : 1er rappel (>=24h, reminders_sent=0, non expiré) ──
    const { data: cand1 } = await admin
      .from("public_rdv_requests")
      .select("id, email, token, form_data")
      .eq("status", "pending")
      .eq("reminders_sent", 0)
      .lte("created_at", h24)
      .gt("expires_at", nowIso);

    for (const row of (cand1 ?? []) as PendingRow[]) {
      // Update conditionnel AVANT envoi : seul le run qui obtient la ligne envoie.
      const { data: won } = await admin
        .from("public_rdv_requests")
        .update({ reminders_sent: 1 })
        .eq("id", row.id)
        .eq("status", "pending")
        .eq("reminders_sent", 0)
        .select("id")
        .maybeSingle();
      if (won) {
        result.reminded1 += 1;
        await sendReminder(row, 1);
      }
    }

    // ── Palier 2 : dernier rappel (>=48h, reminders_sent=1, non expiré) ──
    const { data: cand2 } = await admin
      .from("public_rdv_requests")
      .select("id, email, token, form_data")
      .eq("status", "pending")
      .eq("reminders_sent", 1)
      .lte("created_at", h48)
      .gt("expires_at", nowIso);

    for (const row of (cand2 ?? []) as PendingRow[]) {
      const { data: won } = await admin
        .from("public_rdv_requests")
        .update({ reminders_sent: 2 })
        .eq("id", row.id)
        .eq("status", "pending")
        .eq("reminders_sent", 1)
        .select("id")
        .maybeSingle();
      if (won) {
        result.reminded2 += 1;
        await sendReminder(row, 2);
      }
    }

    // ── Palier 3 : expiration (>=72h / expires_at dépassé) — EN DERNIER ──
    // Update conditionnel groupé, aucun email.
    const { data: expiredRows } = await admin
      .from("public_rdv_requests")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lte("expires_at", nowIso)
      .select("id");
    result.expired = (expiredRows ?? []).length;

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/public/rdv/cron error:", err);
    return NextResponse.json(
      { error: "Erreur interne." },
      { status: 500 }
    );
  }
}
