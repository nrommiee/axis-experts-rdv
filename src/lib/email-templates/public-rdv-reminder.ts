// Templates email de rappel de demande publique de RDV (1er + dernier rappel).
// HTML inline, couleurs Axis (#F5B800), logo. Calqué sur public-rdv-confirm.ts.
// Aucun secret hors URL de confirmation.

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

export type ReminderStage = 1 | 2;

export type BuildPublicRdvReminderEmailParams = {
  confirmUrl: string;
  stage: ReminderStage;
  nom?: string;
  mission?: string;
  adresse?: string;
};

export type BuildPublicRdvReminderEmailResult = {
  subject: string;
  html: string;
};

export function buildPublicRdvReminderEmail(
  params: BuildPublicRdvReminderEmailParams
): BuildPublicRdvReminderEmailResult {
  const { confirmUrl, stage, nom, mission, adresse } = params;

  const greeting = nom ? `Bonjour ${escapeHtml(nom)},` : "Bonjour,";
  const missionLabel = mission ? MISSION_LABEL[mission] ?? mission : "";

  const isLast = stage === 2;
  const subject = isLast
    ? "Dernier rappel : votre demande expire bientôt — Axis Experts"
    : "Rappel : confirmez votre demande de rendez-vous — Axis Experts";

  const title = isLast
    ? "Dernier rappel — votre demande va expirer"
    : "Confirmez votre demande de rendez-vous";

  const intro = isLast
    ? "Votre demande de rendez-vous n'est toujours pas confirmée. Sans confirmation de votre part, elle sera <strong>automatiquement annulée d'ici quelques heures</strong> (délai de 72 heures)."
    : "Vous avez fait une demande de rendez-vous mais elle n'est pas encore confirmée. Pour qu'elle soit transmise à notre secrétariat, il vous reste à la confirmer.";

  const warnBox = isLast
    ? "⚠️ <strong>Dernier rappel</strong> : passé le délai de 72 heures, votre demande sera annulée et ne sera pas traitée."
    : "⚠️ <strong>Sans confirmation, votre demande expirera automatiquement</strong> et ne sera pas traitée.";

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
    <h1 style="margin:0 0 14px;font-size:20px;color:#333;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 16px;line-height:1.55;">${greeting}<br><br>${intro}</p>

    <div style="margin:18px 0 8px;font-size:14px;color:#8a6a00;background:#F5B80020;border:1px solid #f0d68a;border-radius:10px;padding:12px 14px;">
      ${warnBox}
    </div>

    ${recapHtml}

    <div style="text-align:center;margin:26px 0 14px;">
      <a href="${safeUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;font-weight:700;font-size:16px;text-decoration:none;padding:14px 30px;border-radius:9999px;">Confirmer ma demande →</a>
    </div>

    <p style="margin:14px 0 0;font-size:13px;color:#737373;line-height:1.5;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><span style="color:#8a6a00;word-break:break-all;">${safeUrl}</span></p>

    <p style="color:#737373;font-size:13px;margin-top:28px;padding-top:16px;border-top:1px solid #e5e5e5;line-height:1.5;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br><br>
      <strong>Axis Experts</strong> — Cabinet d'expertise immobilière
    </p>
  </div>
</div>`;

  return { subject, html };
}
