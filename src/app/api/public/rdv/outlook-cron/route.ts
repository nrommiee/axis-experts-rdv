import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooExecute } from "@/lib/odoo";
import { parseRdvDate } from "@/lib/parseRdvDate";
import {
  createEvent,
  updateEvent,
  getEvent,
  type GraphEventInput,
} from "@/lib/outlook/graph";
import {
  SUIVI_RDV_PROPOSE,
  SUIVI_RDV_CONFIRME,
} from "@/lib/public-rdv/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron OUTLOOK dédié (isolé du portail et des autres crons publics) : reflète
// chaque RDV public dans l'agenda Outlook de l'expert via Microsoft Graph.
// Part de public_rdv_requests (devis publics confirmés) + read Odoo (statut/date/
// expert). Sécurisé Bearer CRON_SECRET + bypass preview ?test=1 / dry=1.
//
// Statuts :
//   "Demande reçue" -> POST "⚠️ RDV à planifier" (prochain jour ouvré 09:00-10:00)
//   "RDV proposé"   -> PATCH au vrai créneau (durée 1h si pas d'heure de fin)
//   "RDV confirmé"  -> PATCH titre "✓ RDV confirmé"
// Anti-boucle: last_synced_status + last_event_start. Idempotence: UNIQUE order.
// GET avant PATCH : 404 -> sync_state 'manually_deleted' (ne plus recréer).

const SUIVI_DEMANDE_RECUE = "Demande reçue";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00`;
}

// Prochain jour ouvré (lun-ven) à 09:00, +1h. Créneau repère "Demande reçue".
function nextBusinessSlot(now: Date = new Date()): { start: string; end: string } {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: fmtLocal(start), end: fmtLocal(end) };
}

// Créneau réel depuis x_studio_date_prochain_rendez_vous_1 (CHAR, parseRdvDate).
// date "DD/MM/YYYY" + heure "HH:MM" optionnelle ; durée 1h par défaut.
function slotFromRdv(raw: string): { start: string; end: string } | null {
  const { date, time } = parseRdvDate(raw);
  if (!date) return null;
  const [dd, mm, yyyy] = date.split("/").map(Number);
  const [hh, mn] = (time ?? "09:00").split(":").map(Number);
  const start = new Date(yyyy, mm - 1, dd, hh || 9, mn || 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: fmtLocal(start), end: fmtLocal(end) };
}

interface OrderRow {
  id: number;
  name: string | false;
  x_studio_suivi_expert: string | false;
  x_studio_date_prochain_rendez_vous_1: string | false;
  x_studio_expert_externe_: [number, string] | false;
  x_studio_adresse_de_mission: [number, string] | false;
  x_studio_partie_1_bailleurs_: [number, string] | false;
  x_studio_partie_2_locataires_: [number, string] | false;
}

interface SyncRow {
  odoo_order_id: number;
  graph_event_id: string | null;
  last_synced_status: string | null;
  last_event_start: string | null;
  sync_state: string;
}

function ensureInt(v: unknown): number | null {
  if (Array.isArray(v)) return Number(v[0]);
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

export async function GET(request: NextRequest) {
  // ── Auth (double verrou identique aux crons publics) ──
  const isProd = process.env.VERCEL_ENV === "production";
  const isPreviewTest =
    !isProd && request.nextUrl.searchParams.get("test") === "1";
  if (!isPreviewTest) {
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = process.env.CRON_SECRET;
    if (
      !expected ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.slice(7) !== expected
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const dryRun =
    isPreviewTest && request.nextUrl.searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const testExpert = process.env.OUTLOOK_TEST_EXPERT_EMAIL?.trim() || null;

  const result = {
    ok: true,
    env: process.env.VERCEL_ENV ?? "unknown",
    dryRun,
    scanned: 0,
    created: 0,
    updated: 0,
    wouldCreate: 0,
    wouldUpdate: 0,
    skippedNoChange: 0,
    skippedDeleted: 0,
    skippedNoExpert: 0,
    errors: 0,
  };

  try {
    // 1. Devis publics confirmés.
    const { data: reqRows, error: reqErr } = await admin
      .from("public_rdv_requests")
      .select("odoo_order_id")
      .eq("status", "confirmed")
      .not("odoo_order_id", "is", null);
    if (reqErr) {
      console.error("[outlook-cron] supabase read failed:", reqErr);
      return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
    result.scanned = (reqRows ?? []).length;
    if (!reqRows || reqRows.length === 0) return NextResponse.json(result);

    const orderIds = reqRows.map((r) => Number(r.odoo_order_id));

    // 2. Lecture Odoo des commandes.
    const orders = (await odooExecute("sale.order", "read", [orderIds], {
      fields: [
        "id",
        "name",
        "x_studio_suivi_expert",
        "x_studio_date_prochain_rendez_vous_1",
        "x_studio_expert_externe_",
        "x_studio_adresse_de_mission",
        "x_studio_partie_1_bailleurs_",
        "x_studio_partie_2_locataires_",
      ],
    })) as unknown as OrderRow[];

    // 3. État de synchro existant (par devis).
    const { data: syncRows } = await admin
      .from("outlook_calendar_sync")
      .select(
        "odoo_order_id, graph_event_id, last_synced_status, last_event_start, sync_state"
      )
      .in("odoo_order_id", orderIds);
    const syncByOrder = new Map<number, SyncRow>();
    for (const s of (syncRows ?? []) as SyncRow[]) {
      syncByOrder.set(Number(s.odoo_order_id), s);
    }

    for (const order of orders ?? []) {
      const status = str(order.x_studio_suivi_expert);
      // On ne synchronise que les 3 statuts du cycle de vie public.
      if (
        status !== SUIVI_DEMANDE_RECUE &&
        status !== SUIVI_RDV_PROPOSE &&
        status !== SUIVI_RDV_CONFIRME
      ) {
        continue;
      }

      const sync = syncByOrder.get(order.id) ?? null;

      // Verrou : événement supprimé manuellement -> ne plus jamais recréer.
      if (sync?.sync_state === "manually_deleted") {
        result.skippedDeleted += 1;
        continue;
      }

      // Résolution email expert (fallback test -> mon agenda).
      let expertEmail = testExpert;
      if (!expertEmail) {
        const partnerId = ensureInt(order.x_studio_expert_externe_);
        if (partnerId) {
          const partners = (await odooExecute("res.partner", "read", [[partnerId]], {
            fields: ["id", "email"],
          })) as unknown as { id: number; email: string | false }[];
          expertEmail = str(partners?.[0]?.email) || null;
        }
      }
      if (!expertEmail) {
        result.skippedNoExpert += 1;
        continue;
      }

      // Créneau selon le statut.
      let slot: { start: string; end: string } | null = null;
      if (status === SUIVI_DEMANDE_RECUE) {
        slot = nextBusinessSlot();
      } else {
        slot = slotFromRdv(str(order.x_studio_date_prochain_rendez_vous_1));
        if (!slot) slot = nextBusinessSlot(); // date non encore exploitable
      }

      // Contenu de l'événement.
      const ref = str(order.name) || `Devis ${order.id}`;
      const adresse = Array.isArray(order.x_studio_adresse_de_mission)
        ? order.x_studio_adresse_de_mission[1] ?? ""
        : "";
      const bailleur = Array.isArray(order.x_studio_partie_1_bailleurs_)
        ? order.x_studio_partie_1_bailleurs_[1] ?? ""
        : "";
      const locataire = Array.isArray(order.x_studio_partie_2_locataires_)
        ? order.x_studio_partie_2_locataires_[1] ?? ""
        : "";

      let subject: string;
      if (status === SUIVI_DEMANDE_RECUE) subject = `⚠️ RDV à planifier — ${ref}`;
      else if (status === SUIVI_RDV_CONFIRME) subject = `✓ RDV confirmé — ${ref}`;
      else subject = `RDV — ${ref}`;
      if (adresse) subject += ` — ${adresse}`;

      const bodyHtml =
        `<b>Référence :</b> ${ref}<br>` +
        `<b>Statut :</b> ${status}<br>` +
        (adresse ? `<b>Adresse :</b> ${adresse}<br>` : "") +
        (bailleur ? `<b>Bailleur :</b> ${bailleur}<br>` : "") +
        (locataire ? `<b>Locataire :</b> ${locataire}<br>` : "");

      const ev: GraphEventInput = {
        subject,
        bodyHtml,
        start: slot.start,
        end: slot.end,
        location: adresse || undefined,
      };

      // Anti-MAJ inutile : même statut ET même créneau déjà reflétés.
      if (
        sync?.graph_event_id &&
        sync.last_synced_status === status &&
        sync.last_event_start === slot.start
      ) {
        result.skippedNoChange += 1;
        continue;
      }

      // ── Création vs mise à jour ──
      if (!sync?.graph_event_id) {
        // POST (création).
        if (dryRun) {
          result.wouldCreate += 1;
          continue;
        }
        const created = await createEvent(expertEmail, ev);
        if (!created.ok) {
          result.errors += 1;
          console.error("[outlook-cron] create failed", {
            orderId: order.id,
            status: created.status,
            error: created.error,
          });
          await admin.from("outlook_calendar_sync").upsert(
            {
              odoo_order_id: order.id,
              expert_email: expertEmail,
              calendar_owner: expertEmail,
              sync_state: created.status === 403 ? "error" : "active",
              last_error: created.error,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "odoo_order_id" }
          );
          continue;
        }
        await admin.from("outlook_calendar_sync").upsert(
          {
            odoo_order_id: order.id,
            graph_event_id: created.data.id,
            expert_email: expertEmail,
            calendar_owner: expertEmail,
            last_synced_status: status,
            last_event_start: slot.start,
            sync_state: "active",
            last_error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "odoo_order_id" }
        );
        result.created += 1;
      } else {
        // PATCH (mise à jour) — vérifier d'abord l'existence (404 = supprimé).
        if (dryRun) {
          result.wouldUpdate += 1;
          continue;
        }
        const exists = await getEvent(expertEmail, sync.graph_event_id);
        if (!exists.ok && exists.status === 404) {
          await admin
            .from("outlook_calendar_sync")
            .update({
              sync_state: "manually_deleted",
              updated_at: new Date().toISOString(),
            })
            .eq("odoo_order_id", order.id);
          result.skippedDeleted += 1;
          continue;
        }
        if (!exists.ok) {
          result.errors += 1;
          console.error("[outlook-cron] get failed", {
            orderId: order.id,
            status: exists.status,
            error: exists.error,
          });
          continue;
        }
        const upd = await updateEvent(expertEmail, sync.graph_event_id, ev);
        if (!upd.ok) {
          result.errors += 1;
          console.error("[outlook-cron] update failed", {
            orderId: order.id,
            status: upd.status,
            error: upd.error,
          });
          continue;
        }
        await admin
          .from("outlook_calendar_sync")
          .update({
            last_synced_status: status,
            last_event_start: slot.start,
            sync_state: "active",
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("odoo_order_id", order.id);
        result.updated += 1;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/public/rdv/outlook-cron error:", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
