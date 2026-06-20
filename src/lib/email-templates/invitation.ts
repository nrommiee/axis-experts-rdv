// Template email d'invitation au portail Axis Experts.
// Extrait de /api/admin/invite/route.ts pour être partagé entre l'envoi initial
// et la réinvitation (/api/admin/invitations/[id]/resend). Le contenu (sujet,
// HTML, texte, bouton, lien setup-account) est préservé à l'identique.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type BuildInvitationEmailParams = {
  inviteUrl: string;
  orgName: string;
  ttlDays: number;
};

export type BuildInvitationEmailResult = {
  subject: string;
  text: string;
  html: string;
};

export function buildInvitationEmail(
  params: BuildInvitationEmailParams
): BuildInvitationEmailResult {
  const { inviteUrl, orgName, ttlDays } = params;

  const subject = `Votre invitation au portail Axis Experts — ${orgName}`;

  const text = `Bonjour,

Vous etes invite(e) a rejoindre le portail Axis Experts pour ${orgName}.
Creez votre compte en cliquant sur ce lien :
${inviteUrl}

Ce lien est valable ${ttlDays} jours.`;

  const html = `<div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Bonjour,</p>
<p>Vous etes invite(e) a rejoindre le portail Axis Experts pour <strong>${escapeHtml(orgName)}</strong>.</p>
<p>Cliquez sur le bouton ci-dessous pour creer votre compte :</p>
<p style="text-align: center; margin: 24px 0;">
  <a href="${escapeHtml(inviteUrl)}" style="background-color: #F5B800; color: #333333; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; display: inline-block;">
    Creer mon compte
  </a>
</p>
<p style="color: #737373; font-size: 14px;">Ce lien est valable ${ttlDays} jours.</p>
<p style="color: #737373; font-size: 12px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
<a href="${escapeHtml(inviteUrl)}" style="color: #F5B800;">${escapeHtml(inviteUrl)}</a></p>
</div>`;

  return { subject, text, html };
}
