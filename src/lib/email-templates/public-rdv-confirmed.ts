// Template email "Votre rendez-vous est confirmé" (étape 2b).
// HTML inline, couleurs Axis (#F5B800), logo. Variante interne (info@) avec
// référence devis. Calqué sur les autres templates publics.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const LOGO_URL =
  "https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png";

function recapTable(rows: [string, string][]): string {
  const trs = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="color:#737373;padding:6px 0;">${escapeHtml(
          k
        )}</td><td style="font-weight:600;color:#333;">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  return trs
    ? `<table style="width:100%;margin:8px 0 4px;border-collapse:collapse;">${trs}</table>`
    : "";
}

function shell(inner: string): string {
  return `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color:#333;">
  <div style="background: #F5B800; padding: 20px 24px; border-radius: 12px 12px 0 0; text-align:center;">
    <img src="${LOGO_URL}" alt="Axis Experts" style="height:40px;width:auto;display:inline-block;" />
  </div>
  <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    ${inner}
    <p style="color:#737373;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #e5e5e5;line-height:1.5;">
      Pour toute modification, contactez-nous au <strong>02 880 90 90</strong> ou à <strong>info@axis-experts.be</strong>.<br><br>
      <strong>Axis Experts</strong> — Cabinet d'expertise immobilière
    </p>
  </div>
</div>`;
}

export type BuildRdvConfirmedEmailParams = {
  nom?: string;
  partyLabel?: string;
  dateLabel?: string;
  adresse?: string;
};

export type EmailResult = { subject: string; html: string };

// Email aux PARTIES : rendez-vous confirmé.
export function buildRdvConfirmedEmail(
  params: BuildRdvConfirmedEmailParams
): EmailResult {
  const { nom, partyLabel, dateLabel, adresse } = params;
  const greeting = nom ? `Bonjour ${escapeHtml(nom)},` : "Bonjour,";
  const subject = "Votre rendez-vous est confirmé — Axis Experts";

  const inner = `<h1 style="margin:0 0 14px;font-size:20px;color:#333;">Votre rendez-vous est confirmé</h1>
    <p style="margin:0 0 16px;line-height:1.55;">${greeting}<br><br>Nous vous confirmons votre rendez-vous pour l'état des lieux.</p>

    ${recapTable([
      ["Date", dateLabel ?? ""],
      ["Adresse", adresse ?? ""],
      ["Votre rôle", partyLabel ?? ""],
    ])}

    <p style="margin:16px 0 0;line-height:1.55;">Notre expert vous rencontrera à la date et à l'adresse indiquées. En cas d'empêchement, merci de nous prévenir au plus tôt.</p>`;

  return { subject, html: shell(inner) };
}

// Email INTERNE (info@) : récap de la confirmation, 1 seul par RDV.
export function buildRdvConfirmedInternalEmail(params: {
  orderId: number;
  dateLabel?: string;
  adresse?: string;
}): EmailResult {
  const { orderId, dateLabel, adresse } = params;
  const subject = `RDV public confirmé — devis #${orderId} — Axis Experts`;

  const inner = `<h1 style="margin:0 0 14px;font-size:20px;color:#333;">RDV public confirmé</h1>
    <p style="margin:0 0 16px;line-height:1.55;">Toutes les parties devant valider ont confirmé leur présence. Le devis est passé à « RDV confirmé ».</p>

    ${recapTable([
      ["Devis", `#${orderId}`],
      ["Date", dateLabel ?? ""],
      ["Adresse", adresse ?? ""],
    ])}`;

  return { subject, html: shell(inner) };
}
