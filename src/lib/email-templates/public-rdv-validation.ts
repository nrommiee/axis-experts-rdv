// Templates email de validation de présence (étape 2a).
// (a) "Confirmez votre présence" avec lien (parties devant valider).
// (b) "Information : RDV proposé" sans lien (parties informées seulement).
// HTML inline, couleurs Axis (#F5B800), logo. Calqué sur les autres templates.

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

export type BuildValidationEmailParams = {
  validateUrl: string;
  nom?: string;
  partyLabel: string; // "Bailleur" | "Locataire"
  dateLabel?: string; // date du RDV (texte)
  adresse?: string;
};

export type BuildInfoEmailParams = {
  nom?: string;
  partyLabel: string;
  dateLabel?: string;
  adresse?: string;
};

export type EmailResult = { subject: string; html: string };

// (a) Email AVEC lien de validation.
export function buildPartyValidationEmail(
  params: BuildValidationEmailParams
): EmailResult {
  const { validateUrl, nom, partyLabel, dateLabel, adresse } = params;
  const greeting = nom ? `Bonjour ${escapeHtml(nom)},` : "Bonjour,";
  const safeUrl = escapeHtml(validateUrl);
  const subject = "Confirmez votre présence au rendez-vous — Axis Experts";

  const inner = `<h1 style="margin:0 0 14px;font-size:20px;color:#333;">Confirmez votre présence</h1>
    <p style="margin:0 0 16px;line-height:1.55;">${greeting}<br><br>Une date de rendez-vous a été proposée pour l'état des lieux. En tant que <strong>${escapeHtml(
      partyLabel
    )}</strong>, merci de confirmer votre présence en cliquant ci-dessous.</p>

    ${recapTable([
      ["Date proposée", dateLabel ?? ""],
      ["Votre rôle", partyLabel],
      ["Adresse", adresse ?? ""],
    ])}

    <div style="text-align:center;margin:26px 0 14px;">
      <a href="${safeUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;font-weight:700;font-size:16px;text-decoration:none;padding:14px 30px;border-radius:9999px;">Je confirme ma présence →</a>
    </div>

    <p style="margin:14px 0 0;font-size:13px;color:#737373;line-height:1.5;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><span style="color:#8a6a00;word-break:break-all;">${safeUrl}</span></p>`;

  return { subject, html: shell(inner) };
}

// (b) Email d'INFORMATION sans lien.
export function buildPartyInfoEmail(params: BuildInfoEmailParams): EmailResult {
  const { nom, partyLabel, dateLabel, adresse } = params;
  const greeting = nom ? `Bonjour ${escapeHtml(nom)},` : "Bonjour,";
  const subject = "Votre rendez-vous est proposé — Axis Experts";

  const inner = `<h1 style="margin:0 0 14px;font-size:20px;color:#333;">Votre rendez-vous est proposé</h1>
    <p style="margin:0 0 16px;line-height:1.55;">${greeting}<br><br>Une date de rendez-vous a été proposée pour l'état des lieux. Vous recevez cette information en tant que <strong>${escapeHtml(
      partyLabel
    )}</strong>.</p>

    ${recapTable([
      ["Date proposée", dateLabel ?? ""],
      ["Votre rôle", partyLabel],
      ["Adresse", adresse ?? ""],
    ])}

    <p style="margin:16px 0 0;line-height:1.55;">Aucune action n'est requise de votre part.</p>`;

  return { subject, html: shell(inner) };
}
