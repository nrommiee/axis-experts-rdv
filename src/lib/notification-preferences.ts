// Préférences de notification self-service (PAR ORGANISATION).
//
// Lot 3 : une agence connectée édite elle-même les préférences de notification
// de SON organisation. Ce module centralise la logique sensible — la liste
// blanche des colonnes éditables — pour qu'elle soit testable indépendamment de
// la route et de Supabase.
//
// Périmètre strict : SEULES les préférences booléennes QUI EXISTENT DÉJÀ
// (migration 20260521120000_…:56-68). Le mode de destinataires et les emails
// personnalisés (`notification_recipients_mode`, `notification_custom_emails`)
// relèvent du sélecteur multi-destinataires HORS périmètre (Lot 4) et ne sont
// donc PAS exposés ici. Aucune autre colonne de `organizations` n'est éditable.

export const NOTIFICATION_PREF_COLUMNS = [
  "notifications_enabled",
  "notify_on_create",
  "notify_on_update",
] as const;

export type NotificationPrefColumn = (typeof NOTIFICATION_PREF_COLUMNS)[number];

export type NotificationPreferences = {
  notifications_enabled: boolean;
  notify_on_create: boolean;
  notify_on_update: boolean;
};

const PREF_COLUMN_SET: ReadonlySet<string> = new Set(NOTIFICATION_PREF_COLUMNS);

// Normalise une ligne brute `organizations` vers les 3 booléens exposés au
// portail. `notify_on_*` valent `true` par défaut (défaut de colonne) ;
// `notifications_enabled` vaut `false`.
export function readNotificationPreferences(
  row: Record<string, unknown> | null | undefined
): NotificationPreferences {
  const bool = (value: unknown, fallback: boolean) =>
    value === undefined || value === null ? fallback : Boolean(value);
  return {
    notifications_enabled: bool(row?.notifications_enabled, false),
    notify_on_create: bool(row?.notify_on_create, true),
    notify_on_update: bool(row?.notify_on_update, true),
  };
}

// Décide si la notification RDV date/heure doit partir, selon les préférences de
// l'organisation et le type d'événement (1ère date posée vs date modifiée).
// `notifications_enabled` est le verrou global ; `notify_on_create` /
// `notify_on_update` raffinent par type. Préférence désactivée → aucun envoi.
export function shouldSendRdvNotification(
  prefs: NotificationPreferences,
  notificationType: "initial" | "updated"
): boolean {
  if (!prefs.notifications_enabled) return false;
  return notificationType === "initial"
    ? prefs.notify_on_create
    : prefs.notify_on_update;
}

// Construit la map colonne→valeur à passer à UPDATE en ne gardant QUE les
// préférences booléennes de la liste blanche. Toute autre clé (`id`,
// `organization_id`, `client_type`, `odoo_partner_id`, …) est ignorée : cette
// route ne peut jamais muter une colonne hors-prefs, et un `organization_id`
// fourni par le client ne peut jamais rediriger l'écriture vers une autre org.
export function sanitizeNotificationPreferencesUpdate(
  body: unknown
):
  | { ok: true; updates: Partial<NotificationPreferences> }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Requête invalide" };
  }
  const updates: Partial<NotificationPreferences> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (!PREF_COLUMN_SET.has(key)) continue; // ignore toute clé hors-prefs
    if (typeof value !== "boolean") {
      return { ok: false, error: `${key} doit être un booléen` };
    }
    (updates as Record<string, boolean>)[key] = value;
  }
  if (Object.keys(updates).length === 0) {
    return { ok: false, error: "Aucune préférence valide à mettre à jour" };
  }
  return { ok: true, updates };
}
