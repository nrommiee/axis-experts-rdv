import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  readNotificationPreferences,
  sanitizeNotificationPreferencesUpdate,
} from "@/lib/notification-preferences";

export const dynamic = "force-dynamic";

// Route portail self-service (HORS /api/admin/...) : permet à un utilisateur
// connecté de LIRE et METTRE À JOUR les préférences de notification de SON
// organisation UNIQUEMENT.
//
// Sécurité (calquée sur src/app/api/custom-fields/route.ts:18-36) :
//  - L'org cible est résolue côté SERVEUR via la session (`portal_clients` lu
//    sous RLS avec le client utilisateur), JAMAIS via un id fourni par le client.
//  - L'écriture utilise un admin-client mais est scopée `.eq("id", orgId)` à
//    l'org résolue → impossible de cibler une autre org.
//  - Seules les colonnes de préférences existantes sont lues/écrites
//    (cf. liste blanche dans `notification-preferences.ts`). Aucune autre
//    colonne de `organizations` n'est modifiable par cette route.
//
// Approche retenue : admin-client scopé (option (a) de l'audit §3.3), PAS de
// nouvelle policy RLS UPDATE sur `organizations` — une policy RLS ne peut pas
// restreindre par colonne et exposerait toute la fiche org.

const PREF_SELECT =
  "id, notifications_enabled, notify_on_create, notify_on_update";
const PREF_SELECT_LEGACY = "id, notifications_enabled";

async function resolveOrganizationId(): Promise<
  | { ok: true; organizationId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  // Résolution de l'org via le client UTILISATEUR (RLS) — la source de vérité.
  const { data: clientRow } = await supabase
    .from("portal_clients")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!clientRow?.organization_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      ),
    };
  }

  return { ok: true, organizationId: clientRow.organization_id as string };
}

export async function GET() {
  try {
    const resolved = await resolveOrganizationId();
    if (!resolved.ok) return resolved.response;

    const admin = createAdminClient();

    let orgRes = await admin
      .from("organizations")
      .select(PREF_SELECT)
      .eq("id", resolved.organizationId)
      .single();

    // Fallback si les colonnes notify_on_* ne sont pas encore migrées.
    if (
      orgRes.error &&
      /notify_on_(create|update)/.test(orgRes.error.message ?? "")
    ) {
      orgRes = await admin
        .from("organizations")
        .select(PREF_SELECT_LEGACY)
        .eq("id", resolved.organizationId)
        .single();
    }

    if (orgRes.error || !orgRes.data) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      readNotificationPreferences(orgRes.data as Record<string, unknown>)
    );
  } catch (err) {
    console.error("GET /api/profile/notifications error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const resolved = await resolveOrganizationId();
    if (!resolved.ok) return resolved.response;

    const body = await request.json().catch(() => null);
    const sanitized = sanitizeNotificationPreferencesUpdate(body);
    if (!sanitized.ok) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 });
    }

    const admin = createAdminClient();

    // L'UPDATE est scopé à l'org résolue côté serveur. `.select()` confirme
    // qu'une ligne a bien été touchée (sinon update réussit sur 0 ligne).
    let updateRes = await admin
      .from("organizations")
      .update(sanitized.updates)
      .eq("id", resolved.organizationId)
      .select(PREF_SELECT)
      .single();

    // Fallback si notify_on_* non migrées : on retire ces clés et on réessaie.
    if (
      updateRes.error &&
      /notify_on_(create|update)/.test(updateRes.error.message ?? "")
    ) {
      const legacyUpdates = { ...sanitized.updates };
      delete legacyUpdates.notify_on_create;
      delete legacyUpdates.notify_on_update;

      if (Object.keys(legacyUpdates).length === 0) {
        // Rien à persister hors colonnes non migrées : on relit l'état courant.
        const readBack = await admin
          .from("organizations")
          .select(PREF_SELECT_LEGACY)
          .eq("id", resolved.organizationId)
          .single();
        if (readBack.error || !readBack.data) {
          return NextResponse.json(
            { error: "Erreur lors de la mise à jour" },
            { status: 500 }
          );
        }
        return NextResponse.json(
          readNotificationPreferences(readBack.data as Record<string, unknown>)
        );
      }

      updateRes = await admin
        .from("organizations")
        .update(legacyUpdates)
        .eq("id", resolved.organizationId)
        .select(PREF_SELECT_LEGACY)
        .single();
    }

    if (updateRes.error || !updateRes.data) {
      console.error(
        "PATCH /api/profile/notifications update failed:",
        updateRes.error
      );
      return NextResponse.json(
        { error: updateRes.error?.message || "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      readNotificationPreferences(updateRes.data as Record<string, unknown>)
    );
  } catch (err) {
    console.error("PATCH /api/profile/notifications error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
