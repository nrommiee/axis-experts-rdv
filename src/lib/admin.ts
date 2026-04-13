// Admin email(s) — comma-separated in env var ADMIN_EMAILS
// Falls back to the legacy hardcoded email if env var is not set.
const FALLBACK_ADMIN = "n.rommiee@axis-experts.be";

let _adminEmails: string[] | null = null;

export function getAdminEmails(): string[] {
  if (_adminEmails) return _adminEmails;
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (raw) {
    _adminEmails = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  } else {
    _adminEmails = [FALLBACK_ADMIN];
  }
  return _adminEmails;
}

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
