import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooExecute } from "@/lib/odoo";
import { sendEmail } from "@/lib/email";
import { parseRdvDate } from "@/lib/parseRdvDate";
import {
  buildPartyValidationEmail,
  buildPartyInfoEmail,
} from "@/lib/email-templates/public-rdv-validation";
import {
  buildRdvConfirmedEmail,
  buildRdvConfirmedInternalEmail,
} from "@/lib/email-templates/public-rdv-confirmed";
import {
  PARTY_FIELDS,
  PARTY_LABEL,
  SUIVI_RDV_PROPOSE,
  SUIVI_RDV_CONFIRME,
  effectiveRole,
  type Party,
} from "@/lib/public-rdv/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const INTERNAL_EMAIL = "info@axis-experts.be";

// Guetteur PUBLIC dédié (isolé du cron du portail). Deux passes sur les devis
// publics (issus de public_rdv_requests) :
//   Passe A (2a) : "RDV proposé" ET proposition_envoye=false -> envoi des liens
//     de validation aux parties + proposition_envoye=true (anti-renvoi).
//   Passe B (2b) : "RDV proposé" -> si toutes les parties REQUISES ont coché leur
//     case Odoo -> bascule "RDV confirmé" + notif parties (+ 1 email info@).
// Verrou anti-boucle = le statut lui-même ("RDV confirmé" sort du périmètre).
// Sécurisé Bearer CRON_SECRET + bypass preview ?test=1 / dry=1.

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

interface OrderRow {
  id: number;
  x_studio_suivi_expert: string | false;
  x_studio_proposition_envoye: boolean;
  x_studio_date_prochain_rendez_vous_1: string | false;
  x_studio_partie_1_bailleurs_: [number, string] | false;
  x_studio_partie_2_locataires_: [number, string] | false;
  x_studio_partie_1_bailleurs_confirm: boolean;
  x_studio_partie_2_locataires_confirm: boolean;
  x_studio_adresse_de_mission: [number, string] | false;
}

interface PartnerRow {
  id: number;
  name: string | false;
  email: string | false;
  x_studio_rle_notification_rdv: string | false;
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
  // dry-run (preview-test only) : aucune écriture (ni Odoo, ni table, ni email).
  const dryRun =
    isPreviewTest && request.nextUrl.searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;

  const result = {
    ok: true,
    env: process.env.VERCEL_ENV ?? "unknown",
    dryRun,
    scanned: 0,
    ordersEligible: 0,
    sentValidations: 0,
    sentInfos: 0,
    skippedNoEmail: 0,
    ordersFlagged: 0,
    // Passe B (2b)
    confirmed: 0,
    wouldConfirm: 0,
    waiting: 0,
    confirmNotified: 0,
    internalNotified: 0,
    emailFailures: 0,
  };

  try {
    // 1. Commandes PUBLIQUES confirmées (source de vérité côté public).
    const { data: reqRows, error: reqErr } = await admin
      .from("public_rdv_requests")
      .select("odoo_order_id")
      .eq("status", "confirmed")
      .not("odoo_order_id", "is", null);
    if (reqErr) {
      console.error("[public-rdv][valid-cron] supabase read failed:", reqErr);
      return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }
    result.scanned = (reqRows ?? []).length;
    if (!reqRows || reqRows.length === 0) return NextResponse.json(result);

    const orderIds = reqRows.map((r) => Number(r.odoo_order_id));

    // 2. Lecture Odoo des commandes (un seul read).
    const orders = (await odooExecute("sale.order", "read", [orderIds], {
      fields: [
        "id",
        "x_studio_suivi_expert",
        "x_studio_proposition_envoye",
        "x_studio_date_prochain_rendez_vous_1",
        "x_studio_partie_1_bailleurs_",
        "x_studio_partie_2_locataires_",
        "x_studio_partie_1_bailleurs_confirm",
        "x_studio_partie_2_locataires_confirm",
        "x_studio_adresse_de_mission",
      ],
    })) as unknown as OrderRow[];

    // Devis "RDV proposé" avec une date posée (base des 2 passes).
    const proposed = (orders ?? []).filter(
      (o) =>
        parseRdvDate(o.x_studio_date_prochain_rendez_vous_1).date !== null &&
        str(o.x_studio_suivi_expert) === SUIVI_RDV_PROPOSE
    );

    // ════════════════════════════════════════════════════════════
    // PASSE A (2a) — envoi des liens : "RDV proposé" ET pas déjà envoyé.
    // ════════════════════════════════════════════════════════════
    const eligible = proposed.filter(
      (o) => o.x_studio_proposition_envoye !== true
    );
    result.ordersEligible = eligible.length;

    for (const order of eligible) {
      const parsed = parseRdvDate(order.x_studio_date_prochain_rendez_vous_1);
      const dateLabel =
        parsed.date && parsed.time
          ? `${parsed.date} à ${parsed.time}`
          : parsed.date ?? "";
      const rdvDateString = str(order.x_studio_date_prochain_rendez_vous_1);
      const adresse = Array.isArray(order.x_studio_adresse_de_mission)
        ? order.x_studio_adresse_de_mission[1] ?? ""
        : "";

      // Contacts des parties présentes sur la commande.
      const partyPartnerIds: { party: Party; partnerId: number }[] = [];
      for (const party of ["p1", "p2"] as Party[]) {
        const link = order[PARTY_FIELDS[party].link as keyof OrderRow];
        if (Array.isArray(link) && typeof link[0] === "number") {
          partyPartnerIds.push({ party, partnerId: link[0] });
        }
      }
      if (partyPartnerIds.length === 0) continue;

      // Lire les res.partner (email + rôle) en une fois.
      const partners = (await odooExecute(
        "res.partner",
        "read",
        [partyPartnerIds.map((p) => p.partnerId)],
        { fields: ["id", "name", "email", "x_studio_rle_notification_rdv"] }
      )) as unknown as PartnerRow[];
      const partnerById = new Map<number, PartnerRow>();
      for (const p of partners ?? []) partnerById.set(p.id, p);

      let anyAction = false;

      for (const { party, partnerId } of partyPartnerIds) {
        const partner = partnerById.get(partnerId);
        if (!partner) continue;
        const role = effectiveRole(partner.x_studio_rle_notification_rdv);
        if (role === "rien") continue;

        const email = str(partner.email);
        const nom = str(partner.name);
        const partyLabel = PARTY_LABEL[party];

        if (!email) {
          // Pas d'email -> rien à envoyer (la case sera cochée manuellement).
          result.skippedNoEmail += 1;
          continue;
        }

        if (role === "informe") {
          anyAction = true;
          if (!dryRun) {
            const { subject, html } = buildPartyInfoEmail({
              nom,
              partyLabel,
              dateLabel,
              adresse,
            });
            const r = await sendEmail({ to: email, subject, html });
            if (r.success) result.sentInfos += 1;
            else {
              result.emailFailures += 1;
              console.error("[public-rdv][valid-cron] info email failed", {
                orderId: order.id,
                party,
                error: r.error,
              });
            }
          } else {
            result.sentInfos += 1;
          }
          continue;
        }

        // role === "valide" : créer le token (upsert) + email avec lien.
        anyAction = true;
        if (dryRun) {
          result.sentValidations += 1;
          continue;
        }

        // Upsert idempotent sur (order, party) ; on relit le token résultant.
        const { data: row, error: upErr } = await admin
          .from("public_rdv_party_validations")
          .upsert(
            {
              odoo_order_id: order.id,
              party,
              role: "Doit valider",
              status: "pending",
              rdv_date_string: rdvDateString,
              email,
            },
            { onConflict: "odoo_order_id,party" }
          )
          .select("token")
          .single();

        if (upErr || !row) {
          result.emailFailures += 1;
          console.error("[public-rdv][valid-cron] upsert token failed", {
            orderId: order.id,
            party,
            error: upErr?.message,
          });
          continue;
        }

        const validateUrl = `${baseUrl}/confirmer/partie/${row.token}`;
        const { subject, html } = buildPartyValidationEmail({
          validateUrl,
          nom,
          partyLabel,
          dateLabel,
          adresse,
        });
        const r = await sendEmail({ to: email, subject, html });
        if (r.success) result.sentValidations += 1;
        else {
          result.emailFailures += 1;
          console.error("[public-rdv][valid-cron] validation email failed", {
            orderId: order.id,
            party,
            error: r.error,
          });
        }
      }

      // Anti-renvoi : poser proposition_envoye=true (sauf dry-run). Décision B :
      // on marque même si un envoi a échoué (anti-spam ; rattrapage manuel).
      if (!dryRun && anyAction) {
        try {
          await odooExecute("sale.order", "write", [
            [order.id],
            { x_studio_proposition_envoye: true },
          ]);
          result.ordersFlagged += 1;
        } catch (e) {
          console.error("[public-rdv][valid-cron] set proposition_envoye failed", {
            orderId: order.id,
            error: e,
          });
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    // PASSE B (2b) — bascule "RDV confirmé" quand toutes les parties REQUISES
    // ont coché leur case Odoo (source de vérité). Verrou = statut (un devis
    // "RDV confirmé" quitte le périmètre -> une seule bascule/notif).
    // ════════════════════════════════════════════════════════════
    for (const order of proposed) {
      // Parties présentes (lien non vide).
      const present: { party: Party; partnerId: number; confirm: boolean }[] = [];
      for (const party of ["p1", "p2"] as Party[]) {
        const link = order[PARTY_FIELDS[party].link as keyof OrderRow];
        if (Array.isArray(link) && typeof link[0] === "number") {
          present.push({
            party,
            partnerId: link[0],
            confirm: order[PARTY_FIELDS[party].confirm as keyof OrderRow] === true,
          });
        }
      }

      // Rôles des parties présentes (lecture res.partner).
      let presentPartners: PartnerRow[] = [];
      if (present.length > 0) {
        presentPartners = (await odooExecute(
          "res.partner",
          "read",
          [present.map((p) => p.partnerId)],
          { fields: ["id", "name", "email", "x_studio_rle_notification_rdv"] }
        )) as unknown as PartnerRow[];
      }
      const pById = new Map<number, PartnerRow>();
      for (const p of presentPartners) pById.set(p.id, p);

      // Parties REQUISES = présentes dont le rôle effectif est "valide"
      // (rôle "Doit valider" OU vide). "Informé seulement"/"Ne plus notifier"
      // ne sont pas requises. (Cas "aucune requise" -> bascule directe : ne se
      // produit que si AUCUNE partie présente n'a le rôle "valide".)
      const required = present.filter((p) => {
        const role = effectiveRole(
          pById.get(p.partnerId)?.x_studio_rle_notification_rdv
        );
        return role === "valide";
      });

      const allConfirmed = required.every((p) => p.confirm);
      if (!allConfirmed) {
        result.waiting += 1;
        continue;
      }

      // -> bascule.
      if (dryRun) {
        result.wouldConfirm += 1;
        continue;
      }

      const parsed = parseRdvDate(order.x_studio_date_prochain_rendez_vous_1);
      const dateLabel =
        parsed.date && parsed.time
          ? `${parsed.date} à ${parsed.time}`
          : parsed.date ?? "";
      const adresse = Array.isArray(order.x_studio_adresse_de_mission)
        ? order.x_studio_adresse_de_mission[1] ?? ""
        : "";

      // 1) Bascule du statut AVANT notif (le statut est le verrou anti-boucle).
      try {
        await odooExecute("sale.order", "write", [
          [order.id],
          { x_studio_suivi_expert: SUIVI_RDV_CONFIRME },
        ]);
        result.confirmed += 1;
      } catch (e) {
        console.error("[public-rdv][valid-cron] set RDV confirmé failed", {
          orderId: order.id,
          error: e,
        });
        continue; // pas de notif si la bascule a échoué
      }

      // 2) Notif aux PARTIES avec email, sauf "Ne plus notifier".
      for (const p of present) {
        const partner = pById.get(p.partnerId);
        if (!partner) continue;
        const role = effectiveRole(partner.x_studio_rle_notification_rdv);
        if (role === "rien") continue;
        const email = str(partner.email);
        if (!email) continue;
        const { subject, html } = buildRdvConfirmedEmail({
          nom: str(partner.name),
          partyLabel: PARTY_LABEL[p.party],
          dateLabel,
          adresse,
        });
        const r = await sendEmail({ to: email, subject, html });
        if (r.success) result.confirmNotified += 1;
        else {
          result.emailFailures += 1;
          console.error("[public-rdv][valid-cron] confirmed email failed", {
            orderId: order.id,
            party: p.party,
            error: r.error,
          });
        }
      }

      // 3) UN SEUL email interne info@ par RDV confirmé (hors boucle parties).
      const internal = buildRdvConfirmedInternalEmail({
        orderId: order.id,
        dateLabel,
        adresse,
      });
      const ri = await sendEmail({
        to: INTERNAL_EMAIL,
        subject: internal.subject,
        html: internal.html,
      });
      if (ri.success) result.internalNotified += 1;
      else {
        result.emailFailures += 1;
        console.error("[public-rdv][valid-cron] internal email failed", {
          orderId: order.id,
          error: ri.error,
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/public/rdv/validation-cron error:", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
