import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooExecute } from "@/lib/odoo";
import { parseRdvDate } from "@/lib/parseRdvDate";
import { sendEmail } from "@/lib/email";
import {
  buildRdvNotificationEmail,
  formatLocataire,
} from "@/lib/email-templates/rdv-notification";
import {
  resolveNotificationRecipients,
  type NotificationOrganization,
} from "@/lib/notification-recipients";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type OdooOrder = {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  x_studio_agence_partenaire: [number, string] | false;
  x_studio_date_prochain_rendez_vous_1: string | false;
  x_studio_adresse_de_mission: [number, string] | false;
  x_studio_partie_2_locataires_: [number, string] | false;
  x_studio_type_de_bien_1: string | false;
  tag_ids?: number[];
};

type RecipientLog = { email: string; status: "sent" | "failed"; error?: string };

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatOdooDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function buildDateObj(dateStr: string, time: string | null): Date | null {
  // dateStr is "DD/MM/YYYY"
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  let hh = 0;
  let mn = 0;
  if (time) {
    const tm = time.match(/^(\d{2}):(\d{2})$/);
    if (tm) {
      hh = parseInt(tm[1], 10);
      mn = parseInt(tm[2], 10);
    }
  }
  const d = new Date(
    parseInt(yyyy, 10),
    parseInt(mm, 10) - 1,
    parseInt(dd, 10),
    hh,
    mn,
    0,
    0
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTimeRange(raw: string): { start: string | null; end: string | null } {
  // Look for "(HH:MM[:SS]? à HH:MM[:SS]?)"
  const m = raw.match(/\((\d{2}):(\d{2})(?::\d{2})?\s*à\s*(\d{2}):(\d{2})(?::\d{2})?/);
  if (!m) return { start: null, end: null };
  return {
    start: `${m[1]}:${m[2]}`,
    end: `${m[3]}:${m[4]}`,
  };
}

type Organization = NotificationOrganization & {
  notifications_enabled: boolean;
};

export async function GET(request: Request) {
  const startedAt = Date.now();

  // ── Auth ──
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // ── Detect bootstrap mode ──
  const { count: existingCount, error: countError } = await supabaseAdmin
    .from("rdv_notifications_sent")
    .select("id", { count: "exact", head: true });
  if (countError) {
    console.error("[cron] count rdv_notifications_sent failed:", countError);
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  const isBootstrap = (existingCount ?? 0) === 0;
  console.log("[cron] bootstrap mode:", isBootstrap);

  // ── Compute window ──
  const now = new Date();
  const writeDateFromObj = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const writeDateFrom = formatOdooDate(writeDateFromObj);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // ── Fetch eligible orders from Odoo (single call) ──
  let orders: OdooOrder[] = [];
  try {
    const raw = await odooExecute(
      "sale.order",
      "search_read",
      [[
        ["x_studio_portail_client", "=", true],
        ["x_studio_date_prochain_rendez_vous_1", "!=", false],
        ["write_date", ">=", writeDateFrom],
        ["state", "not in", ["cancel", "done"]],
      ]],
      {
        fields: [
          "id",
          "name",
          "partner_id",
          "x_studio_agence_partenaire",
          "x_studio_date_prochain_rendez_vous_1",
          "x_studio_adresse_de_mission",
          "x_studio_partie_2_locataires_",
          "x_studio_type_de_bien_1",
          "tag_ids",
        ],
        limit: 500,
      }
    );
    orders = (raw as unknown as OdooOrder[]) ?? [];
  } catch (err) {
    console.error("[cron] Odoo search_read failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // ── Resolve ELE / ELS tag IDs once (to derive mission label) ──
  let eleTagId: number | null = null;
  let elsTagId: number | null = null;
  for (const tagModel of ["sale.order.tag", "crm.tag"]) {
    try {
      const tags = (await odooExecute(
        tagModel,
        "search_read",
        [[["name", "in", ["ELE", "ELS"]]]],
        { fields: ["id", "name"], limit: 2 }
      )) as { id: number; name: string }[];
      if (tags.length > 0) {
        for (const t of tags) {
          if (t.name === "ELE") eleTagId = t.id;
          if (t.name === "ELS") elsTagId = t.id;
        }
        break;
      }
    } catch {
      // try next model
    }
  }

  const counters = {
    scanned: 0,
    bootstrap_recorded: 0,
    sent: 0,
    skipped_same: 0,
    skipped_past: 0,
    skipped_disabled: 0,
    skipped_no_recipients: 0,
    errors: 0,
  };

  for (const order of orders) {
    counters.scanned++;

    const rdvRaw = order.x_studio_date_prochain_rendez_vous_1;
    if (typeof rdvRaw !== "string") {
      counters.skipped_past++;
      continue;
    }
    const rdvDateString = rdvRaw.trim();
    const parsed = parseRdvDate(rdvDateString);
    if (!parsed.date) {
      counters.skipped_past++;
      continue;
    }
    const dateObj = buildDateObj(parsed.date, parsed.time);
    if (!dateObj || dateObj < todayMidnight) {
      counters.skipped_past++;
      continue;
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("rdv_notifications_sent")
      .select("id, rdv_date_string")
      .eq("odoo_order_id", order.id)
      .maybeSingle();
    if (existingErr) {
      console.error(`[cron] lookup failed for order ${order.id}:`, existingErr);
      counters.errors++;
      continue;
    }

    if (isBootstrap) {
      const { error: insErr } = await supabaseAdmin
        .from("rdv_notifications_sent")
        .upsert(
          {
            odoo_order_id: order.id,
            rdv_date_string: rdvDateString,
            notification_type: "bootstrap",
            recipients: [],
            notified_at: new Date().toISOString(),
          },
          { onConflict: "odoo_order_id" }
        );
      if (insErr) {
        console.error(`[cron] bootstrap upsert failed for order ${order.id}:`, insErr);
        counters.errors++;
      } else {
        counters.bootstrap_recorded++;
      }
      await sleep(200);
      continue;
    }

    let notificationType: "initial" | "updated";
    if (!existing) {
      notificationType = "initial";
    } else if (existing.rdv_date_string === rdvDateString) {
      counters.skipped_same++;
      continue;
    } else {
      notificationType = "updated";
    }

    // ── Lookup organization ──
    const partnerId = Array.isArray(order.partner_id) ? order.partner_id[0] : null;
    const agencyId = Array.isArray(order.x_studio_agence_partenaire)
      ? order.x_studio_agence_partenaire[0]
      : null;

    const orFilters: string[] = [];
    if (partnerId !== null) orFilters.push(`odoo_partner_id.eq.${partnerId}`);
    if (agencyId !== null) orFilters.push(`odoo_agency_id.eq.${agencyId}`);

    if (orFilters.length === 0) {
      console.error(`[cron] order ${order.id} has no partner_id nor agency_id`);
      counters.errors++;
      continue;
    }

    const { data: orgRow, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select(
        "id, notifications_enabled, notification_recipients_mode, notification_custom_emails"
      )
      .or(orFilters.join(","))
      .limit(1)
      .maybeSingle();
    if (orgErr) {
      console.error(`[cron] org lookup failed for order ${order.id}:`, orgErr);
      counters.errors++;
      continue;
    }
    if (!orgRow) {
      console.error(`[cron] no organization for order ${order.id} (partner=${partnerId}, agency=${agencyId})`);
      counters.errors++;
      continue;
    }

    const org = orgRow as Organization;
    if (!org.notifications_enabled) {
      counters.skipped_disabled++;
      continue;
    }

    // ── Resolve recipients ──
    const recipients = await resolveNotificationRecipients(
      supabaseAdmin,
      org,
      order.id
    );
    if (recipients.length === 0) {
      counters.skipped_no_recipients++;
      continue;
    }

    // ── Build email ──
    const { start: timeStart, end: timeEnd } = parseTimeRange(rdvDateString);
    const adresseComplete = Array.isArray(order.x_studio_adresse_de_mission)
      ? order.x_studio_adresse_de_mission[1] ?? ""
      : "";
    const locataireNomComplet = formatLocataire(order.x_studio_partie_2_locataires_);

    let missionType: string | null = null;
    const tagIds = Array.isArray(order.tag_ids) ? order.tag_ids : [];
    if (eleTagId !== null && tagIds.includes(eleTagId)) missionType = "Entrée";
    else if (elsTagId !== null && tagIds.includes(elsTagId)) missionType = "Sortie";

    const { subject, html } = buildRdvNotificationEmail({
      orderName: order.name,
      dateObj,
      timeStart: timeStart ?? parsed.time,
      timeEnd,
      adresseComplete,
      locataireNomComplet,
      missionType,
      isUpdate: notificationType === "updated",
    });

    // ── Send to each recipient sequentially ──
    const recipientsLog: RecipientLog[] = [];
    for (const email of recipients) {
      const result = await sendEmail({
        to: email,
        subject,
        html,
        tags: [
          { name: "type", value: "rdv_notification" },
          { name: "notification_type", value: notificationType },
        ],
      });
      if (result.success) {
        recipientsLog.push({ email, status: "sent" });
        counters.sent++;
      } else {
        recipientsLog.push({ email, status: "failed", error: result.error });
        counters.errors++;
      }
      await sleep(200);
    }

    // ── Upsert notification record ──
    const { error: upsertErr } = await supabaseAdmin
      .from("rdv_notifications_sent")
      .upsert(
        {
          odoo_order_id: order.id,
          rdv_date_string: rdvDateString,
          notification_type: notificationType,
          recipients: recipientsLog,
          notified_at: new Date().toISOString(),
        },
        { onConflict: "odoo_order_id" }
      );
    if (upsertErr) {
      console.error(`[cron] upsert notification failed for order ${order.id}:`, upsertErr);
      counters.errors++;
    }

    await sleep(200);
  }

  const duration_ms = Date.now() - startedAt;
  const summary = {
    bootstrap: isBootstrap,
    ...counters,
    duration_ms,
  };
  console.log("[cron] summary:", summary);
  return NextResponse.json(summary);
}
