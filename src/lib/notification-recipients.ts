import type { createAdminClient } from "@/lib/supabase/admin";
import { isAgency } from "@/lib/client-type";

export type SupabaseAdmin = ReturnType<typeof createAdminClient>;

export type NotificationRecipientsMode =
  | "creator_only"
  | "all_org_users"
  | "custom_list";

export type NotificationOrganization = {
  id: string;
  notification_recipients_mode: NotificationRecipientsMode;
  notification_custom_emails: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAndValidateEmails(emails: string[]): string[] {
  return [
    ...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ].filter((e) => EMAIL_RE.test(e));
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase());
}

/**
 * Résout l'email du DEMANDEUR connecté d'une commande (« creator »).
 *
 * Le lien user↔order vit uniquement dans `portal_submissions`, écrit à chaque
 * soumission par `submit-rdv`. On y retrouve le `user_id`, puis son email via
 * l'API admin auth. Retourne `null` si aucune soumission/email n'est trouvé.
 *
 * Base partagée par le mode `creator_only` et par l'ajout du demandeur comme
 * destinataire des notifications RDV pour les organisations agence (Lot 4a).
 */
export async function resolveCreatorEmail(
  supabaseAdmin: SupabaseAdmin,
  orderId: number
): Promise<string | null> {
  const { data: sub } = await supabaseAdmin
    .from("portal_submissions")
    .select("user_id")
    .eq("odoo_order_id", orderId)
    .maybeSingle();
  if (!sub?.user_id) return null;
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
  return u?.user?.email ?? null;
}

/**
 * Ajoute le DEMANDEUR comme destinataire des notifications RDV, mais UNIQUEMENT
 * pour les organisations agence (Lot 4a). Pour tout autre type de client
 * (social, dactylo, public…), la liste de base est renvoyée inchangée — le flux
 * non-agence n'est jamais affecté.
 *
 * Fonction pure : la résolution de l'email demandeur (`resolveCreatorEmail`) est
 * faite par l'appelant, ce qui rend cette composition testable sans Supabase.
 * Le résultat est normalisé/dédupliqué : si le demandeur figure déjà dans la
 * liste de base, aucun doublon n'est créé.
 */
export function withCreatorForAgency(
  baseRecipients: string[],
  clientType: string | null | undefined,
  creatorEmail: string | null | undefined
): string[] {
  if (!isAgency(clientType) || !creatorEmail) {
    return normalizeAndValidateEmails(baseRecipients);
  }
  return normalizeAndValidateEmails([...baseRecipients, creatorEmail]);
}

async function resolveAllOrgUsers(
  supabaseAdmin: SupabaseAdmin,
  organizationId: string
): Promise<string[]> {
  const { data: pcs, error } = await supabaseAdmin
    .from("portal_clients")
    .select("user_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .is("blocked_at", null);
  if (error || !pcs) return [];
  const emails: string[] = [];
  for (const row of pcs) {
    const userId = (row as { user_id: string | null }).user_id;
    if (!userId) continue;
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (u?.user?.email) emails.push(u.user.email);
  }
  return emails;
}

export async function resolveNotificationRecipients(
  supabaseAdmin: SupabaseAdmin,
  org: NotificationOrganization,
  orderId?: number
): Promise<string[]> {
  const mode = org.notification_recipients_mode;
  let emails: string[] = [];

  if (mode === "custom_list") {
    const list = Array.isArray(org.notification_custom_emails)
      ? (org.notification_custom_emails as unknown[])
      : [];
    emails = list.filter((e): e is string => typeof e === "string");
  } else if (mode === "creator_only") {
    if (typeof orderId !== "number") {
      console.warn(
        `[notifications] creator_only requested without orderId for org ${org.id}; fallback all_org_users`
      );
      emails = await resolveAllOrgUsers(supabaseAdmin, org.id);
    } else {
      const creatorEmail = await resolveCreatorEmail(supabaseAdmin, orderId);
      if (creatorEmail) emails = [creatorEmail];
      if (emails.length === 0) {
        console.warn(
          `[notifications] creator_only fallback to all_org_users for order ${orderId}`
        );
        emails = await resolveAllOrgUsers(supabaseAdmin, org.id);
      }
    }
  } else {
    emails = await resolveAllOrgUsers(supabaseAdmin, org.id);
  }

  return normalizeAndValidateEmails(emails);
}
