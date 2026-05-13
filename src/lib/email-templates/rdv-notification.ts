function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DATE_FR_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_FR_SHORT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function extractFirstAddressLine(adresseComplete: string): string {
  const trimmed = (adresseComplete || "").trim();
  if (!trimmed) return "";
  const firstLine = trimmed.split(/[\n,]/)[0]?.trim() ?? "";
  return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
}

export function formatLocataire(odooField: unknown): string {
  if (!odooField) return "";
  if (Array.isArray(odooField)) {
    // many2one [id, name]
    if (odooField.length >= 2 && typeof odooField[1] === "string") {
      return odooField[1].trim();
    }
    // array of objects (one2many) — take first display_name / name
    const first = odooField[0];
    if (first && typeof first === "object") {
      const obj = first as Record<string, unknown>;
      if (typeof obj.display_name === "string") return obj.display_name.trim();
      if (typeof obj.name === "string") return obj.name.trim();
    }
    return "";
  }
  if (typeof odooField === "string") return odooField.trim();
  return "";
}

const MISSION_LABEL: Record<string, string> = {
  Entrée: "Entrée locative",
  Sortie: "Sortie locative",
  Refonte: "Refonte",
};

function missionLabelFor(typeMission: string | null | undefined): string {
  const raw = (typeMission || "").trim();
  if (!raw) return "—";
  return MISSION_LABEL[raw] ?? raw;
}

export type BuildRdvNotificationEmailParams = {
  orderName: string;
  dateObj: Date;
  timeStart: string | null;
  timeEnd: string | null;
  adresseComplete: string;
  locataireNomComplet: string;
  missionType: string | null;
  isUpdate: boolean;
};

export type BuildRdvNotificationEmailResult = {
  subject: string;
  html: string;
};

export function buildRdvNotificationEmail(
  params: BuildRdvNotificationEmailParams
): BuildRdvNotificationEmailResult {
  const {
    orderName,
    dateObj,
    timeStart,
    timeEnd,
    adresseComplete,
    locataireNomComplet,
    missionType,
    isUpdate,
  } = params;

  const typeLabel = isUpdate ? "mis à jour" : "planifié";
  const dateFrShort = DATE_FR_SHORT.format(dateObj);
  const dateFrLong = DATE_FR_LONG.format(dateObj);
  const heureFr = timeStart ?? "";
  const adresseCourte = extractFirstAddressLine(adresseComplete);
  const locataireSubject = locataireNomComplet || "—";

  const subjectParts = [
    `[Axis Experts] RDV ${typeLabel}`,
    `${dateFrShort}${heureFr ? ` à ${heureFr}` : ""}`,
    adresseCourte || "—",
    locataireSubject,
  ];
  const subject = subjectParts.join(" — ");

  const heading = isUpdate ? "Rendez-vous mis à jour" : "Rendez-vous planifié";
  const verbHtml = isUpdate ? "mis à jour" : "planifié";

  const horaireValue = timeStart && timeEnd
    ? `de ${escapeHtml(timeStart)} à ${escapeHtml(timeEnd)}`
    : timeStart
      ? `à partir de ${escapeHtml(timeStart)}`
      : "—";

  const html = `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #F5B800; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">${escapeHtml(heading)}</h1>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Bonjour,<br><br>Le rendez-vous d'état des lieux suivant a été ${escapeHtml(verbHtml)} :</p>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="color: #737373; padding: 6px 0;">Référence</td><td style="font-weight: 600; color: #333;">${escapeHtml(orderName || "—")}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Date</td><td style="font-weight: 600; color: #333;">${escapeHtml(dateFrLong)}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Horaire</td><td style="font-weight: 600; color: #333;">${horaireValue}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Adresse</td><td style="font-weight: 600; color: #333;">${escapeHtml(adresseComplete || "—")}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Locataire</td><td style="font-weight: 600; color: #333;">${escapeHtml(locataireNomComplet || "—")}</td></tr>
      <tr><td style="color: #737373; padding: 6px 0;">Mission</td><td style="font-weight: 600; color: #333;">${escapeHtml(missionLabelFor(missionType))}</td></tr>
    </table>
    <a href="https://rdv.axis-experts.be/dashboard" style="display: inline-block; background: #0ABFB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">Voir le dossier</a>
    <p style="color: #737373; font-size: 13px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
      Vous recevez cet email parce que vous êtes utilisateur du portail Axis Experts. Pour modifier ces notifications, contactez votre administrateur.<br><br>
      <strong>Axis Experts</strong> — Cabinet d'expertise immobilière
    </p>
  </div>
</div>`;

  return { subject, html };
}
