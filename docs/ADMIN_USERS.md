# Administration utilisateurs & invitations

Chantier 1 — gestion des users portail côté admin.

## Schéma

### `portal_clients`

Quatre colonnes de traçabilité (ajoutées par
`supabase/migrations/20260416120000_user_soft_delete_and_blocking.sql`) :

| Colonne      | Type          | Sémantique                                      |
|--------------|---------------|-------------------------------------------------|
| `deleted_at` | `TIMESTAMPTZ` | Soft-delete. `NULL` = user actif.               |
| `deleted_by` | `UUID`        | Admin (auth.users.id) ayant effectué la purge.  |
| `blocked_at` | `TIMESTAMPTZ` | Blocage applicatif. `NULL` = non bloqué.        |
| `blocked_by` | `UUID`        | Admin auteur du blocage, ou `NULL` si cascade.  |

Un index partiel `idx_portal_clients_active` accélère les requêtes qui filtrent
sur `deleted_at IS NULL`.

### Machine d'état côté appli

Les helpers vivent dans `src/lib/admin-users.ts` :

- `getUserStatus({ blocked_at, deleted_at })` → `"active" | "blocked" | "deleted"`
- `isUserActive`, `isUserBlocked`, `isUserDeleted`
- `filterVisibleUsers(rows)` → masque les lignes `deleted_at` non-null

Règles :

- `deleted_at` prime sur `blocked_at` (un user supprimé est considéré supprimé,
  même si `blocked_at` est aussi rempli).
- Les listings admin **n'affichent jamais** les users `deleted_at IS NOT NULL`.
- Les listings admin **affichent** les users bloqués avec un badge distinct.

## Routes API admin

| Méthode | Route                                            | Effet                                                                 |
|---------|--------------------------------------------------|-----------------------------------------------------------------------|
| `POST`  | `/api/admin/users/[id]/block`                    | Auth ban (100 ans) + `blocked_at = NOW()`, `blocked_by = admin`.      |
| `POST`  | `/api/admin/users/[id]/unblock`                  | Lève l'auth ban + réinitialise `blocked_at` / `blocked_by`.           |
| `POST`  | `/api/admin/users/[id]/soft-delete`              | Pose `deleted_at = NOW()`, `deleted_by = admin` puis ban l'auth user. |
| `GET`   | `/api/admin/invitations?includeUsed=true`        | Par défaut n'affiche que `used_at IS NULL`. Query `true` pour l'historique. |
| `GET`   | `/api/admin/organizations/[id]`                  | Filtre les users `deleted_at IS NULL` et les invitations `used_at IS NULL`. |
| `GET`   | `/api/admin/organizations`                       | `user_count` = users actifs uniquement.                               |
| `GET`   | `/api/admin/users`                               | Ne liste que les users `deleted_at IS NULL`.                          |

Garde-fous :

- Un admin ne peut ni se bloquer ni se supprimer lui-même (check `user.id === userId`).
- La soft-delete est idempotente : `WHERE deleted_at IS NULL` empêche de
  re-supprimer.
- La soft-delete **ne touche pas** `odoo_partner_id` ni `auth.users`, par
  intégrité de l'historique des missions.

## Cascade organisation → users

Trigger `trigger_cascade_org_deactivation` sur `organizations` :

- Déclenché `AFTER UPDATE`.
- Si `OLD.is_active = true AND NEW.is_active = false`, bloque tous les users
  actifs (`blocked_at IS NULL AND deleted_at IS NULL`) de l'organisation.
- `blocked_by` est laissé à `NULL` (pas de colonne `updated_by` sur
  `organizations`). Les actions manuelles ultérieures pourront le remplir.

La ré-activation de l'organisation **ne débloque pas automatiquement** les
users — un admin doit débloquer manuellement via l'UI.

## Purge invitations `used_at`

Politique : on garde les invitations acceptées 30 jours pour traçabilité, puis
elles sont purgées.

Option recommandée (si `pg_cron` dispo — voir le commentaire de la migration) :

```sql
SELECT cron.schedule(
  'purge-invitations-used',
  '0 3 * * *',
  $$ DELETE FROM invitations
     WHERE used_at IS NOT NULL
       AND used_at < NOW() - INTERVAL '30 days'; $$
);
```

Sinon, même requête lancée par un cron externe ou une Edge Function.

## UI — AlertDialog & toasts

Toutes les confirmations destructives utilisent `AlertDialog` de shadcn + des
toasts `sonner` (via `@/lib/toast`).

| Emplacement                              | Actions avec dialog                                   |
|------------------------------------------|-------------------------------------------------------|
| `src/app/admin/organizations/[id]/page.tsx` | Bloquer / Débloquer / Supprimer user, Annuler invitation |
| `src/app/admin/users/page.tsx`           | Bloquer / Débloquer / Supprimer user                  |
| `src/app/admin/custom-fields/page.tsx`   | Supprimer un champ personnalisé                       |

Il ne reste plus aucun `window.confirm()` dans `src/app/admin`.

## Hors scope (à challenger plus tard)

- Anonymisation RGPD de l'email d'un user soft-deleted (traçabilité prime pour
  l'instant).
- Hard delete des users (non prévu).
- Onglet « Historique » des invitations `used_at`. L'API est déjà prête via
  `?includeUsed=true`.
- Notification email du user lorsqu'il est bloqué ou supprimé.
