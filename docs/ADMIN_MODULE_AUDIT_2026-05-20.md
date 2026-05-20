# Audit Module Admin axis-experts-rdv — 2026-05-20

Audit en lecture seule du module admin (`src/app/admin/*` + `src/app/api/admin/*` +
flows d'authentification associés). Base : `main` à `1419cca` (post PR #17).
Aucune modification de code n'a été effectuée.

---

## Résumé exécutif

- **3 bugs P0** (login possible pour ex-soft-deleted antérieurs au correctif V2,
  reset-password "Auth session missing" non reproduit en code seul mais cause
  probable identifiée, restore manquant).
- **6 bugs P1** (discordance `ADMIN_EMAILS` vs `NEXT_PUBLIC_ADMIN_EMAIL` →
  boucle de redirection possible, route `/api/auth/register` orpheline,
  cascade org → user sans ban auth, lookup `email_bailleur` fragile pour
  réactivation, N+1 sur `auth.admin.getUserById`, absence d'audit trail).
- **5 bugs P2** (hard-delete inexistant alors que l'UI laisse croire qu'il
  pourrait l'être, e-mails de blocage absents, validation password 6 vs 8,
  pas de purge auto invitations, `client_type` org peut être conservé
  invalidé).
- **État du module** : **utilisable en V2 avec garde-fous**, mais 3 transitions
  utilisateur restent incohérentes sur des données héritées et la couche admin
  manque d'audit / restore / hard-delete.

### Top 5 fix V2.5 (par effort/impact)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Backfill SQL : bannir au niveau `auth.users` tous les `portal_clients` `deleted_at IS NOT NULL` non bannis | 1h | Bloque login users soft-delete antérieurs au commit `287c2d7` |
| 2 | Ajouter route `POST /api/admin/users/[id]/restore` + bouton UI | 3h | Réversibilité du soft-delete |
| 3 | Aligner `NEXT_PUBLIC_ADMIN_EMAIL` (singleton) et `ADMIN_EMAILS` (liste) ou retirer le check client-side | 1h | Élimine la boucle redirect /admin ⇄ /dashboard pour admin secondaires |
| 4 | Migrer `/reset-password` vers un route handler `/auth/callback` server-side (PKCE robuste) | 4h | Fix "Auth session missing" |
| 5 | Bannir auth.users dans le trigger `cascade_org_deactivation` (via Edge Function ou suppression du blocage applicatif au profit d'un appel API node) | 3h | Cohérence org-désactivée / user-bloqué |

---

## A. Routes API admin (inventaire + audit)

Pour chaque route : méthode, auth check, tables touchées, effets `auth.users`,
emails, validation. Toutes les routes utilisent `createAdminClient()` (service
role) et donc bypass RLS.

| Route | Méthode | Auth | Tables R/W | `auth.users` | Email | Validation | Notes |
|-------|---------|------|------------|--------------|-------|------------|-------|
| `/api/admin/users` (`src/app/api/admin/users/route.ts:8`) | GET | `isAdmin(user.email)` | R: `portal_clients`, `organizations`; R via `auth.admin.getUserById` | aucune écriture | non | none | **N+1** : un appel `getUserById` par client (l. 40-42) |
| `/api/admin/users/[id]/block` (`block/route.ts:8`) | POST | `isAdmin` + `user.id !== userId` (l.24) | W: `portal_clients.blocked_at/blocked_by` (l.43-50) | W: `updateUserById(ban_duration:"876600h")` (l.33-35) | non | aucune (id du path seulement) | OK |
| `/api/admin/users/[id]/unblock` (`unblock/route.ts:8`) | POST | `isAdmin` (pas de self-check) | W: `portal_clients.blocked_at=null` filtré `deleted_at IS NULL` (l.36-43) | W: `updateUserById(ban_duration:"none")` (l.26-28) | non | aucune | **Risque** : ne nettoie pas un user qui aurait `deleted_at` posé (mais blocage idempotent) |
| `/api/admin/users/[id]/soft-delete` (`soft-delete/route.ts:8`) | POST | `isAdmin` + `user.id !== userId` (l.24) | W: `portal_clients.deleted_at/deleted_by` filtré `IS NULL` (l.35-44) | W: `updateUserById(ban_duration:"876600h")` (l.60-62) | non | aucune | **Bug 1 (résolu en code, pas en data)** — voir §G |
| `/api/admin/organizations` (`organizations/route.ts:8`) | GET | `isAdmin` | R: `organizations`, `portal_clients` (count actifs) (l.32-36) | none | non | none | OK |
| `/api/admin/organizations` (`organizations/route.ts:73`) | POST | `isAdmin` | W: `organizations.insert` (l.121-139) | none | non | `name`, `odoo_partner_id`, `client_type` whitelisté (l.112) | OK |
| `/api/admin/organizations/[id]` (`[id]/route.ts:8`) | GET | `isAdmin` | R: `organizations`, `portal_clients` (filtre `deleted_at IS NULL` l.47), `invitations` (filtre `used_at IS NULL` l.71), `auth.admin.getUserById` par user | none | non | none | **N+1** sur getUserById (l.52-55) |
| `/api/admin/organizations/[id]` (`[id]/route.ts:88`) | PATCH | `isAdmin` | W: `organizations.update` (l.167) | none | non | `client_type` whitelisté avec fallback sur valeur courante si invalide (l.140-147). **Trigger SQL** : `cascade_org_deactivation` bloque les users si `is_active true→false` (`20260416120000_user_soft_delete_and_blocking.sql:43-62`) | OK |
| `/api/admin/organizations/[id]/stats` (`stats/route.ts:9`) | GET | `isAdmin` | R: `organizations`; XML-RPC Odoo (`sale.order.search_count`) | none | non | none | OK |
| `/api/admin/organizations/[id]/articles` (`articles/route.ts:8`) | GET | `isAdmin` | R: `organizations.odoo_template_prefix`, `product_catalog` LIKE | none | non | none | OK |
| `/api/admin/organizations/[id]/notifications` (`notifications/route.ts:38`) | GET | `requireAdmin` (l.18-36) | R: `organizations`, `portal_clients`, `auth.admin.getUserById` | none | non | none | N+1 sur getUserById (l.76) |
| `/api/admin/organizations/[id]/notifications` (`notifications/route.ts:106`) | PATCH | `requireAdmin` | W: `organizations.update` notif fields (l.223) | none | non | validation mode + emails (l.143-184), garde-fou `custom_list` non vide (l.205) | Log applicatif (`l.243-249`) — pas de table audit |
| `/api/admin/organizations/[id]/notifications/test` (`test/route.ts:70`) | POST | `requireAdmin` | R: `organizations` | none | **OUI** : `sendEmail` pour chaque destinataire (l.151-167), sleep 200ms entre envois | validation override emails (l.110-122) | OK ; tag `rdv_notification_test` (l.156-160) |
| `/api/admin/organizations/[id]/custom-fields` (`custom-fields/route.ts:15`) | GET | `isAdmin` | R: `custom_fields`, `organization_custom_fields` | none | non | none | OK |
| `/api/admin/organizations/[id]/custom-fields` (`custom-fields/route.ts:82`) | PATCH | `isAdmin` | W: upsert `organization_custom_fields` (l.123) | none | non | `custom_field_id` requis (l.105) ; `active/required/position` typés | OK |
| `/api/admin/invitations` (`invitations/route.ts:8`) | GET | `isAdmin` | R: `invitations`, défaut `used_at IS NULL` sauf `?includeUsed=true` (l.20-30) | none | non | none | OK |
| `/api/admin/invitations/[id]` (`[id]/route.ts:8`) | DELETE | `isAdmin` | W: `invitations.delete` (l.47-50) | none | non | refuse si `used_at` non null (l.40-45) | OK |
| `/api/admin/invite` (`invite/route.ts:20`) | POST | `isAdmin` | R: `organizations`, `portal_clients` (détection soft-deleted) ; W: `invitations.insert` (l.116-126) | none | **OUI** : `sendEmail` invitation (l.197-202) | email regex (l.44) ; `client_type` whitelist (l.108-114) ; `expires_at = now+7j` (l.104-106) ; detect prior soft-deleted client via `email_bailleur` ilike (l.142-151) → warning `user_soft_deleted` | OK ; **smell** : lookup `email_bailleur` ne couvre pas un user qui aurait changé son email Supabase (la colonne portal_clients.email_bailleur est gelée au setup-account) — voir §F |
| `/api/admin/stats` (`stats/route.ts:8`) | GET | `isAdmin` | R: counts `organizations`, `portal_clients`, `invitations` | none | non | none | **Smell P2** : "Utilisateurs actifs" sur `/admin` (`src/app/admin/page.tsx:106`) compte en réalité TOUS les `portal_clients` y compris soft-deleted (l.23 : pas de filtre `deleted_at`) |
| `/api/admin/stats/portal-orders` (`stats/portal-orders/route.ts:24`) | GET | `isAdmin` | R: `organizations.is_active=true` ; XML-RPC Odoo `sale.order.search_read` 5000 lignes | none | non | none | Sleep 200 ms entre orgs ; long-running |
| `/api/admin/stats/missions-by-org` (`stats/missions-by-org/route.ts:17`) | GET | `isAdmin` | R: `organizations` ; XML-RPC `sale.order.search_count` + `search_read` 10000 lignes par org | none | non | none | Long-running ; séquentiel + sleep ; pas de timeout explicite (`maxDuration` absent) |
| `/api/admin/custom-fields` (`custom-fields/route.ts:11`) | GET | `isAdmin` | R: `custom_fields` | none | non | none | OK |
| `/api/admin/custom-fields` (`custom-fields/route.ts:43`) | POST | `isAdmin` | W: `custom_fields.insert` | none | non | label/field_key/field_type/mission_type/options validés (l.67-99) | OK |
| `/api/admin/custom-fields` (`custom-fields/route.ts:134`) | PATCH | `isAdmin` | W: `custom_fields.update` | none | non | id requis (l.151) | OK |
| `/api/admin/custom-fields` (`custom-fields/route.ts:245`) | DELETE | `isAdmin` | W: `organization_custom_fields.delete`, `custom_fields.delete` ; refuse si valeurs en BD (l.264-279) | none | non | none | OK |
| `/api/admin/custom-fields/activations` (`custom-fields/activations/route.ts:8`) | GET | `isAdmin` | R: `organizations`, `organization_custom_fields` | none | non | none | OK |

### Routes auth (utilisées par flow admin/invitation)

| Route | Méthode | Auth | Tables R/W | `auth.users` | Email | Notes |
|-------|---------|------|------------|--------------|-------|-------|
| `/api/auth/validate-token` (`validate-token/route.ts:6`) | GET | **publique** | R: `invitations` + join `organizations` (l.20-24) | none | non | Vérifie token, expiration, used_at (l.33-45) |
| `/api/auth/setup-account` (`setup-account/route.ts:28`) | POST | **publique** (token-gated) | R: `invitations`, `organizations`, `portal_clients` ; W: `portal_clients.upsert`, `invitations.update used_at` (l.234-256) | W: `createUser` ou `updateUserById{ban_duration:"none",password}` selon prior state (l.127-211) | non | Réactive un user soft-deleted via lookup `portal_clients.email_bailleur ilike invitation.email` (l.116-123). Refuse si email correspond à user actif non-banné (l.137-148, status 409). Auto sign-in après création (l.265-281). **Vérification** : V2 commit `098fcfa` |
| `/api/auth/register` (`register/route.ts:19`) | POST | **publique** (code-gated, **legacy**) | R: `invitations` ; W: `portal_clients.insert`, `invitations.update used_at` ; rollback `deleteUser` si `portal_clients.insert` échoue (l.103) | W: `createUser` (l.69-74), `deleteUser` rollback | non | **ROUTE ORPHELINE** — aucun callsite (`grep -rIn "api/auth/register" src/` → seul le log de la route elle-même). Utilise champ legacy `code` ; à supprimer |
| `/api/auth/me` (`me/route.ts:6`) | GET | `getUser` (non admin) | R: `portal_clients` (pas de filtre `deleted_at`) | none | non | Smell : un soft-deleted toujours actif sur auth retournerait son `client_type` ici |

---

## B. Lifecycle utilisateur (15 transitions)

Légende état : `BU`=`auth.users.banned_until`, `AD`=`auth.users.deleted_at`,
`PD`=`portal_clients.deleted_at`, `PB`=`portal_clients.blocked_at`.

| # | Transition | Route / UI | Mutation `auth.users` | Mutation `portal_clients` | Cohérence |
|---|------------|------------|----------------------|---------------------------|-----------|
| 1 | Création invitation admin | UI `/admin/organizations/[id]` → `POST /api/admin/invite` (`invite/route.ts:20`) | none | none | OK — n'écrit que dans `invitations` |
| 2 | Setup-account post-invite (compte neuf) | `/setup-account?token=` → `POST /api/auth/setup-account` (`setup-account/route.ts:192-211`) | `createUser({email,password,email_confirm:true})` | upsert ligne neuve | OK |
| 3 | Login normal | `/login` (`login/page.tsx:47-50`) `signInWithPassword` | maj `last_sign_in_at` côté Supabase | none | OK |
| 4 | Logout normal | `/admin/layout.tsx:108` ou client `signOut()` | termine session | none | OK |
| 5 | Reset password — demande | `/login` (`login/page.tsx:31-33`) `resetPasswordForEmail({redirectTo:.../reset-password})` | génère token PKCE | none | OK |
| 6 | Reset password — confirmation | `/reset-password` (`reset-password/page.tsx:43-92,135-137`) PKCE ou implicit puis `updateUser({password})` | maj `encrypted_password`, invalide ancienne session | none | **CASSÉ EN PROD** (Bug 2) — voir §G |
| 7 | Block | UI bouton "Bloquer" → `POST /api/admin/users/[id]/block` (`block/route.ts:8`) | `ban_duration:"876600h"` | `blocked_at/blocked_by` posés | OK |
| 8 | Unblock | UI bouton "Débloquer" → `POST /api/admin/users/[id]/unblock` (`unblock/route.ts:8`) | `ban_duration:"none"` | `blocked_at/blocked_by = NULL` (filtré `deleted_at IS NULL`) | OK |
| 9 | Soft-delete | UI bouton "Supprimer" sur actif → `POST /api/admin/users/[id]/soft-delete` (`soft-delete/route.ts:8`) | `ban_duration:"876600h"` (l.60-62) | `deleted_at/deleted_by` posés (l.35-44) | OK depuis V2 ; **legacy** : users soft-deleted avant `287c2d7` n'ont pas reçu le ban |
| 10 | Restore | **❌ AUCUNE ROUTE NI BOUTON** (`admin/users/page.tsx:220-222` rend "—" quand `deleted=true`) | n/a | n/a | **MANQUANT (Bug 3)** |
| 11 | Hard-delete | **❌ AUCUNE ROUTE** (`docs/ADMIN_USERS.md:104` confirme « hard delete non prévu »). L'UI affiche pourtant un bouton "Supprimer" sur un user déjà supprimé ? **NON** : `admin/users/page.tsx:220-222` rend juste "—" | n/a | n/a | Cohérent : pas d'UI, pas de route — mais P2 : doc et badge "Supprimé" laissent croire qu'il y a une 2ᵉ étape |
| 12 | Ré-invitation email soft-deleted | UI → `POST /api/admin/invite` détecte (`invite/route.ts:142-165`), retourne warning ; user clique lien → `POST /api/auth/setup-account` lifte le ban + reset password + upsert `portal_clients` avec `deleted_at=null` (`setup-account/route.ts:170-191,228-232`) | `ban_duration:"none"` + nouveau password | `deleted_at=null`, nouveau `organization_id` (l.214-232) | OK depuis V2 (`098fcfa`) |
| 13 | Ré-invitation email banned (jamais soft-deleted) | `POST /api/admin/invite` — pas de détection « banned » spécifique (l.142-151 cherche `deleted_at IS NOT NULL`). Le clic sur lien atterrit dans `setup-account` qui détecte `isBanned` (l.133-135) ; si `priorUser` existe et est banni mais `priorClient.deleted_at` est null → branche `if (priorUser && !isBanned && deleted_at===null)` est faux → branche `else` (l.170-191) lifte le ban et reset password | `ban_duration:"none"` + nouveau password | `deleted_at=null`, upsert | OK |
| 14 | Login d'un user soft-deleted | `signInWithPassword` côté Supabase. **Depuis V2** : `banned_until` posé → Supabase Auth refuse. **Avant V2** : `banned_until` nul (soft-delete antérieur à `287c2d7`) → login réussit. Le middleware (`src/lib/supabase/middleware.ts:101-105`) lit `portal_clients` sans filtre `deleted_at` → l'utilisateur peut accéder /dashboard (l'org-suspension check passe si l'org est active) | none | none | **INCOHÉRENT POUR LE LEGACY (Bug P0)** |
| 15 | Login d'un user banned | `signInWithPassword` rejette ; le `getUser()` dans middleware renverra `null` ; redirige `/login` ou retourne 401 selon path | none | none | OK |

---

## C. Table de vérité des états

`BU = banned_until` (null / future), `AD = auth.deleted_at` (jamais set par le
code en lecture seule audité, donc toujours null), `PD = portal_clients.deleted_at`,
`PB = portal_clients.blocked_at`. Reachable = combinaison atteignable par les
transitions ci-dessus.

| # | BU | AD | PD | PB | Badge UI (`admin/users/page.tsx:198-216`) | Reachable | Login auth | Middleware HTML | Reset pw | Cohérent |
|---|----|----|----|----|-------------------------------------------|-----------|------------|------------------|----------|----------|
| 1 | null | null | null | null | **Actif** | ✅ (état initial post setup-account) | ✅ | passe | ✅ | OK |
| 2 | null | null | null | set | Bloqué (via `blocked_at`) | ✅ partiel — cascade trigger (`migration:43-62`) si org devient `is_active=false`, **sans toucher BU** | ✅ (auth ne bannit pas) | passe — mais org-suspendue détectée → `/account-suspended` | ✅ | **INCOHÉRENT P1** : login auth OK mais UI dit "Bloqué" |
| 3 | future | null | null | null | Bloqué (via `is_banned`) | ✅ (race/legacy : un user banni avant migration `blocked_at`) | ❌ | (n/a, getUser=null) | ❌ | OK |
| 4 | future | null | null | set | Bloqué | ✅ (sortie standard de `/block` route) | ❌ | (n/a) | ❌ | OK |
| 5 | null | null | set | null | **Supprimé** | ✅ (legacy : soft-delete antérieur à `287c2d7`) | ✅ ⚠️ | passe (middleware ignore `portal_clients.deleted_at`) | ✅ ⚠️ | **INCOHÉRENT P0** |
| 6 | null | null | set | set | Supprimé | ✅ (legacy cascade puis legacy soft-delete) | ✅ ⚠️ | passe | ✅ ⚠️ | **INCOHÉRENT P0** |
| 7 | future | null | set | null | Supprimé | ✅ (état standard post-V2 soft-delete) | ❌ | (n/a) | ❌ | OK |
| 8 | future | null | set | set | Supprimé | ✅ rare (block puis delete sans clear) | ❌ | (n/a) | ❌ | OK |
| 9 | null | set | * | * | n/a — pas géré par UI (`is_banned` calculé seulement sur BU) | ❌ pas atteignable par les routes audit | n/a | n/a | n/a | Hors scope ; à laisser tel quel |
| 10-16 | combinaisons impliquant AD set | — | — | — | — | ❌ jamais atteint par code admin (aucune route ne `deleteUser`) | — | — | — | impossibles via code admin actuel |

**Combinaisons impossibles à atteindre via le code actuel** : toute ligne avec
`AD` (auth.users.deleted_at) non-nul.
`/api/auth/register/route.ts:103` appelle `admin.auth.admin.deleteUser` mais
seulement en rollback de l'insert portal_clients raté, et cette route est
orpheline (§A).

**Combinaisons possibles mais incohérentes** : lignes 2, 5, 6 ci-dessus.

---

## D. Routes UI admin

Tous les fichiers sous `src/app/admin/*` sont des Client Components (`"use client"`).
Le check admin server-side est délégué aux API routes ; il n'y a aucun garde
server-side sur les pages elles-mêmes.

| Page | File | Composant | Auth | Données fetched | Actions |
|------|------|-----------|------|------------------|---------|
| `/admin` | `src/app/admin/page.tsx:58` | Client | check via layout | `GET /api/admin/stats`, `GET /api/admin/stats/portal-orders` | navigation seulement |
| Layout `/admin/*` | `src/app/admin/layout.tsx:17` | Client | `supabase.auth.getUser()` + comparaison `ADMIN_EMAILS_PUBLIC` (l.37-43) — **NEXT_PUBLIC_ADMIN_EMAIL** singleton (l.8-10) | aucun | bouton Déconnexion (l.105-114) |
| `/admin/organizations` | `src/app/admin/organizations/page.tsx:16` | Client | via layout | `GET /api/admin/organizations`, `GET /api/admin/stats/missions-by-org` | Créer org (POST), naviguer |
| `/admin/organizations/[id]` | `src/app/admin/organizations/[id]/page.tsx:76` | Client | via layout | `GET /api/admin/organizations/[id]`, `articles`, `stats` | Modifier org (PATCH), toggle is_active, inviter, annuler invitation (DELETE), bloquer/débloquer/supprimer user (POST) — tous via `AlertDialog` (l.1106-1163) |
| `/admin/organizations/[id]` tab "Custom fields" | `CustomFieldsTab.tsx` | Client | via layout | `GET /api/admin/organizations/[id]/custom-fields` | PATCH activations |
| `/admin/organizations/[id]` tab "Notifications" | `NotificationsTab.tsx` | Client | via layout | `GET /api/admin/organizations/[id]/notifications` | PATCH config + POST test (`.../notifications/test`) |
| `/admin/users` | `src/app/admin/users/page.tsx:38` | Client | via layout | `GET /api/admin/users` | Bloquer / Débloquer / Supprimer — **PAS de bouton Restaurer ni Hard-delete** (l.218-258) |
| `/admin/custom-fields` | `src/app/admin/custom-fields/page.tsx:60` | Client | via layout | `GET /api/admin/custom-fields`, `activations` | CRUD champs |

États visuels :
- Loading : `animate-pulse` (`users/page.tsx:129`, etc.)
- Error : div rouge `bg-red-50 text-red-600` (`users/page.tsx:121`)
- Success : `toast.success/error` via `@/lib/toast` (sonner)

---

## E. RLS et permissions admin

### Policies RLS (Supabase) qui mentionnent un check admin

**Aucune.** Les policies inventoriées dans `supabase/migrations/*.sql` ne
réfèrent jamais le JWT `email` ni un rôle "admin". L'accès admin est garanti
*uniquement* par l'usage du `SUPABASE_SERVICE_ROLE_KEY` (qui bypass RLS) dans
`createAdminClient()` (`src/lib/supabase/admin.ts:4-9`).

### Routes utilisant `createAdminClient()` (service-role bypass RLS)

(Voir aussi le grep complet exécuté pendant l'audit.) Côté admin :

- Toutes les routes `/api/admin/*` listées en §A.
- `/api/auth/setup-account` (`setup-account/route.ts:82`).
- `/api/auth/register` (`register/route.ts:43`) — orpheline.
- `/api/auth/validate-token` (`validate-token/route.ts:18`).

Côté non-admin (à signaler car élargit la surface) :
- `/api/odoo/orders`, `/api/drafts`, `/api/messages/*`, `/api/rdv-custom-values`,
  `/api/agency/price-catalog`, `/api/submit-rdv`, `/api/dactylo/*` — voir
  `grep` complet exécuté. Toutes appliquent un check d'autorisation
  équivalent en code avant l'usage.

### Cohérence admin check server-side vs `ADMIN_EMAILS`

- **Server-side** : `src/lib/admin.ts:18-21` lit `process.env.ADMIN_EMAILS`
  (comma-separated, normalisé lowercase). Fallback hardcodé : `n.rommiee@axis-experts.be`.
- **Client-side** (layout admin) : `src/app/admin/layout.tsx:8-10` lit
  `process.env.NEXT_PUBLIC_ADMIN_EMAIL` — **singleton** (pas comma-separated).
  Fallback hardcodé identique.
- **Middleware** : utilise `isAdmin(user.email)` (server, donc `ADMIN_EMAILS`).

⇒ **Bug P1** : si plusieurs admins sont configurés en `ADMIN_EMAILS` mais que
`NEXT_PUBLIC_ADMIN_EMAIL` n'en contient qu'un seul (par exemple le primaire),
un admin secondaire :
1. middleware le reconnaît admin → redirige `/` ou `/dashboard` vers `/admin`
   (`src/lib/supabase/middleware.ts:60-72`)
2. layout admin (client) ne le reconnaît pas → `router.replace("/dashboard")`
   (`src/app/admin/layout.tsx:41`)
3. middleware redirige à nouveau vers `/admin` → **boucle de redirection
   infinie**

---

## F. Flow d'invitation détaillé

### Génération du token

- Table `invitations` (`supabase/migrations/invitations_v2.sql:13-23`) :
  - `token UUID DEFAULT gen_random_uuid()`, `NOT NULL UNIQUE`
  - `expires_at TIMESTAMPTZ NOT NULL`
  - `used_at TIMESTAMPTZ NULL`
- TTL : 7 jours (`src/app/api/admin/invite/route.ts:9` `INVITE_TTL_DAYS = 7`,
  l.104-106).
- Génération automatique par le default Postgres `gen_random_uuid()`. L'API
  ne reçoit pas le token avant l'insert.

### Email envoyé

- Sender : `Axis Experts <noreply@axis-experts.be>` (`src/lib/email.ts:15`).
- Template inline (HTML+text) dans `invite/route.ts:175-195`. Bouton "Créer
  mon compte" pointe vers `/setup-account?token=...`.
- Origin résolu via `NEXT_PUBLIC_SITE_URL` puis fallback `new URL(request.url).origin`
  (`invite/route.ts:168-170`).
- En cas d'échec Resend (`emailResult.success === false`), l'invitation reste
  en base ; la réponse renvoie `invite_url` pour copie manuelle (l.204-211).

### Validation côté client

- `/setup-account?token=...` (`src/app/setup-account/page.tsx:36-67`) appelle
  `GET /api/auth/validate-token`.
- API check : token existe, `used_at IS NULL`, `expires_at > now()`
  (`validate-token/route.ts:33-45`).

### Création du compte

- `POST /api/auth/setup-account` (`setup-account/route.ts:28`) :
  1. Re-validation token + expires + used_at (l.85-98, idempotent).
  2. Lookup `priorClient` via `portal_clients.email_bailleur ilike invitation.email`
     (l.116-123) — **non scoped par organisation**, cross-org.
  3. Branchement :
     - Si `priorClient.user_id` existe en `auth.users` ET pas banni ET non soft-deleted → **409** "compte actif" (l.137-148).
     - Si `priorClient.user_id` n'existe plus en `auth.users` → `createUser` (l.150-169).
     - Sinon (priorUser banni ou priorClient soft-deleted) → `updateUserById({ban_duration:"none",password})` (l.170-191).
     - Si pas de `priorClient` → `createUser` fresh (l.192-211).
  4. Upsert `portal_clients` `onConflict:user_id` (l.234-238). Reset
     explicite de `deleted_at/deleted_by/blocked_at/blocked_by` (l.228-231).
  5. Mark invitation `used_at = NOW()` (l.252-256). Erreur silencieuse si KO (l.257-262).
  6. Auto sign-in côté server (l.265-281).

### Cas particuliers vérifiés

| Cas | Comportement code | OK ? |
|-----|-------------------|------|
| Email actif existant | Refus 409 (l.137-148) | OK |
| Email banni (jamais soft-deleted) | Branche reactivate (l.170-191) | OK |
| Email soft-deleted | Branche reactivate + upsert avec `deleted_at=null` | OK |
| Email avec portal_clients orphelin (auth.users disparu) | Branche createUser dans `if priorClient` (l.150-169) | OK |
| Invitation expirée | 400 dans validate-token + dans setup-account (l.85-91, double check) | OK |
| Invitation déjà utilisée | 400 dans les deux routes | OK |
| Token forgé / invalide | 400 (maybeSingle → null) | OK |
| **Email scopé à une autre org** | Lookup `email_bailleur ilike invitation.email` (`setup-account/route.ts:120`) renvoie le PREMIER soft-deleted toutes orgs confondues (`order created_at DESC, limit 1`). L'upsert remplace `organization_id` par celui de la nouvelle invitation (l.223). | **OK fonctionnellement** mais **smell P2** : pas de check `previous org == new org` ; le warning UI annonce le rattachement correctement (`invite/route.ts:142-165`, `org/[id]/page.tsx:1042-1066`). |
| **Email modifié dans auth.users après setup** | `portal_clients.email_bailleur` reste gelé à la valeur d'invitation. Une ré-invitation à la NOUVELLE adresse ne retrouvera pas le `priorClient` → un nouveau user/portal_clients est créé, l'ancien orphelin reste en base. | **Bug P1** mais cas très marginal. |

### Smells

- L'erreur `markError` (l.257) est juste loguée, jamais remontée — une
  invitation pourrait être consommée plusieurs fois en cas d'écriture en
  panique entre l'upsert et le mark.

---

## G. Confirmation des 3 bugs connus

### Bug 1 — Soft-delete incomplet : **CODE CORRIGÉ, DATA HÉRITÉE NON BACKFILLÉE**

Le mission brief affirme que `POST /api/admin/users/[id]/soft-delete` "ne
touche pas `auth.users.banned_until`".

**Vérification code** : `src/app/api/admin/users/[id]/soft-delete/route.ts:60-67`

```ts
const { error: banError } = await admin.auth.admin.updateUserById(userId, {
  ban_duration: "876600h",
});
```

→ Le ban EST appliqué. Le bug a été corrigé en V1 (commit `287c2d7` "feat(chantier-1): soft-delete users + block traçable + cascade org").

**Conséquence à investiguer hors repo** : les utilisateurs soft-deleted
*avant* l'application de la migration `20260416120000` ont leur
`portal_clients.deleted_at` posé mais **pas** leur `auth.users.banned_until`.
Ces lignes :
- ne sont plus visibles dans `/admin/users` ? **SI** — la requête (`/api/admin/users/route.ts:24-30`) liste TOUS les portal_clients ; le frontend les rend avec le badge "Supprimé" sans action (cf. §B-9). Donc visibles.
- Mais peuvent toujours se connecter (`auth.signInWithPassword` autorisée) — voir Table C ligne 5.

**Recommandation V2.5** : SQL backfill exécuté en one-shot via Supabase
SQL Editor :

```sql
-- À vérifier hors repo : compte d'utilisateurs concernés
SELECT au.id, au.email, pc.deleted_at, au.banned_until
FROM auth.users au
JOIN portal_clients pc ON pc.user_id = au.id
WHERE pc.deleted_at IS NOT NULL
  AND (au.banned_until IS NULL OR au.banned_until < NOW());

-- Backfill (à valider avant exécution)
-- Note : `auth.admin.updateUserById` ne s'écrit pas en SQL direct ;
-- préférer une Edge Function qui itère sur la liste ci-dessus.
```

### Bug 2 — Reset password "Auth session missing!" : **CAUSE PROBABLE IDENTIFIÉE**

**Code lu** :
- `src/app/reset-password/page.tsx:21-36` : capture synchrone des params URL.
- `src/app/reset-password/page.tsx:43-92` : `exchangeCodeForSession` (PKCE) ou `setSession` (implicit) ; en cas d'échec, fallback `getSession()`.
- `src/app/reset-password/page.tsx:135-137` : `supabase.auth.updateUser({password})`.
- `src/lib/supabase/middleware.ts:30-34` : bypass auth check sur `/reset-password` (préserve le `?code=`).
- `src/lib/supabase/client.ts:3-8` : `createBrowserClient` sans option `flowType` ni `detectSessionInUrl=false` — donc auto-detection activée par défaut.

**Analyse** :
1. La page anticipe correctement la double-consommation (auto-detect puis useEffect re-exchange) via le fallback `getSession()` aux lignes 50-58 et 75-83.
2. **MAIS** : la PKCE flow stocke un `code_verifier` dans `localStorage` au
   moment de `resetPasswordForEmail` (`login/page.tsx:31-33`). Si l'utilisateur
   ouvre le lien email sur **un autre device ou un autre navigateur** que
   celui où il a cliqué "Mot de passe oublié", le `code_verifier` est absent
   → `exchangeCodeForSession` échoue silencieusement → fallback `getSession()`
   retourne `null` (puisque rien n'a été échangé) → branche "Le lien a expiré"
   à l.60-64.
3. L'erreur reportée par l'utilisateur ("Auth session missing!") n'est **pas**
   celle de la branche ci-dessus. C'est celle remontée par `auth.updateUser`
   (l.139-140) quand aucune session locale n'existe. Cela indique que la
   page est passée à `sessionReady=true` mais que la session n'a pas été
   réellement persistée. Cas plausible : `auto-detection` lit le `?code=` et
   tente l'exchange en arrière-plan, mais celui-ci échoue (verifier manquant
   ou code déjà consommé par un click précédent) → `getSession()` retourne
   tout de même `null` au check ; sauf si un *autre* utilisateur est déjà
   loggué dans le même navigateur, auquel cas `getSession` retourne une
   session **étrangère** et l'on procède à `updateUser` qui ne trouve pas la
   session recovery. Hypothèse alternative : timing entre `setSession` (l.69)
   et lecture des cookies par le serveur → `supabase.auth.updateUser` côté
   browser-client utilise les cookies remis à jour de manière asynchrone.

**Recommandation V2.5** : migrer le flow vers un route handler server-side :

```
GET /auth/callback?code=...  →  exchangeCodeForSession  →  Set-Cookie  →  redirect /reset-password
```

C'est le pattern officiel `@supabase/ssr` (cf. doc Supabase ; voir aussi
`node_modules/next/dist/docs/` pour Next.js 16 routing). La page
`/reset-password` ne ferait plus que le `updateUser` une fois le cookie posé.

### Bug 3 — Restore manquant : **CONFIRMÉ**

- Aucune route `/api/admin/users/[id]/restore` (`ls src/app/api/admin/users/[id]/` →
  `block/`, `soft-delete/`, `unblock/` seulement).
- Aucun bouton "Restaurer" / "Réactiver" :
  - `src/app/admin/users/page.tsx:220-222` : `{deleted ? <span>—</span> : ...}`
  - `src/app/admin/organizations/[id]/page.tsx:825-826` : idem (`{deleted ? <span>—</span> : ...}`).
- `docs/ADMIN_USERS.md:104` documente explicitement "Hard delete des users
  (non prévu)" — la restauration n'est pas mentionnée non plus.

**Workaround actuel** : ré-inviter l'email via l'UI org-detail. Le flow
soft-deleted reactivation (`setup-account/route.ts:170-191`) couvre ce cas
mais nécessite un email envoyé + clic utilisateur + reset password.

**Recommandation V2.5** : ajouter `POST /api/admin/users/[id]/restore` :

```ts
// pseudo
await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
await admin
  .from("portal_clients")
  .update({ deleted_at: null, deleted_by: null, blocked_at: null, blocked_by: null })
  .eq("user_id", userId);
```

+ bouton UI conditionnel sur `deleted_at !== null`.

---

## H. Custom fields (référence courte)

Audit E2E déjà conduit en V2 : `docs/CUSTOM_FIELDS_E2E.md`. Lecture rapide :

- Bibliothèque globale (`custom_fields`) + activation par org
  (`organization_custom_fields`) + valeurs par RDV (`rdv_custom_values`).
- Migration : `supabase/migrations/0010_custom_fields.sql` (seed Everecity).
- API admin : `/api/admin/custom-fields` (CRUD) +
  `/api/admin/custom-fields/activations` (lecture) +
  `/api/admin/organizations/[id]/custom-fields` (activation par org).
- RLS : SELECT public sur `custom_fields`, scope org sur les deux autres
  (lignes 56-101 de la migration).
- UI : `/admin/custom-fields` (page globale) + onglet "Champs personnalisés"
  par org.
- **Rien n'a changé** depuis le dernier audit hormis le commit `6920943`
  (whitelist `custom_field_id` + `order_ref` côté `/api/rdv-custom-values`)
  qui touche le côté client, pas le module admin.

---

## I. Notifications / Emails transactionnels

| Email | Déclencheur | Template | Destinataire(s) | Source |
|-------|-------------|----------|------------------|--------|
| Invitation admin | `POST /api/admin/invite` | HTML inline (`invite/route.ts:175-195`) | invité | Resend `sendEmail` |
| Test notifications RDV | `POST /api/admin/organizations/[id]/notifications/test` | HTML inline (`test/route.ts:34-68`) | `resolveNotificationRecipients` ou override | Resend, sleep 200 ms, tag `rdv_notification_test` |
| Notification RDV réel | `POST /api/submit-rdv` (l.900, 1026) | externe | destinataires org | Resend |
| Reminder RDV | `/api/cron/check-rdv-notifications` (l.323) | externe | destinataires org | Resend |
| Reset password | `supabase.auth.resetPasswordForEmail` (l.31 `login/page.tsx`) | template Supabase | demandeur | **Resend non utilisé** : SMTP Supabase |

**Rate-limit Resend** : géré par défaut Resend (à vérifier hors repo dans le
dashboard Resend, plan + DKIM `axis-experts.be`).

**Logging** : `console.log("[email] sent:", id, subject)` (`src/lib/email.ts:45`)
+ `[admin] org ... notifications updated by ...` (`notifications/route.ts:243`).
**Pas de table audit** ; les logs vivent dans Vercel.

**Pas d'email automatique** lors d'un block / soft-delete d'un user (cf.
`docs/ADMIN_USERS.md:109` : "Notification email du user lorsqu'il est bloqué
ou supprimé" listé en hors-scope).

---

## J. Bugs identifiés (P0/P1/P2)

### P0

**P0-1 — Users soft-deleted antérieurs au commit `287c2d7` peuvent toujours
se connecter**
- Fichiers : `src/app/api/admin/users/[id]/soft-delete/route.ts:60-62` (code corrigé) ;
  `src/lib/supabase/middleware.ts:101-105` (pas de filtre `deleted_at`).
- Impact : utilisateurs supposément supprimés conservent un accès complet au
  dashboard tant qu'ils ont leur ancien password.
- Correction proposée : backfill SQL/Edge Function (cf. §G-1) + ajouter une
  guard côté middleware : si `portal_clients.deleted_at IS NOT NULL` →
  redirect `/account-suspended` ou 403.
- Effort : 1 h (backfill) + 2 h (guard middleware + tests).

**P0-2 — Reset password "Auth session missing"**
- Fichier : `src/app/reset-password/page.tsx:135-137` (`updateUser` sans
  session valide), `src/lib/supabase/client.ts:3-8` (config browser client
  non explicite sur `flowType`).
- Impact : utilisateurs ne peuvent pas réinitialiser leur mot de passe ;
  workaround = créer un nouveau lien dans la même session, même device.
- Correction proposée : migrer vers route handler server-side
  `/auth/callback` qui exchange le code + pose le cookie session (cf. §G-2).
- Effort : 4 h.

**P0-3 — Restore manquant**
- Fichiers : aucun. UI : `src/app/admin/users/page.tsx:220-222`,
  `src/app/admin/organizations/[id]/page.tsx:825-826`.
- Impact : action irréversible côté admin ; obligation de passer par
  la ré-invitation (email + clic + reset pwd) pour réactiver un compte.
- Correction proposée : route + bouton (cf. §G-3).
- Effort : 3 h.

### P1

**P1-1 — Discordance `ADMIN_EMAILS` (server, liste) vs `NEXT_PUBLIC_ADMIN_EMAIL`
(client, singleton)**
- Fichiers : `src/lib/admin.ts:9`, `src/app/admin/layout.tsx:8-10`.
- Impact : boucle infinie de redirection `/admin` ⇄ `/dashboard` pour un
  admin secondaire (cf. §E).
- Correction : soit retirer le check client-side du layout (le middleware
  suffit pour rediriger), soit normaliser
  `NEXT_PUBLIC_ADMIN_EMAILS` (pluriel, comma-separated) et l'utiliser
  côté client.
- Effort : 1 h.

**P1-2 — Route `/api/auth/register` orpheline et utilise un schéma legacy
(`invitations.code`)**
- Fichier : `src/app/api/auth/register/route.ts:19-147`.
- Vérif callsite : `grep -rIn "api/auth/register" src/` → seul le log de la
  route elle-même.
- Impact : surface d'attaque inutile, schéma `invitations.code` (legacy avant
  V2 token UUID) ; le `deleteUser` rollback (l.103) crée un risque si la
  route était réintroduite par erreur.
- Correction : supprimer la route + le dossier.
- Effort : 30 min.

**P1-3 — Cascade `org.is_active=false` bloque applicativement sans bannir
`auth.users`**
- Fichier : `supabase/migrations/20260416120000_user_soft_delete_and_blocking.sql:43-62`.
- Impact : un user dont l'org est désactivée peut toujours obtenir une
  session Supabase. Le middleware bloque l'accès HTML via la check
  `org.is_active` (`src/lib/supabase/middleware.ts:111-128`), mais
  - une session active reste utilisable côté Supabase Realtime / Storage /
    Edge functions custom hors couverture middleware ;
  - le user reste loggué tant qu'il ne se déconnecte pas (le ban auth
    aurait invalidé les sessions immédiatement).
- Correction : remplacer le trigger SQL par un appel `auth.admin.updateUserById`
  côté API (par exemple via l'endpoint qui toggle `is_active`).
- Effort : 3 h.

**P1-4 — N+1 sur `auth.admin.getUserById` dans les listes admin**
- Fichiers : `src/app/api/admin/users/route.ts:40-42`,
  `src/app/api/admin/organizations/[id]/route.ts:52-55`,
  `src/app/api/admin/organizations/[id]/notifications/route.ts:73-79`,
  `src/lib/notification-recipients.ts:40-46`.
- Impact : latence linéaire avec le nombre de users ; un GET /api/admin/users
  pour 100 users = 100 appels admin API. À surveiller en croissance.
- Correction : préférer `auth.admin.listUsers({perPage: 1000})` et faire
  un join in-memory.
- Effort : 2 h.

**P1-5 — Lookup `email_bailleur ilike` non scoped par org**
- Fichier : `src/app/api/auth/setup-account/route.ts:116-123`.
- Impact : si un même email a deux portal_clients (rare mais possible si
  collisions historiques), le plus récent gagne et l'autre devient orphelin
  (toujours `deleted_at IS NULL` éventuellement).
- Correction : utiliser `auth.admin.listUsers` ou `auth.admin.getUserByEmail`
  pour identifier l'identité auth, puis lookup `portal_clients` par
  `user_id` ; sinon ajouter `eq("organization_id", invitation.organization_id)`
  (mais ça casse le cross-org reactivation voulu §F).
- Effort : 2 h ; nécessite décision produit.

**P1-6 — Aucun audit trail base**
- Fichier : aucun. Logs uniquement (`console.log("[admin] ...")` éparpillés).
- Impact : impossible de retracer "qui a bloqué qui et quand" depuis l'UI
  ou un dashboard. `deleted_by` / `blocked_by` sur `portal_clients` couvrent
  partiellement, mais block→unblock écrase ces champs.
- Correction : créer une table `admin_audit_log(action, target_user_id,
  actor_user_id, payload jsonb, created_at)` et logger depuis chaque route
  d'écriture admin.
- Effort : 4 h.

### P2

**P2-1 — Hard-delete inexistant alors que la doc admin laisse imaginer une
seconde étape**
- Fichier : `docs/ADMIN_USERS.md:104` ("Hard delete des users (non prévu)"),
  `src/app/admin/users/page.tsx:220-222`.
- Impact : confusion utilisateur ; aucun moyen RGPD-compliant d'effacer
  réellement un utilisateur.
- Correction : soit assumer le no-hard-delete et expliciter l'anonymisation,
  soit ajouter une route + UI.
- Effort : 4 h.

**P2-2 — `/admin/stats` "Utilisateurs actifs" compte aussi les soft-deleted**
- Fichier : `src/app/api/admin/stats/route.ts:23` — `count` sans filtre
  `deleted_at`. Label UI : "Utilisateurs actifs" (`src/app/admin/page.tsx:106`).
- Impact : stat fausse, augmente l'incertitude reporting.
- Correction : `.is("deleted_at", null)` sur le count.
- Effort : 15 min.

**P2-3 — Validation password incohérente entre flows**
- `reset-password/page.tsx:122` : `password.length < 6` → erreur.
- `setup-account/page.tsx:73` + `api/auth/setup-account/route.ts:48` :
  `password.length < 8`.
- Impact : on permet un mot de passe à 6 caractères au reset mais 8 caractères
  au setup. Régression UX et sécurité.
- Correction : aligner sur 8 (ou plus).
- Effort : 15 min.

**P2-4 — Pas de purge auto invitations**
- Fichier : `supabase/migrations/20260416120000_user_soft_delete_and_blocking.sql:65-83`
  documente le `cron.schedule` mais n'est pas exécuté automatiquement.
- Impact : croissance illimitée de `invitations` ; pas de problème opérationnel
  immédiat (index UUID + email).
- Correction : exécuter `cron.schedule` (hors repo) ou Edge Function
  scheduled.
- Effort : 1 h.

**P2-5 — `client_type` org peut être conservé invalide via PATCH**
- Fichier : `src/app/api/admin/organizations/[id]/route.ts:140-147`.
- Comportement : si `body.client_type` est une string mais ne fait pas partie
  des valeurs autorisées, on conserve la valeur existante ; pas d'erreur 400.
- Impact : surprise UX (la valeur tapée est silencieusement ignorée).
- Correction : retourner 400 pour `client_type` invalide.
- Effort : 15 min.

**P2-6 — `markError` invitation silencieux**
- Fichier : `src/app/api/auth/setup-account/route.ts:252-262`.
- Impact : si la mise à jour `used_at` échoue, la même invitation peut
  potentiellement être consommée plusieurs fois.
- Correction : remonter l'erreur ou wrap dans une transaction logique.
- Effort : 30 min.

---

## K. Recommandations V2.5 (plan ordonné)

| Ordre | Item | Section | Effort cumulé | Pourquoi en premier |
|-------|------|---------|---------------|---------------------|
| 1 | Backfill SQL ban des soft-deleted antérieurs (P0-1) | §G-1, §J-P0-1 | 1 h | Sécurité immédiate ; risque actif en prod |
| 2 | Guard middleware sur `portal_clients.deleted_at` (P0-1) | §J-P0-1 | 3 h | Filet de sûreté si backfill incomplet |
| 3 | Aligner ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAIL (P1-1) | §E | 4 h | Évite boucle de redirection lorsqu'on ajoute des admins |
| 4 | Ajouter `POST /api/admin/users/[id]/restore` + UI (P0-3) | §G-3, §J-P0-3 | 7 h | Renverse le verrou opérationnel V2 |
| 5 | Migrer reset-password vers `/auth/callback` server-side (P0-2) | §G-2, §J-P0-2 | 11 h | Bug bloquant remonté par l'utilisateur final |
| 6 | Supprimer `/api/auth/register` (P1-2) | §A, §J-P1-2 | 11.5 h | Hygiène ; risque zéro |
| 7 | Bannir auth.users dans la cascade org (P1-3) | §J-P1-3 | 14.5 h | Cohérence org-désactivée |
| 8 | Audit trail admin_audit_log (P1-6) | §J-P1-6 | 18.5 h | Traçabilité requise pour growth |
| 9 | Stats fix + validation password + markError + client_type 400 (P2-2,3,5,6) | §J-P2 | 19.5 h | Cleanup |
| 10 | N+1 listUsers (P1-4) | §J-P1-4 | 21.5 h | Performance ; tant que < 200 users non urgent |

---

## Hors scope / À vérifier hors repo

- Présence en prod (Supabase SQL) d'utilisateurs `portal_clients.deleted_at IS NOT NULL`
  ET `auth.users.banned_until IS NULL OR < NOW()` — query fournie §G-1.
- Plan Resend (rate-limit emails transactionnels) et DKIM `axis-experts.be`.
- Variables d'env Vercel : `ADMIN_EMAILS`, `NEXT_PUBLIC_ADMIN_EMAIL`,
  `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` —
  pas auditable depuis le repo.
- État du cron `purge-invitations-used` (`pg_cron` extension) — à vérifier
  dans Supabase Dashboard.
- Reproduction du bug 2 (Auth session missing) : test E2E avec un email
  réinitialisé depuis un device A puis cliqué depuis un device B (la
  cause probable du PKCE flow cross-device).
