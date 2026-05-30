// Template email de confirmation de demande publique de RDV.
// HTML inline (compatible clients mail), couleurs Axis (#F5B800), logo, bouton
// de confirmation. Même facture que rdv-notification.ts. Aucun secret hors URL.

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

const MISSION_LABEL: Record<string, string> = {
  ELLE: "État des lieux d'entrée",
  ELLS: "État des lieux de sortie",
};

export type BuildPublicRdvConfirmEmailParams = {
  confirmUrl: string;
  nom?: string;
  mission?: string;
  adresse?: string;
};

export type BuildPublicRdvConfirmEmailResult = {
  subject: string;
  html: string;
};

export function buildPublicRdvConfirmEmail(
  params: BuildPublicRdvConfirmEmailParams
): BuildPublicRdvConfirmEmailResult {
  const { confirmUrl, nom, mission, adresse } = params;

  const subject = "Confirmez votre demande de rendez-vous — Axis Experts";
  const greeting = nom ? `Bonjour ${escapeHtml(nom)},` : "Bonjour,";
  const missionLabel = mission ? MISSION_LABEL[mission] ?? mission : "";

  // Récap minimal (uniquement si dispo).
  const recapRows: string[] = [];
  if (missionLabel) {
    recapRows.push(
      `<tr><td style="color:#737373;padding:6px 0;">Mission</td><td style="font-weight:600;color:#333;">${escapeHtml(
        missionLabel
      )}</td></tr>`
    );
  }
  if (adresse) {
    recapRows.push(
      `<tr><td style="color:#737373;padding:6px 0;">Adresse</td><td style="font-weight:600;color:#333;">${escapeHtml(
        adresse
      )}</td></tr>`
    );
  }
  const recapHtml = recapRows.length
    ? `<table style="width:100%;margin:8px 0 4px;border-collapse:collapse;">${recapRows.join(
        ""
      )}</table>`
    : "";

  const safeUrl = escapeHtml(confirmUrl);

  const html = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color:#333;">
  <div style="background: #F5B800; padding: 20px 24px; border-radius: 12px 12px 0 0; text-align:center;">
    <img src="${LOGO_URL}" alt="Axis Experts" style="height:40px;width:auto;display:inline-block;" />
  </div>
  <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    <h1 style="margin:0 0 14px;font-size:20px;color:#333;">Confirmez votre demande de rendez-vous</h1>
    <p style="margin:0 0 16px;line-height:1.55;">${greeting}<br><br>Nous avons bien reçu votre demande de rendez-vous. Pour qu'elle soit transmise à notre secrétariat, il vous reste une étape : confirmer en cliquant ci-dessous.</p>

    <div style="margin:18px 0 8px;font-size:14px;color:#8a6a00;background:#F5B80020;border:1px solid #f0d68a;border-radius:10px;padding:12px 14px;">
      ⚠️ <strong>Votre demande ne sera prise en compte qu'une fois le lien validé.</strong> Sans confirmation, elle ne sera pas enregistrée.
    </div>

    ${recapHtml}

    <div style="text-align:center;margin:26px 0 14px;">
      <a href="${safeUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;font-weight:700;font-size:16px;text-decoration:none;padding:14px 30px;border-radius:9999px;">Confirmer ma demande →</a>
    </div>

    <p style="margin:14px 0 0;font-size:13px;color:#737373;line-height:1.5;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><span style="color:#8a6a00;word-break:break-all;">${safeUrl}</span></p>

    <p style="color:#737373;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #e5e5e5;line-height:1.5;">
      Ce lien est valable <strong>72 heures</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br><br>
      <strong>Axis Experts</strong> — Cabinet d'expertise immobilière
    </p>
  </div>
</div>`;

  return { subject, html };
}
