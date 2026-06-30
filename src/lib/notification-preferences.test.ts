import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_PREF_COLUMNS,
  readNotificationPreferences,
  sanitizeNotificationPreferencesUpdate,
} from "./notification-preferences";

describe("notification-preferences", () => {
  describe("readNotificationPreferences", () => {
    it("applique les défauts de colonne quand la valeur est absente", () => {
      expect(readNotificationPreferences({})).toEqual({
        notifications_enabled: false,
        notify_on_create: true,
        notify_on_update: true,
      });
    });

    it("applique les défauts quand la ligne est null (colonnes non migrées)", () => {
      expect(readNotificationPreferences(null)).toEqual({
        notifications_enabled: false,
        notify_on_create: true,
        notify_on_update: true,
      });
    });

    it("reflète les valeurs stockées", () => {
      expect(
        readNotificationPreferences({
          notifications_enabled: true,
          notify_on_create: false,
          notify_on_update: true,
        })
      ).toEqual({
        notifications_enabled: true,
        notify_on_create: false,
        notify_on_update: true,
      });
    });
  });

  describe("sanitizeNotificationPreferencesUpdate", () => {
    it("accepte les préférences booléennes connues", () => {
      const res = sanitizeNotificationPreferencesUpdate({
        notifications_enabled: true,
        notify_on_create: false,
      });
      expect(res).toEqual({
        ok: true,
        updates: { notifications_enabled: true, notify_on_create: false },
      });
    });

    // SÉCURITÉ : aucune colonne hors-prefs ne doit pouvoir être modifiée, et un
    // `organization_id` fourni par le client doit être ignoré (l'org cible est
    // résolue côté serveur depuis la session, jamais depuis le corps de requête).
    it("ignore toute clé hors liste blanche (org id, type, partner id, RBAC…)", () => {
      const res = sanitizeNotificationPreferencesUpdate({
        notify_on_create: true,
        // Tentatives d'injection : doivent toutes être écartées.
        id: "00000000-0000-0000-0000-000000000000",
        organization_id: "autre-org-id",
        client_type: "agency",
        odoo_partner_id: 999,
        odoo_agency_id: 999,
        is_active: false,
        name: "Org piratée",
        notification_recipients_mode: "custom_list", // hors périmètre Lot 4
        notification_custom_emails: ["attacker@evil.test"], // hors périmètre Lot 4
      });
      expect(res).toEqual({ ok: true, updates: { notify_on_create: true } });
      if (res.ok) {
        expect(Object.keys(res.updates)).toEqual(["notify_on_create"]);
      }
    });

    it("rejette une valeur de préférence non booléenne", () => {
      const res = sanitizeNotificationPreferencesUpdate({
        notifications_enabled: "yes",
      });
      expect(res.ok).toBe(false);
    });

    it("rejette un corps qui ne contient aucune préférence valide", () => {
      const res = sanitizeNotificationPreferencesUpdate({ foo: "bar" });
      expect(res.ok).toBe(false);
    });

    it("rejette un corps non-objet", () => {
      expect(sanitizeNotificationPreferencesUpdate(null).ok).toBe(false);
      expect(sanitizeNotificationPreferencesUpdate("nope").ok).toBe(false);
    });

    it("la liste blanche ne contient que des préférences (pas de mode/emails)", () => {
      expect([...NOTIFICATION_PREF_COLUMNS].sort()).toEqual([
        "notifications_enabled",
        "notify_on_create",
        "notify_on_update",
      ]);
    });
  });
});
