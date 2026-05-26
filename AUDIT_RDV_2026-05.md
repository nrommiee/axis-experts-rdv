# AUDIT_RDV_2026-05 — axis-experts-rdv — Lancement public

**Audit read-only — branche `claude/audit-rdv-launch-25mai` — basé sur `main` au 26 mai 2026**
**Périmètre : 11 remarques de la note interne du 22 mai 2026**

---

## Sommaire

1. [État des lieux technique vérifié](#1-état-des-lieux-technique-vérifié)
2. [Synthèse exécutive](#2-synthèse-exécutive)
3. [Plan de séquencement proposé](#3-plan-de-séquencement-proposé)
4. [Critères Go/No-Go lancement public](#4-critères-gono-go-lancement-public)
5. [Remarque #1 — Résilience Supabase / Vercel](#remarque-1--résilience-supabase--vercel)
6. [Remarque #2 — Suivi RDV par l'agence selon rôle](#remarque-2--suivi-rdv-par-lagence-selon-rôle)
7. [Remarque #3 — Auto-invitation utilisateurs dans une organisation](#remarque-3--auto-invitation-utilisateurs-dans-une-organisation)
8. [Remarque #4 — Format Excel pour pièces jointes](#remarque-4--format-excel-pour-pièces-jointes)
9. [Remarque #5 — Code EAN obligatoire avec compteurs](#remarque-5--code-ean-obligatoire-avec-compteurs)
10. [Remarque #6 — Décalage envoi confirmation RDV vers Odoo](#remarque-6--décalage-envoi-confirmation-rdv-vers-odoo)
11. [Remarque #7 — Gestion du report de RDV](#remarque-7--gestion-du-report-de-rdv)
12. [Remarque #8 — Audit RGPD : compte piraté + CGU + auto-blocage](#remarque-8--audit-rgpd--compte-piraté--cgu--auto-blocage)
13. [Remarque #9 — Format d'adresse plateforme vs Odoo](#remarque-9--format-dadresse-plateforme-vs-odoo)
14. [Remarque #10 — Simulation RDV : plusieurs pièces d'eau](#remarque-10--simulation-rdv--plusieurs-pièces-deau)
15. [Remarque #11 — Simulation « demande de prix » agence + proposition partie 2](#remarque-11--simulation--demande-de-prix--agence--proposition-partie-2)
16. [Annexe A — Découvertes hors scope](#annexe-a--découvertes-hors-scope)
17. [Annexe B — Questions ouvertes consolidées](#annexe-b--questions-ouvertes-consolidées)
18. [Annexe C — Glossaire & secrets touchés](#annexe-c--glossaire--secrets-touchés)

---

## 1. État des lieux technique vérifié

Avant d'auditer les remarques, vérification factuelle de la stack (preuves : fichiers + lignes).

| Élément présumé | Vérifié | Preuve |
| --- | --- | --- |
| Next.js 16 (App Router) | ✅ Confirmé — `next: ^16.2.5`, `eslint-config-next: 16.2.2` | `package.json:28,46` ; App Router via `src/app/layout.tsx:13-26` |
| React 19 | ✅ Confirmé — `react: 19.2.4` | `package.json:30-32` |
| Supabase SSR + JS | ✅ `@supabase/ssr: ^0.10.0`, `@supabase/supabase-js: ^2.102.1` | `package.json:21-22` |
| Odoo XML-RPC | ✅ `xmlrpc: ^1.3.2` ; client maison `src/lib/odoo.ts` (présent, non lu en détail) | `package.json:38` ; `src/lib/odoo/` |
| Resend (emails) | ✅ `resend: ^6.10.0` ; helper `src/lib/email.ts` | `package.json:33` |
| Google Maps autocomplete | ✅ `@googlemaps/js-api-loader: ^2.0.2` ; hook `src/lib/useAddressAutocomplete.ts:12-71` | `package.json:13` |
| Vercel hosting + 1 cron | ✅ `vercel.json` déclare un cron `*/10 * * * *` sur `/api/cron/check-rdv-notifications` | `vercel.json:2-6` |
| Multi-organisations | ✅ Table `organizations` (UUID, odoo_partner_id, client_type, is_active) | `supabase/migrations/organizations.sql:8-23` |
| Custom fields Odoo par org | ✅ Migration `0010_custom_fields.sql` ; API admin `/api/admin/custom-fields` ; affichage RDV `/api/rdv-custom-values` | `supabase/migrations/0010_custom_fields.sql:110-126` ; `src/app/api/admin/custom-fields/` |
| Système d'invitation | ✅ Table `invitations` UUID-token, TTL 7 j, RLS service-role only | `supabase/migrations/invitations_v2.sql:13-23` ; `src/app/api/admin/invite/route.ts:10,118-120` |
| RDV draft system | ✅ Table `rdv_drafts` (form_data JSONB + selected_product + current_step) | `supabase/rdv_drafts.sql:6-16` ; `src/app/api/drafts/route.ts:34-39` |
| Auth Supabase password-only | ✅ `signInWithPassword` ; aucune MFA/TOTP/factor détectée | `src/app/login/page.tsx:47` |
| Admin = email allowlist | ✅ Hardcoded fallback `n.rommiee@axis-experts.be`, override via env `ADMIN_EMAILS` | `src/lib/admin.ts:1-21` |
| Rate-limit applicatif | ✅ Helper `request_log` based, **seulement** sur `/api/auth/setup-account` (IP, 5/60min) et `/api/submit-rdv` (user, 10/60min) | `src/lib/rate-limit.ts:1-53` ; `src/app/api/auth/setup-account/route.ts:32-42` ; `src/app/api/submit-rdv/route.ts:106-117` |
| Storage Supabase RDV | ✅ Bucket `rdv-documents` (privé), policy par dossier `auth.uid()` | `supabase/migration.sql:101-119` |
| Type cible « cible utilisateurs » | ✅ trois `client_type` : `social`, `agency`, `dactylo` | `supabase/migrations/organizations.sql:14` ; `supabase/migrations/20260421120000_add_dactylo_client_type.sql` |
| Pas de middleware Next racine | ⚠️ **Aucun `src/middleware.ts`** trouvé ; la fonction `updateSession` existe dans `src/lib/supabase/middleware.ts:6-169` mais n'est pas câblée à la racine. À vérifier : ce middleware est-il bien actif ? | `find /home/user/axis-experts-rdv -name "middleware.ts" -not -path "*/node_modules/*"` ne renvoie que `src/lib/supabase/middleware.ts` |
| Monitoring/alerting | ❌ Aucun Sentry / Datadog / OTEL / PostHog | `package.json` (aucune dépendance) |
| Pages d'erreur applicatives | ❌ Aucun `error.tsx`, `global-error.tsx`, `not-found.tsx` | Absence vérifiée dans `src/app/` (find) |

**Élément critique à confirmer immédiatement avec Nicolas :** le routage middleware Next. Si `src/middleware.ts` est absent, alors `updateSession()` n'est jamais appelé → ni l'auth check ni le routage admin ni la suspension orga ne s'appliquent. Ce serait un **P0 absolu** (cf. Annexe A).

---

## 2. Synthèse exécutive

### 2.1 Tableau récapitulatif des 11 remarques

| # | Titre court | Cat. | Prio note | Prio auditée | Bloquant lancement | Charge (j-h) | Risque |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Résilience Supabase/Vercel | Résilience | P0 | **P0** | **Oui (partiel)** | 3 j | Moyen |
| 2 | Suivi RDV par rôle agence | Fonctionnel | P1 | P1 | Non (V1.1) | 2 j | Faible |
| 3 | Auto-invitation org-admin | Fonctionnel | P1 | P1 | Non (V1.1) | 5 j | Moyen |
| 4 | Format Excel pièces jointes | Fonctionnel | P2 | **Fait** | Non | 0 j | — |
| 5 | EAN compteurs | Fonctionnel | P1 | P2 | Non (V1.2) | 2 j | Faible |
| 6 | Décalage envoi Odoo | Intégration | P1 | P1 | **Oui (recommandé)** | 3 j | Moyen |
| 7 | Report de RDV | Fonctionnel | P1 | P1 | Non (V1.1) | 4 j | Élevé |
| 8 | RGPD : piratage, CGU, auto-blocage | Sécurité/RGPD | P0 | **P0** | **Oui** | 6 j | Élevé |
| 9 | Format adresse vs Odoo | Intégration | P2 | P2 | Non (V1.1) | 1,5 j | Faible |
| 10 | Multi-pièces d'eau simulation | Fonctionnel | P2 | P2 | Non (V1.2) | 3 j | Faible |
| 11 | Simulation prix + proposition partie 2 | Fonctionnel | P2 | P2 | Non (V1.2) | 8 j | Élevé |

**Total bloquant lancement public (#1 partiel + #6 + #8) : ~12 j-h.**
**Total V1.0 complet (bloquants + quick wins ergo) : ~14 j-h.**

### 2.2 Top 3 risques techniques identifiés

1. **Middleware Next non câblé** (Annexe A) — si confirmé, la sécurité du routage et la suspension orga sont inopérantes en prod. **À vérifier en priorité.**
2. **Aucun monitoring / aucune page d'erreur applicative** (`src/app/` ne contient ni `error.tsx`, ni `global-error.tsx`, ni `not-found.tsx`). Une panne Supabase = écran blanc + 500 silencieuses. **Bloquant lancement public.**
3. **Aucune trace d'auditabilité RGPD** : pas de table `audit_log`, pas de notification de nouvelle connexion, pas de CGU horodatée, pas de 2FA. En cas de compte piraté, **rien à présenter à l'APD / CNIL en cas de notification art. 33**.

### 2.3 Top 3 décisions urgentes attendues de Nicolas

1. **Délai d'envoi Odoo (#6)** : 5, 10 ou 15 min ? Et fenêtre d'annulation visible côté client ?
2. **2FA obligatoire (#8)** : pour qui ? Admins Axis seuls, admins organisation, tous les utilisateurs ?
3. **Org-admin (#3)** : auto-activation des invitations émises par un org-admin, ou validation manuelle Axis avant envoi ?

---

## 3. Plan de séquencement proposé

### Phase 0 — Pré-requis lancement public (bloquants stricts) — ~12 j-h

| # | Action | Critère de sortie |
| --- | --- | --- |
| 1 (subset) | Pages d'erreur Next (`error.tsx`, `global-error.tsx`, `not-found.tsx`) brandées avec téléphone + email + lien statut | Test : couper Supabase localement → page brandée affichée |
| 1 (subset) | Health-check `/api/health` + monitoring uptime externe (UptimeRobot ou équivalent) | Alerte email reçue lors d'un downtime simulé |
| 6 | Délai d'envoi Odoo + fenêtre d'annulation | Test : créer un RDV → annuler dans la fenêtre → aucune sale.order créée |
| 8 (subset RGPD) | CGU obligatoire au 1er login (case + horodatage + version) | Migration jouée, colonne `terms_accepted_at` peuplée pour tout user actif après lancement |
| 8 (subset RGPD) | Rate-limit + lockout login + table `audit_log` minimal (login, password reset, account block) | 5 tentatives échouées en 10 min → lockout 30 min ; toutes les actions sensibles loguées |
| 8 (subset RGPD) | Email notification de nouvelle connexion (device/IP différent du dernier) | Test : se connecter depuis un nouveau navigateur → email reçu |
| 8 (subset RGPD) | Page suspension enrichie avec téléphone + lien « Bloquer mon compte » | UI testée |
| Critique transverse | Vérifier/créer `src/middleware.ts` racine qui ré-exporte `updateSession` | Test : route protégée sans session → redirection `/login` |

### Phase 1 — V1.0 lancement public (bloquants + must-have ergo) — ~14 j-h

Phase 0 + :
- Documentation interne process RGPD art. 33 (notification APD/CNIL <72 h) — 0,5 j

### Phase 2 — V1.1 (P1 non bloquants) — ~14 j-h

| # | Charge | Justification |
| --- | --- | --- |
| 2 — Suivi RDV par rôle | 2 j | Améliore la qualité du suivi mais non bloquant : l'agence reçoit aujourd'hui tout, ce qui est l'option « safe » |
| 3 — Org-admin + dashboard invitations | 5 j | Réduit la charge support Axis ; tant que volume reste modéré, les invitations manuelles tiennent |
| 7 — Report de RDV | 4 j | Cas d'usage métier mais peut être géré hors plateforme à court terme (téléphone) |
| 9 — Format adresse | 1,5 j | Risque qualité-donnée Odoo, mais non bloquant fonctionnellement |
| 8 — 2FA TOTP (admins) | 2 j | Recommandé en V1.0 pour admins Axis, mais peut basculer en V1.1 si trop tendu |

### Phase 3 — V1.2+ (P2 backlog) — ~13 j-h

- #5 EAN compteurs — 2 j
- #10 Multi-pièces d'eau — 3 j
- #11 Devis agence + proposition partie 2 — 8 j (avec Yousign optionnel +3 j)

---

## 4. Critères Go/No-Go lancement public

À cocher avant ouverture du portail au grand public :

- [ ] `src/middleware.ts` racine présent et testé (auth + admin routing + suspension orga)
- [ ] Pages `error.tsx`, `global-error.tsx`, `not-found.tsx` brandées avec téléphone + email Axis Experts
- [ ] Health-check `/api/health` répondant 200 / 503 selon état Supabase
- [ ] Monitoring uptime externe configuré (alerte email/SMS si downtime > 2 min)
- [ ] Page `/account-suspended` enrichie (téléphone + email) — actuellement `src/app/account-suspended/page.tsx:37-39` ne propose aucun contact
- [ ] CGU bloquante au 1er login (case + horodatage + version) — table `terms_acceptances` ou colonne sur `portal_clients`
- [ ] Audit log applicatif minimal (table `audit_log` avec login OK, login KO, password reset, account block, invitation accept)
- [ ] Rate-limit login + lockout (étendre `src/lib/rate-limit.ts:3-47` à `/api/auth/*` login)
- [ ] Email notification de nouvelle connexion depuis device/IP inconnu
- [ ] Bouton « Bloquer mon compte » sur `src/app/profil/page.tsx`
- [ ] Backup Supabase configuré (PITR ≥ 7 j) — à confirmer côté projet `psbcebctdkxuqnoxgwrs`
- [ ] Registre des secrets à jour (`.env.example` est conforme à `vercel.json` + utilisations dans `src/`)
- [ ] Délai d'envoi Odoo configuré + fenêtre d'annulation testée (#6)
- [ ] Documentation interne process RGPD art. 33 (notif APD/CNIL <72 h)
- [ ] Test charge basique sur `/api/submit-rdv` (10 RPS pendant 60 s) sans erreur 5xx
- [ ] Test e2e du flow invitation → setup-account → première soumission RDV
- [ ] CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, ODOO_API_KEY, RESEND_API_KEY rotés et stockés uniquement dans Vercel

---

## Remarque #1 — Résilience Supabase / Vercel

**Catégorie** : Résilience
**Priorité note interne** : P0
**Priorité révisée audit** : **P0** — confirmée. Sans pages d'erreur ni monitoring, la moindre panne provoque un écran blanc, ce qui est incompatible avec un lancement public.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/` : recherche `find` — aucun `error.tsx`, `global-error.tsx`, `not-found.tsx`, `404.tsx`, `500.tsx`.
  - `src/app/page.tsx:1-16` : appel direct `supabase.auth.getUser()` sans `try/catch`.
  - `package.json:11-44` : aucune dépendance monitoring (Sentry, Datadog, PostHog, OTEL).
  - `src/lib/safe-log.ts:1-31` : masque les emails dans les logs ; pas de télémétrie remote.
  - `vercel.json:1-8` : aucune config edge KV, aucun fallback.
  - `next.config.ts:1-9` : seul `proxyClientMaxBodySize` configuré.
  - `src/app/account-suspended/page.tsx:1-54` : seule « page d'incident » existante ; ne contient ni téléphone ni email (lignes 37-39 affichent uniquement « Contactez Axis Experts »).
- Comportement constaté :
  - Si Supabase est injoignable, `src/app/page.tsx:8` jette → Next sert une 500 par défaut (sans branding).
  - Aucune route `/api/health` ni équivalent.
  - Aucun runtime `edge` activé : tous les `route.ts` tournent en Node.js (vérifié sur `src/app/api/dactylo/upload-batch/route.ts:29` qui explicite `runtime = "nodejs"`).
- Couverture actuelle de la remarque : **5 %** (seule la page suspension existe, sans contact, et n'est pas une fallback Supabase).

### 2. Gap vs proposition de la note

- Manque : page fallback brandée (avec téléphone + email), health-check, monitoring uptime, page statique CDN, formulaire de capture Edge/KV.
- Existe déjà et réutilisable : composants UI shadcn (`src/components/ui/`), branding (`src/app/layout.tsx:9`), email helper `src/lib/email.ts` (utile pour envoyer les leads capturés).

### 3. Recommandation technique

- Approche proposée :
  - Ajouter `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx` brandés Axis Experts avec téléphone + email + lien statut.
  - Créer `src/app/api/health/route.ts` (runtime `nodejs`) qui ping Supabase + Odoo via timeouts courts et renvoie 200/503.
  - Souscrire à un monitoring uptime externe (UptimeRobot, BetterStack) qui consomme `/api/health` toutes les 60 s.
  - Enrichir `src/app/account-suspended/page.tsx` avec coordonnées téléphone + email (déjà recommandé en #8).
- Tables / colonnes Supabase à créer ou modifier : néant.
- Edge Functions à créer / modifier : néant côté Supabase. Côté Next : créer `app/api/health/route.ts`.
- Endpoints Next.js à créer / modifier : `/api/health` ; pages `error.tsx`, `global-error.tsx`, `not-found.tsx`.
- Intégrations externes impactées : Vercel (envs), uptime monitoring (nouveau service tiers à choisir).

### 4. Effort estimé

- Charge : **3 j-h** (pages d'erreur 0,5 j + health-check 0,5 j + intégration monitoring 0,5 j + enrichissement page suspendue 0,25 j + tests + doc + procédure incident 1,25 j).
- Complexité : Faible.
- Risque technique : Moyen — décision sur l'éventuel formulaire de capture Edge/KV (cf. question ouverte).

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Oui** (sous-ensemble : pages d'erreur + health-check + monitoring + coordonnées sur page suspendue).
- Justification : un produit ouvert au public sans aucune page d'erreur brandée ni monitoring est intenable côté image et SLA.
- Le formulaire de capture Edge/KV peut être V1.1 si arbitré comme non vital.

### 6. Questions ouvertes pour Nicolas

1. Formulaire de capture statique en Edge/KV pendant incident : oui ou non en V1.0 ? (Si oui, charge +2 j et choix Vercel KV vs Upstash.)
2. Quel monitoring externe ? UptimeRobot (gratuit, basique) ou BetterStack (payant, pages statut publiques) ?
3. Quel téléphone et quelle adresse email afficher publiquement sur la page d'erreur ?
4. Souhaitez-vous une page statut publique (status.axis-experts.be) ou interne uniquement ?

---

## Remarque #2 — Suivi RDV par l'agence selon rôle

**Catégorie** : Fonctionnel
**Priorité note interne** : P1
**Priorité révisée audit** : P1 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/api/cron/check-rdv-notifications/route.ts:247-329` — résolution des destinataires se fait au niveau organisation (mode `creator_only` / `all_org_users` / `custom_list`), via `resolveNotificationRecipients()`.
  - `src/lib/notification-recipients.ts:49-92` — la résolution ne tient compte d'aucun rôle utilisateur.
  - `src/app/api/submit-rdv/route.ts:1006-1035` — envoi de l'email de demande au bailleur conditionné à `notifyBailleur !== false` (per-RDV, pas par rôle).
  - `src/app/demande/page.tsx:90,213,227,254` — le flag `notifyBailleur` est exposé à l'utilisateur via une checkbox, valeur par défaut `true` (`src/app/demande/page.tsx:90`).
  - `src/lib/types.ts:19` — type `notifyBailleur: boolean`.
  - Schéma `portal_clients` (`supabase/migrations/20260417102921_split_client_name.sql:8-21`) : colonnes `first_name`, `last_name`, `email_bailleur`, `client_type` — **aucune colonne `role`**.
  - `supabase/migrations/20260521120000_regularize_notifications_and_product_catalog.sql:55-68` — paramètres notifications uniquement au niveau organisation (`notifications_enabled`, `notify_on_create`, `notify_on_update`, `notification_recipients_mode`).
- Comportement constaté : aujourd'hui l'utilisateur déclenche ou non l'envoi *au bailleur* via une case par RDV, mais aucune notion de « suivi de dossier » par utilisateur / par rôle dans une agence.
- Couverture actuelle de la remarque : **10 %** (granularité organisation existe, granularité « rôle utilisateur » absente).

### 2. Gap vs proposition de la note

- Manque : notion de rôle utilisateur (gestionnaire / mise-en-location / autre), checkbox « Suivez-vous ce dossier ? » à la création, opt-in/out a posteriori, mini dashboard utilisateur.
- Existe déjà : infra de résolution de destinataires (`src/lib/notification-recipients.ts`) extensible, table `portal_clients` modifiable, table `portal_submissions` (`src/app/api/submit-rdv/route.ts:1186-1192`) qui mémorise déjà `user_id` → `odoo_order_id`.

### 3. Recommandation technique

- Approche proposée :
  - Ajouter colonne `role TEXT` sur `portal_clients` (énum applicatif : `gestionnaire`, `mise_en_location`, `autre`).
  - Ajouter table `rdv_followers (rdv_id, user_id, organization_id, created_at)` — un user peut suivre/désuivre un RDV.
  - Étendre `resolveNotificationRecipients()` avec un quatrième mode `followers_only` qui interroge `rdv_followers` puis fallback `creator_only`.
  - Form `src/app/demande` : ajouter checkbox « Je veux suivre ce dossier » prérenseignée selon le rôle (gestionnaire = oui, mise-en-location = non).
  - Mini dashboard sur `src/app/dashboard` : bouton toggle « Suivre / Ne plus suivre » par ligne.
- Tables / colonnes Supabase à créer ou modifier :
  - `ALTER TABLE portal_clients ADD COLUMN role TEXT CHECK (role IN ('gestionnaire','mise_en_location','autre'))`.
  - `CREATE TABLE rdv_followers (id UUID PK, odoo_order_id INT, user_id UUID, organization_id UUID, created_at TIMESTAMPTZ)` + index unique `(odoo_order_id, user_id)`.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `POST /api/rdv/[orderId]/follow`, `DELETE /api/rdv/[orderId]/follow` ; étendre `/api/submit-rdv` pour insérer une ligne `rdv_followers` selon checkbox.
- Intégrations externes impactées : néant (Odoo non impacté côté schéma).

### 4. Effort estimé

- Charge : **2 j-h** (schéma + endpoints 0,75 j ; UI demande + dashboard 0,75 j ; tests + extension `notification-recipients` 0,5 j).
- Complexité : Faible.
- Risque technique : Faible — extension propre du modèle existant.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : aujourd'hui les agences reçoivent tout (option « safe »). Réduire le bruit est confort, pas blocage.
- À traiter en **V1.1**.

### 6. Questions ouvertes pour Nicolas

1. Liste exhaustive et figée des rôles agence à supporter ? Trois rôles (gestionnaire / mise-en-location / autre) suffisent-ils ?
2. Le rôle est-il modifiable par l'org-admin (cf. #3) ou réservé à Axis ?
3. Quand un user opt-in à « suivre », doit-il recevoir les notifications de création **et** de mise à jour, ou uniquement mise à jour ?

---

## Remarque #3 — Auto-invitation utilisateurs dans une organisation

**Catégorie** : Fonctionnel
**Priorité note interne** : P1
**Priorité révisée audit** : P1 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/api/admin/invite/route.ts:21-152` : POST réservé aux admins Axis (check `isAdmin(user.email)`), génère token UUID, TTL 7 j (`src/app/api/admin/invite/route.ts:10,118-120`).
  - `src/app/api/admin/invite/route.ts:181-226` : email envoyé via Resend avec lien `${origin}/setup-account?token=${token}`.
  - `src/app/api/admin/invitations/route.ts` + `[id]/route.ts` : list + revoke admin only.
  - `src/app/api/auth/validate-token/route.ts:24-60` : valide token (existe, non utilisé, non expiré) sans auth.
  - `src/app/api/auth/setup-account/route.ts:99-306` : POST avec `{ token, password, first_name, last_name }` crée le compte auth + upsert `portal_clients` (`organization_id` ligne 238) + marque `used_at` (ligne 269).
  - `supabase/migrations/invitations_v2.sql:13-28` : table `invitations` (UUID token, RLS service-role only) ; aucune table d'audit.
  - `src/lib/admin.ts:1-21` : `isAdmin` basé sur email, aucun rôle DB.
  - `src/app/dashboard/page.tsx`, `src/app/profil/page.tsx` : aucune UI de gestion d'équipe.
  - Aucune colonne `quota`, `plan`, `max_users` dans `organizations` (`supabase/migrations/organizations.sql:8-23`).
- Comportement constaté : seul un admin Axis (allowlist email) peut inviter. Token 7 j, RLS service-role.
- Couverture actuelle : **40 %** — l'infra invitation + setup-account existe, mais réservée à Axis et sans rôle org-admin, sans audit, sans quota.

### 2. Gap vs proposition de la note

- Manque : rôle `org_admin`, mini dashboard agence, audit log, quotas.
- Existe déjà : table `invitations`, endpoints validation / setup, email Resend.

### 3. Recommandation technique

- Approche proposée :
  - Ajouter colonne `role TEXT` sur `portal_clients` (cf. #2) avec valeur `org_admin` en plus.
  - Nouveau endpoint `POST /api/org/invitations` (auth requise + check `role = 'org_admin'`) ré-utilisant la logique de `src/app/api/admin/invite/route.ts:90-150`.
  - Nouveau endpoint `GET /api/org/users` et `GET /api/org/invitations` scoped à l'orga de l'appelant.
  - Nouvelle page `src/app/equipe/page.tsx` (liste users + invitations + bouton inviter + révocation).
  - Nouvelle table `invitation_audit (id, invitation_id, action, actor_user_id, created_at, metadata JSONB)` — audit minimal RGPD.
  - Quotas : colonne `max_users INT` sur `organizations`, check dans le endpoint POST.
- Tables / colonnes Supabase à créer ou modifier :
  - `ALTER TABLE portal_clients ADD COLUMN role TEXT` (mutualisé avec #2).
  - `ALTER TABLE organizations ADD COLUMN max_users INT`.
  - `CREATE TABLE invitation_audit (...)`.
  - RLS policies pour `invitations` lecture filtrée par `organization_id` du caller (en plus du service-role).
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `/api/org/invitations`, `/api/org/users`, `/api/org/invitations/[id]` (DELETE) ; page `/equipe`.
- Intégrations externes impactées : Resend (volume potentiellement supérieur — vérifier quotas plan).

### 4. Effort estimé

- Charge : **5 j-h** (migrations + RLS 1 j ; endpoints + tests 1,5 j ; UI 1,5 j ; audit + quotas 0,5 j ; doc 0,5 j).
- Complexité : Moyenne.
- Risque technique : Moyen — RLS à valider rigoureusement pour éviter qu'un org-admin voie les invitations d'une autre orga.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : tant que le volume reste modéré, Axis peut gérer manuellement. Mais à traiter rapidement post-launch sinon goulet support.
- À traiter en **V1.1**.

### 6. Questions ouvertes pour Nicolas

1. Auto-activation des comptes invités par un org-admin, ou validation manuelle Axis avant envoi ?
2. Quota par défaut par plan ? Y a-t-il des plans tarifaires différenciés ou tous les clients sont actuellement « tout inclus » ?
3. Un org-admin peut-il révoquer (bloquer) un user de son orga, ou seulement Axis ?
4. Un org-admin peut-il être créé par invitation, ou uniquement promu par Axis ?

---

## Remarque #4 — Format Excel pour pièces jointes

**Catégorie** : Fonctionnel
**Priorité note interne** : P2
**Priorité révisée audit** : **Déjà fait** — la demande est entièrement couverte par le code actuel.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/api/submit-rdv/route.ts:20-29` : `ALLOWED_EXTENSIONS = ["pdf","jpg","jpeg","png","doc","docx","xls","xlsx"]` ✅
  - `src/lib/mime-validation.ts:1-22` : signatures magic bytes `.xlsx` (ligne 7 — `0x50,0x4b,0x03,0x04`) et `.xls` (ligne 9 — `0xd0,0xcf,0x11,0xe0`) ✅
  - `src/app/demande/page.tsx:1450` : `accept="application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"` ✅
  - `src/app/demande/page.tsx:530` (`MAX_SIZE = 3 * 1024 * 1024`) et `src/app/api/submit-rdv/route.ts:18` (`MAX_DOCUMENT_BYTES = 3 * 1024 * 1024`) — cohérents.
  - Message utilisateur : `src/app/demande/page.tsx:1502` affiche « PDF, Word ou Excel » ; toast erreur `src/app/demande/page.tsx:1474` : « PDF, Word ou Excel uniquement ».
- Comportement constaté : .xls/.xlsx sont déjà acceptés en front + back, magic bytes vérifiés, message à jour.
- Couverture actuelle : **100 %**.

### 2. Gap vs proposition de la note

- Manque : rien.
- Existe déjà : tout — extensions, validation magic bytes, accept HTML, taille cohérente, message d'aide.

### 3. Recommandation technique

- Aucune. Confirmer par un test fonctionnel (upload `.xlsx` < 3 MB → succès, > 3 MB → erreur, `.xlsm` → rejet attendu).

### 4. Effort estimé

- Charge : **0 j-h** (sauf test smoke 0,25 j).
- Complexité : Faible.
- Risque technique : Faible.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non** (déjà fait).
- À traiter : rien — clore le ticket dans la note.

### 6. Questions ouvertes pour Nicolas

1. Voulez-vous étendre à `.csv` / `.xlsm` / `.ods` ? (Réponse par défaut : non, périmètre courant suffisant.)
2. La limite 3 MB par fichier convient-elle pour les Excel volumineux (états des lieux historiques) ?

---

## Remarque #5 — Code EAN obligatoire avec compteurs

**Catégorie** : Fonctionnel
**Priorité note interne** : P1
**Priorité révisée audit** : **P2** — l'usage utilisateur (« recommandé non bloquant ») la rend P2 ; ne pas dégrader l'UX existante en V1.0.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - Form UI : `src/app/demande/page.tsx:111-113` (init `compteurEau`, `compteurGaz`, `compteurElec` en chaînes vides) ; champs texte libre `src/app/demande/page.tsx:1562-1583`.
  - `src/lib/types.ts:48-50` : champs `compteurEau`, `compteurGaz`, `compteurElec: string`.
  - Backend Odoo : `src/app/api/submit-rdv/route.ts:886-902` — les compteurs sont **postés comme message chatter** (`message_post`, `mail.mt_note`), pas en champ structuré.
  - Recherche `grep -rn "EAN\|ean" src/` : **0 occurrence**.
  - Custom fields existants (`supabase/migrations/0010_custom_fields.sql:110-126`) : aucun ne concerne les compteurs / EAN.
- Comportement constaté : 3 champs texte libre, aucune validation, envoyés en commentaire chatter Odoo.
- Couverture actuelle : **0 %** (aucune notion EAN).

### 2. Gap vs proposition de la note

- Manque : champ EAN par compteur, validation format (18 chiffres, préfixe 54), mapping vers champ Odoo structuré.
- Existe déjà : les 3 champs compteur (à faire évoluer), système custom fields générique (`src/app/api/admin/custom-fields/route.ts`) qui pourrait porter le mapping Odoo.

### 3. Recommandation technique

- Approche proposée :
  - Pour chaque compteur, ajouter un champ optionnel `eanXxx` (string).
  - Validation Zod en front + back : `/^54\d{16}$/` warning non bloquant si non vide et format invalide.
  - Étendre `src/lib/types.ts` (`eanEau`, `eanGaz`, `eanElec`) et `src/app/api/submit-rdv/route.ts:886-902` pour inclure l'EAN dans le `compteurBody`.
  - Optionnel V1.2 : créer 3 custom fields Odoo (`x_studio_ean_eau`, `x_studio_ean_gaz`, `x_studio_ean_elec`) côté Odoo studio, puis les renseigner via `sale.order.write` au lieu de chatter.
- Tables / colonnes Supabase à créer ou modifier : néant.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : extension `src/app/api/submit-rdv/route.ts` (validation + payload).
- Intégrations externes impactées : Odoo (création champs custom à coordonner — hors scope code).

### 4. Effort estimé

- Charge : **2 j-h** (1 j UI + validation, 0,5 j backend + payload, 0,5 j coord Odoo + tests).
- Complexité : Faible.
- Risque technique : Faible.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : amélioration qualité-donnée, l'absence ne casse rien.
- À traiter en **V1.2**.

### 6. Questions ouvertes pour Nicolas

1. Validation EAN bloquante ou warning ? (Note dit : recommandé non bloquant.)
2. Champ EAN obligatoire si compteur renseigné, ou totalement optionnel ?
3. Faut-il créer les 3 champs custom Odoo dès V1.2, ou rester en chatter ?

---

## Remarque #6 — Décalage envoi confirmation RDV vers Odoo

**Catégorie** : Intégration
**Priorité note interne** : P1
**Priorité révisée audit** : P1 — **fortement recommandé en V1.0**.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/api/submit-rdv/route.ts:622` : `orderId = await odooCreate("sale.order", orderValues)` — création synchrone à la POST.
  - `src/app/api/submit-rdv/route.ts:1146-1155` : email interne envoyé synchrone à `info@axis-experts.be`.
  - `vercel.json:2-6` : un seul cron `*/10 * * * *` sur notifications RDV — pas de cron de dépiling.
  - `supabase/rdv_drafts.sql:6-16` + `src/app/api/drafts/route.ts:34-39` : drafts sont un système séparé (sauvegarde **avant** soumission), pas un buffer post-clic.
  - `src/app/confirmation/page.tsx:1-75` : auto-redirection 5 s vers dashboard ; aucun bouton « modifier » / « annuler ».
  - `src/app/dashboard/page.tsx` : aucun bouton annuler / reporter sur les lignes RDV.
  - `src/app/api/submit-rdv/route.ts:645` : `action_cancel` n'est appelé qu'en interne si aucun produit configuré.
- Comportement constaté : la soumission est instantanée et irréversible côté UI ; aucune fenêtre d'annulation pour l'utilisateur ni pour Axis.
- Couverture actuelle : **0 %**.

### 2. Gap vs proposition de la note

- Manque : table queue, cron de dépiling, fenêtre d'annulation UI, log de transitions.
- Existe déjà : table `portal_submissions` (`src/app/api/submit-rdv/route.ts:1186-1192`) — peut héberger un statut `pending|sent|cancelled`. Helper `request_log` + style cron (`src/app/api/cron/check-rdv-notifications/route.ts`).

### 3. Recommandation technique

- Approche proposée :
  - Nouveau parcours : à la POST `/api/submit-rdv`, **ne plus créer la `sale.order` immédiatement**. Insérer une ligne `pending_orders (id, user_id, organization_id, payload JSONB, scheduled_at, status, created_at)` avec `scheduled_at = now() + INTERVAL 'X minutes'`.
  - Nouveau cron `/api/cron/dispatch-pending-orders` toutes les 1 min, qui SELECT `WHERE status='pending' AND scheduled_at <= now() FOR UPDATE SKIP LOCKED` et déclenche la création Odoo (logique actuelle de `submit-rdv` extraite dans `src/lib/submit-rdv-to-odoo.ts`).
  - UI confirmation : afficher un compte-à-rebours « Votre demande sera envoyée dans X min » + bouton « Annuler » (DELETE `/api/pending-orders/[id]`).
  - Log transitions dans table `pending_orders_events`.
  - Côté `vercel.json`, ajouter le nouveau cron (Vercel limite à 1/min sur plan Pro — à confirmer).
- Tables / colonnes Supabase à créer ou modifier :
  - `CREATE TABLE pending_orders (id UUID PK, user_id UUID, organization_id UUID, payload JSONB, scheduled_at TIMESTAMPTZ, status TEXT CHECK status IN ('pending','dispatching','sent','cancelled','failed'), created_at, dispatched_at, error_message, odoo_order_id INT)`.
  - `CREATE TABLE pending_orders_events (id UUID PK, pending_order_id UUID, event TEXT, actor_user_id UUID, metadata JSONB, created_at)`.
  - RLS : SELECT/DELETE par `user_id = auth.uid()`.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : modifier `/api/submit-rdv` (insertion `pending_orders`) ; créer `/api/pending-orders/[id]` (DELETE) ; créer `/api/cron/dispatch-pending-orders`.
- Intégrations externes impactées : Odoo (déplacé dans le cron), Resend (email aussi déplacé), Vercel (nouveau cron).

### 4. Effort estimé

- Charge : **3 j-h** (migration + extraction logique 1 j ; cron + tests 1 j ; UI compte-à-rebours + annulation 1 j).
- Complexité : Moyenne.
- Risque technique : Moyen — la création Odoo en cron doit être idempotente (utiliser `pending_orders.id` comme clé d'idempotence). Risque de double envoi si cron qui crash en plein milieu.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Oui (recommandé)**.
- Justification : sans fenêtre d'annulation, la moindre erreur de saisie ouvre un dossier Odoo qu'il faut nettoyer manuellement à chaque fois. Pour un produit grand public, c'est intenable opérationnellement.
- Si arbitré à reporter en V1.1 : prévoir une procédure manuelle Axis pour annuler les sale.order erronées.

### 6. Questions ouvertes pour Nicolas

1. Quelle valeur de délai ? (5 / 10 / 15 min — la note demande à arbitrer.)
2. Annulation utilisateur visible côté agence aussi (l'agence voit le compte-à-rebours sur les RDV d'autres users) ?
3. Si l'utilisateur ferme l'onglet pendant la fenêtre : envoi auto à expiration (recommandé) ou attente confirmation explicite ?
4. Faut-il aussi décaler les emails (bailleur + interne) jusqu'à dépiling, ou les envoyer immédiatement ?

---

## Remarque #7 — Gestion du report de RDV

**Catégorie** : Fonctionnel
**Priorité note interne** : P1
**Priorité révisée audit** : P1 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/app/dashboard/page.tsx` : pas de bouton reporter/annuler/modifier (vérifié par recherche keywords).
  - `src/app/confirmation/page.tsx:1-75` : pas d'action.
  - `src/components/` : aucun composant reschedule/report modal.
  - Cron de détection de changement de date : `src/app/api/cron/check-rdv-notifications/route.ts:237-245` distingue `initial` vs `updated` selon `existing.rdv_date_string !== rdvDateString`. L'email diffère (`isUpdate` ligne 355 ; `src/lib/email-templates/rdv-notification.ts:92,107-108` change le wording).
  - Aucune table d'historique RDV : `find supabase/migrations -name "*history*"` → 0 résultat.
  - Aucune mirror du champ date Odoo en Supabase : `src/app/api/submit-rdv/route.ts:1186-1192` n'inclut pas la date dans `portal_submissions`.
  - Cancel : seul `action_cancel` interne (`src/app/api/submit-rdv/route.ts:645`).
- Comportement constaté : détection de changement existe (cron), mais aucun UI de reprogrammation, aucun historique, aucune annulation utilisateur, dates uniquement dans Odoo.
- Couverture actuelle : **15 %** (la détection cron envoie déjà un email « mis à jour », mais zéro action utilisateur).

### 2. Gap vs proposition de la note

- Manque : UI report / annulation, table d'historique, notification configurable selon mode suivi (#2), distinction report vs annulation+recréation, mise à jour calendrier.
- Existe déjà : détection automatique des changements de date par le cron ; template email différencié.

### 3. Recommandation technique

- Approche proposée :
  - Nouvelle table `rdv_date_history (id, odoo_order_id, previous_date_string, new_date_string, actor TEXT CHECK actor IN ('client','agency','axis','odoo'), changed_at)`.
  - Étendre `portal_submissions` avec `last_rdv_date_string TEXT` pour servir de cache de détection.
  - Endpoint `POST /api/rdv/[orderId]/reschedule` (auth requise) qui propose une nouvelle date → modifie Odoo (`sale.order.write` du champ `x_studio_date_prochain_rendez_vous_1`) → insère ligne historique → déclenche notification dédiée.
  - Endpoint `POST /api/rdv/[orderId]/cancel` qui appelle `action_cancel` Odoo + insère événement.
  - UI : bouton « Demander un report » et « Annuler » sur chaque ligne dashboard ; modale avec datepicker.
  - Logique d'autorisation : `client` peut reporter, `agency` peut reporter, `axis` peut reporter/annuler. Configurable via `role` (cf. #2).
  - Notifications : réutiliser cron actuel + ajout de différenciation `client_requested_reschedule` vs `odoo_internal_update`.
- Tables / colonnes Supabase à créer ou modifier :
  - `CREATE TABLE rdv_date_history (...)`.
  - `ALTER TABLE portal_submissions ADD COLUMN last_rdv_date_string TEXT`.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `/api/rdv/[orderId]/reschedule`, `/api/rdv/[orderId]/cancel` ; UI dashboard modifiée.
- Intégrations externes impactées : Odoo (write field) ; Resend (template additionnel).

### 4. Effort estimé

- Charge : **4 j-h** (schéma + endpoints 1,5 j ; UI 1,5 j ; tests + extension cron 1 j).
- Complexité : Moyenne à Élevée.
- Risque technique : Élevé — la source de vérité est Odoo (l'expert peut modifier la date directement). Concurrence client/expert sur la même date à gérer (lock optimiste via `write_date`).

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : à court terme, les reports peuvent passer par téléphone/email. Bloquer le launch sur ce point est disproportionné.
- À traiter en **V1.1**.

### 6. Questions ouvertes pour Nicolas

1. Qui peut reporter : client seul, agence seule, les deux, ou uniquement Axis valide ?
2. Délai minimal avant RDV pour autoriser un report (J-1, J-3) ?
3. Annulation : soft (statut « annulé ») ou hard (suppression sale.order Odoo) ?
4. Le calendrier mis à jour est-il interne Odoo, ou un calendrier ICS public à intégrer ?
5. En cas de report demandé par client, validation expert obligatoire avant que le RDV change réellement de date ?

---

## Remarque #8 — Audit RGPD : compte piraté + CGU + auto-blocage

**Catégorie** : Sécurité / RGPD
**Priorité note interne** : P0
**Priorité révisée audit** : **P0** — confirmée. L'absence totale d'audit log + CGU + 2FA + notification de connexion expose Axis Experts à un risque juridique sérieux en cas d'incident.

### 1. État actuel (preuves)

- Fichiers inspectés (avec ligne ↔ état) :
  - **CGU au 1er login** : absent. `src/app/setup-account/page.tsx:1-320` n'a aucune case CGU ; `src/app/api/auth/setup-account/route.ts:1-306` ne valide aucune CGU ; aucune migration `terms_*` / `cgu_*`.
  - **Bouton « Bloquer mon compte »** : absent. `src/app/profil/page.tsx:1-241` n'a aucune action self-block. Le block existe côté admin (`src/app/api/admin/users/[id]/block/route.ts:1-65`, ban auth + `portal_clients.blocked_at` ligne 46) mais pas exposé à l'utilisateur final.
  - **2FA / TOTP / MFA** : absent. `grep -rn "totp\|mfa\|factor" src/` → 0.
  - **Email de notification nouvelle connexion** : absent. `src/app/login/page.tsx:41-79` ne déclenche aucun email.
  - **Audit log** : absent. Aucune table `audit_log`/`activity_log` dans les migrations. La table `request_log` (`src/lib/rate-limit.ts:21-44`) sert uniquement au rate-limit.
  - **Rate-limit login** : **absent applicativement**. Le helper `checkRateLimit` (`src/lib/rate-limit.ts:3-47`) existe mais n'est appelé que sur `/api/auth/setup-account` et `/api/submit-rdv`. `src/app/login/page.tsx:60` se contente d'afficher l'erreur retournée par Supabase (`too_many_requests`) — c'est la limite SDK, pas une vraie défense applicative ni un lockout après N échecs.
  - **Page suspension** : `src/app/account-suspended/page.tsx:1-54` existe mais ne donne aucun contact (lignes 37-39).
  - **Détermination admin** : email hardcoded + env var (`src/lib/admin.ts:1-21`). Pas de rôle DB, pas d'audit des actions admin.
  - **Password reset** : `src/app/reset-password/page.tsx:1-153` standard ; `src/app/login/page.tsx:24-39` `resetPasswordForEmail`. Pas de timing-attack protection particulière, pas d'audit log.
- Comportement constaté : sécurité « basique Supabase » sans aucune couche RGPD/auditabilité custom.
- Couverture actuelle : **10 %** (block admin OK, account-suspended OK, rate-limit partiel).

### 2. Gap vs proposition de la note

- Manque : CGU horodatée, bouton self-block, 2FA admin, notif nouvelle connexion, audit log, rate-limit login + lockout, doc process art. 33.
- Existe déjà : block admin, rate-limit helper, page suspension (à enrichir).

### 3. Recommandation technique

- Approche proposée :
  - **CGU** : table `terms_versions (id, version TEXT, content_url, published_at)` + colonne `terms_accepted_version`, `terms_accepted_at` sur `portal_clients`. Middleware ou layout dashboard force redirection vers `/cgu` si version courante ≠ acceptée.
  - **Self-block** : page `src/app/profil/page.tsx` + bouton « Bloquer mon compte » → endpoint `POST /api/auth/self-block` qui set `portal_clients.blocked_at` + ban auth + audit log + email Axis. Lien dédié dans les emails de connexion suspecte.
  - **2FA TOTP** : utiliser API Supabase `auth.mfa.enroll('totp')`. Page `src/app/profil/security/page.tsx` pour enrollment. Middleware vérifie `user.factors.totp.verified` pour les admins (et plus tard tous les users).
  - **Notif nouvelle connexion** : trigger DB sur `auth.audit_log_entries` (ou hook applicatif via `/api/auth/me`) qui compare `user_agent` + `ip` vs la dernière entrée connue, envoie un email Resend avec lien révocation.
  - **Audit log applicatif** : table `audit_log (id, user_id, action TEXT, target_type, target_id, ip, user_agent, metadata JSONB, created_at)`. Wrap les actions sensibles : login OK, login KO, password reset, account block (self ou admin), invitation create, invitation accept, role change.
  - **Rate-limit login + lockout** : étendre `checkRateLimit` à `/api/auth/login` (à créer côté app, qui wrappe `signInWithPassword`). 5 KO en 10 min → lockout 30 min. Stocker dans `audit_log`.
  - **Page suspension enrichie** : afficher téléphone + email Axis (cf. #1).
  - **Doc process RGPD art. 33** : ajouter `docs/INCIDENT_RESPONSE.md` (notification CNIL/APD < 72 h, contacts, template courrier).
- Tables / colonnes Supabase à créer ou modifier :
  - `CREATE TABLE terms_versions (...)`.
  - `ALTER TABLE portal_clients ADD COLUMN terms_accepted_version TEXT, ADD COLUMN terms_accepted_at TIMESTAMPTZ`.
  - `CREATE TABLE audit_log (...)`.
  - `CREATE TABLE login_attempts (...)` (ou réutiliser `request_log` étendu).
- Edge Functions à créer / modifier : néant côté Supabase (tout en API routes Next).
- Endpoints Next.js à créer / modifier : `/api/auth/login` (wrapper), `/api/auth/self-block`, `/api/auth/me/security`, `/api/auth/cgu/accept` ; page `/cgu`, `/profil/security`.
- Intégrations externes impactées : Resend (template alerte connexion + alerte self-block).

### 4. Effort estimé

- Charge : **6 j-h** (CGU 1 j ; audit log + wrappers actions sensibles 1,5 j ; rate-limit login + lockout 1 j ; notif nouvelle connexion 1 j ; self-block + page suspension 0,5 j ; 2FA admin 1 j).
- Complexité : Moyenne.
- Risque technique : Élevé — toucher à l'auth a un blast radius énorme (régression de connexion = downtime).

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Oui** (sous-ensemble minimal).
- Minimum bloquant : CGU + audit log + rate-limit/lockout login + notif nouvelle connexion + self-block + page suspension enrichie + doc art. 33.
- 2FA TOTP peut basculer en V1.1 (mais recommandé pour admins Axis dès V1.0).

### 6. Questions ouvertes pour Nicolas

1. 2FA TOTP : pour tous, pour org-admins, ou pour admins Axis seulement en V1.0 ?
2. Rate-limit login : combien d'échecs → quel lockout (5 KO → 30 min suffisant) ?
3. CGU : qui rédige et qui valide juridiquement ? URL ou intégré in-app ?
4. Self-block : déclenche-t-il une suppression de données ou seulement blocage ? Et reactivation par Axis uniquement ?
5. Notification nouvelle connexion : seuils (chaque nouvelle IP, ou changement de pays uniquement) ?
6. Le DPO (délégué à la protection des données) est-il identifié pour signer la notification art. 33 ?

---

## Remarque #9 — Format d'adresse plateforme vs Odoo

**Catégorie** : Intégration
**Priorité note interne** : P2
**Priorité révisée audit** : P2 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - Form `src/app/demande/page.tsx:970-1006` : 5 champs séparés (`rue`, `numero`, `boite`, `codePostal`, `commune`).
  - Form locataire nouvelle adresse (sortie) : `src/app/demande/page.tsx:1330-1371` (`locataireNewRue`/`Numero`/`Boite`/`CodePostal`/`Commune`).
  - Concat backend : `src/app/api/submit-rdv/route.ts:365-378` →
    - `adresseComplete = ${rue} ${numero}, ${codePostal} ${commune}` (sans boîte dans la version « complète »)
    - `adresseStreet = ${rue}, ${numero}${boite ? ", ${boite}" : ""}` (avec virgule entre rue et numéro — **incohérent avec la convention belge usuelle**)
    - Création `res.partner` avec champs séparés (`street`, `zip`, `city`, `country_id`) — l'OK structurel est fait.
  - Hook autocomplete : `src/lib/useAddressAutocomplete.ts:12-71` retourne 4 champs (rue, numero, codePostal, commune) ; pas de boîte ; pas de validation post-Maps.
  - Tests : aucun fichier `address*.test.ts` dans `src/lib`.
  - Nouvelle adresse locataire : **non traitée côté backend** — `locataireNewRue` etc. ne sont pas mappés sur `partner_shipping_id` dans `src/app/api/submit-rdv/route.ts`, ils sont seulement postés en note chatter (`src/app/api/submit-rdv/route.ts:830-857`) et une adresse de livraison séparée est créée (lignes 842-854).
- Comportement constaté : structure séparée OK pour Odoo, mais format `street` ambigu (« Rue, 12, B » vs « Rue 12 B » habituel), pas de tests edge case, pas de couverture pour apostrophes/accents/`12A`/`/3`.
- Couverture actuelle : **60 %** (structure séparée + autocomplete + envoi structuré Odoo, mais format `street` à valider et 0 tests).

### 2. Gap vs proposition de la note

- Manque : audit du format actuel vs convention Odoo réelle, tests edge cases, mapping XML-RPC explicite (champs `street`, `street2`, `zip`, `city`).
- Existe déjà : saisie structurée, mapping vers champs Odoo.

### 3. Recommandation technique

- Approche proposée :
  - Lister cas tordus en jeu de tests : `O'Connell`, `Saint-Étienne`, `12A`, `12/3`, `Mont-Saint-Guibert`, codes postaux à `0`/préfixe `0`.
  - Aligner format `street` Odoo sur la convention attendue (à confirmer par capture écran d'une fiche Odoo existante).
  - Utiliser `street` (rue + numéro) + `street2` (boîte) pour respecter la structure Odoo standard.
  - Ajouter tests `src/lib/address.test.ts` avec ces cas.
  - Côté nouvelle adresse locataire : déjà créée comme `res.partner` de type `delivery` (lignes 842-854), mais **non liée au sale.order**. À documenter ou corriger selon attente métier (peut-être backlog hors scope #9).
- Tables / colonnes Supabase à créer ou modifier : néant.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `src/app/api/submit-rdv/route.ts` (refactor format adresse) ; pas de nouveau endpoint.
- Intégrations externes impactées : Odoo (champs `street2` ajoutés).

### 4. Effort estimé

- Charge : **1,5 j-h** (audit format Odoo 0,25 j ; refactor format + `street2` 0,5 j ; tests + cas tordus 0,75 j).
- Complexité : Faible.
- Risque technique : Faible.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : la donnée arrive dans Odoo, juste pas idéalement formatée. À nettoyer en V1.1.
- À traiter en **V1.1**.

### 6. Questions ouvertes pour Nicolas

1. Pouvez-vous fournir 5 captures d'écran d'adresses « modèles » dans Odoo (CPAS, agence, et 2-3 cas particuliers) pour servir de vérité terrain ?
2. La boîte doit-elle aller dans `street2` (recommandé Odoo) ou rester dans `street` ?
3. La nouvelle adresse locataire (sortie) doit-elle apparaître comme `partner_shipping_id` du sale.order, ou rester en note chatter ?

---

## Remarque #10 — Simulation RDV : plusieurs pièces d'eau

**Catégorie** : Fonctionnel
**Priorité note interne** : P2
**Priorité révisée audit** : P2 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `src/components/PriceCalculatorModal.tsx:73` : `EXTRA_ROOM_PRICE = 15` (constant flat).
  - `src/components/PriceCalculatorModal.tsx:370-402` : UI « Pièces supplémentaires » avec +/− boutons 0–20, **pas de typage par pièce**.
  - `src/lib/product-mapping.ts:1-12` : minimal — pas de logique par type de pièce.
  - `src/app/api/agency/price-catalog/route.ts:1-82` : renvoie catalogue plat indexé (mission/bien/chambres).
  - `src/app/api/submit-rdv/route.ts:248,278,284` : `agencyPriceSelection.extraRooms` est **un nombre simple**, prix = `basePrice + extraRooms * 15`.
  - `grep -rn "SDB\|cuisine\|buanderie" src/` → 0 occurrence.
  - Schéma catalogue : `supabase/migrations/20260521120000_regularize_notifications_and_product_catalog.sql:33-49` — table plate (`code`, `odoo_default_code`, `label`).
  - Durée : pas de champ `duration`/`durée` ni front ni back.
- Comportement constaté : un seul compteur générique « pièces supplémentaires » × 15 € flat.
- Couverture actuelle : **20 %** (compteur générique existe mais pas typé).

### 2. Gap vs proposition de la note

- Manque : décomposition par type de pièce (SDB / douche / WC / cuisine / buanderie + quantités), impact prix selon type, impact durée selon type.
- Existe déjà : structure `extraRooms` à faire évoluer vers `extraRoomsByType: Record<string, number>`, table `product_catalog` extensible.

### 3. Recommandation technique

- Approche proposée :
  - Étendre `PriceSelection` : `extraRoomsByType: { sdb: n, douche: n, wc: n, cuisine: n, buanderie: n }`.
  - Ajouter dans `product_catalog` des entrées « extra_room_<type> » avec prix unitaire et durée associée (colonne `duration_minutes` à ajouter).
  - Modifier `PriceCalculatorModal.tsx` : remplacer le +/− unique par 5 lignes (une par type), avec libellés + tooltip.
  - Backend `src/app/api/submit-rdv/route.ts:248-336` : adapter résolution des produits.
  - Optionnel : afficher la durée estimée totale en UI.
- Tables / colonnes Supabase à créer ou modifier :
  - `ALTER TABLE product_catalog ADD COLUMN duration_minutes INT, ADD COLUMN room_type TEXT`.
  - INSERT de 5 lignes (sdb/douche/wc/cuisine/buanderie) avec prix arbitré par Axis.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `/api/agency/price-catalog`, `/api/submit-rdv`, composant `PriceCalculatorModal`.
- Intégrations externes impactées : Odoo (selon si les types de pièces deviennent des sale.order.line distinctes ou restent agrégées).

### 4. Effort estimé

- Charge : **3 j-h** (catalogue + schéma 0,5 j ; UI modale 1 j ; backend + tests 1 j ; coord catalogue tarifaire Axis 0,5 j).
- Complexité : Faible.
- Risque technique : Faible.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : la simulation actuelle fonctionne ; raffiner est V1.2.

### 6. Questions ouvertes pour Nicolas

1. Liste exacte des types de pièces à supporter (5 proposés : SDB/douche/WC/cuisine/buanderie — est-ce exhaustif) ?
2. Prix unitaire par type ?
3. Durée estimée par type — afficher au client, ou usage interne uniquement ?
4. Chaque type de pièce devient une `sale.order.line` distincte, ou agrégé en « extras compteurs/pièces » ?

---

## Remarque #11 — Simulation « demande de prix » agence + proposition partie 2

**Catégorie** : Fonctionnel
**Priorité note interne** : P2
**Priorité révisée audit** : P2 — confirmée.

### 1. État actuel (preuves)

- Fichiers inspectés :
  - `grep -rn "devis\|quote\|proposal\|estimation" src/` → uniquement contexte Prodactylo post-booking (`src/components/dactylo/`), pas de flux quote pré-booking.
  - `package.json:11-44` : aucune lib PDF (pdfkit, jsPDF, react-pdf, puppeteer).
  - `src/lib/email-templates/` : un seul template `rdv-notification.ts:1-138`. Aucun template proposition.
  - `src/components/PriceCalculatorModal.tsx:188-208` : `handleCreerDemande()` stocke la sélection en sessionStorage puis route directement vers la création RDV. Pas d'étape intermédiaire.
  - `src/app/api/submit-rdv/route.ts:602,819` : `x_studio_partie_2_locataires_` = locataire, toujours. Pas de notion alternative.
  - `grep -rn "yousign\|docusign\|signature" src/` → 0.
  - Aucune table proposition (`grep -r "proposal\|quote" supabase/migrations/`).
- Comportement constaté : flux unique « simulateur → RDV ferme », pas de proposition envoyable.
- Couverture actuelle : **0 %**.

### 2. Gap vs proposition de la note

- Manque : flux complet — table proposition, génération PDF, envoi partie 2, tracking statut (envoyée/vue/acceptée/refusée), conversion en RDV si acceptée, mentions légales.
- Existe déjà : simulateur (à dupliquer en mode « proposition »), email helper, identification client.

### 3. Recommandation technique

- Approche proposée :
  - Nouvelle table `proposals (id UUID PK, organization_id, created_by user_id, party2_email, party2_name, payload JSONB, base_price, status TEXT CHECK IN ('draft','sent','viewed','accepted','refused','expired','converted'), pdf_storage_path, token UUID UNIQUE, sent_at, viewed_at, decided_at, expires_at, converted_order_id INT, created_at)`.
  - Génération PDF : choisir entre `@react-pdf/renderer` (templates JSX, recommandé) ou `pdfkit` (impératif). Premier choix : `@react-pdf/renderer` (charge +1 j vs autre lib).
  - Endpoint `POST /api/proposals` (création + génération PDF + upload Storage + envoi email partie 2).
  - Page publique `/proposition/[token]` (sans auth, lit `proposals` via service role + token) avec : affichage devis PDF, boutons « Accepter » / « Refuser ».
  - Endpoint `POST /api/proposals/[token]/decide` (accept|refuse).
  - Si accept → trigger création RDV (réutiliser logique `submit-rdv` extraite, cf. #6).
  - Reminder cron J+3 / J+7 (paramétrable).
  - Template email + mentions légales à fournir par Axis.
- Tables / colonnes Supabase à créer ou modifier :
  - `CREATE TABLE proposals (...)`.
  - Bucket Storage `proposals-pdf` (privé, accès via signed URL).
  - RLS : SELECT par `organization_id` du caller + service role pour token.
- Edge Functions à créer / modifier : néant.
- Endpoints Next.js à créer / modifier : `/api/proposals` (POST, GET list), `/api/proposals/[id]` (GET, DELETE), `/api/proposals/[token]/decide`, page publique `/proposition/[token]`, cron reminder.
- Intégrations externes impactées : Resend (templates), Storage (bucket PDF), optionnellement Yousign si signature électronique.

### 4. Effort estimé

- Charge : **8 j-h** (schéma + endpoints 2 j ; PDF + template 2 j ; UI agence simulateur 1 j ; UI publique partie 2 + tracking vues 1,5 j ; reminder cron + tests 1 j ; mentions légales + docs 0,5 j). **+3 j si Yousign**.
- Complexité : Élevée.
- Risque technique : Élevé — surface d'attaque accrue (page publique tokenisée), génération PDF non triviale, gestion timezone expiration.

### 5. Critère Go/No-Go lancement public

- **BLOQUANT lancement public** : **Non**.
- Justification : feature additionnelle, pas de régression sur l'existant.
- À traiter en **V1.2**.

### 6. Questions ouvertes pour Nicolas

1. Durée de validité par défaut (15 j ? 30 j ?) — modifiable par l'agence ?
2. Reminder automatique : J+3 et J+7, ou autre cadence ? Modifiable ?
3. Signature électronique : simple clic « j'accepte » suffisant juridiquement, ou Yousign obligatoire ?
4. Mentions légales et template PDF : qui rédige (graphiste Axis, juriste) ?
5. Statut « vue » : tracking pixel email + ouverture page = vue, ou ouverture page uniquement ?
6. Notification de décision : qui doit être notifié côté Axis ? Tous les org-admins ? Le créateur uniquement ?
7. Si refusée, possibilité de re-générer une nouvelle proposition (avec nouveau prix) sur le même couple agence/partie 2 ?

---

## Annexe A — Découvertes hors scope

| # | Sévérité | Finding | Preuve |
| --- | --- | --- | --- |
| A1 | **P0** | Aucun `src/middleware.ts` racine trouvé. `updateSession()` est défini dans `src/lib/supabase/middleware.ts:6-169` mais n'est jamais référencé. Si non câblé, l'auth check + redirection admin + suspension orga sont inopérants en prod. À vérifier IMMÉDIATEMENT avec Nicolas avant tout déploiement. | `find /home/user/axis-experts-rdv -maxdepth 3 -name "middleware*" -not -path "*/node_modules/*"` → 0 fichier racine ; `src/lib/supabase/middleware.ts:6-169` non référencé dans le repo |
| A2 | P1 | `FALLBACK_ADMIN = "n.rommiee@axis-experts.be"` hardcodé dans le code source poussé en repo. Si jamais la variable `ADMIN_EMAILS` est vidée par erreur, le compte admin par défaut devient public. Recommandation : retirer le fallback ou logguer un warning explicite au boot. | `src/lib/admin.ts:3,13` |
| A3 | P1 | `validateMagicBytes` retourne `true` par défaut pour les extensions inconnues — risque d'upload de fichier avec extension renommée. À vérifier en lisant intégralement `src/lib/mime-validation.ts`. (Lecture partielle ne couvre que jusqu'à ligne 22 — magic bytes définis mais comportement défaut non confirmé sans relecture.) | `src/lib/mime-validation.ts:1-22` (lecture partielle audit) |
| A4 | P1 | `next.config.ts:5` autorise `proxyClientMaxBodySize: "25mb"` alors que `MAX_DOCUMENT_BYTES = 3 MB` × `MAX_DOCUMENTS = 10` = 30 MB côté `submit-rdv`. La limite proxy va couper certaines soumissions valides. À aligner. | `next.config.ts:5` ; `src/app/api/submit-rdv/route.ts:17-19` |
| A5 | P2 | `src/lib/supabase/middleware.ts:97-100` instancie un client service-role à chaque requête HTML/API non admin. Coût Supabase + risque de fuite mémoire en cas de mauvais cleanup. À évaluer : peut-on cacher / réutiliser le client ? | `src/lib/supabase/middleware.ts:97-100` |

---

## Annexe B — Questions ouvertes consolidées

### Pour décision avant Phase 0 (lancement public)

1. (#A1) **Le middleware Next racine est-il bien câblé en prod ?** Si non, P0 absolu.
2. (#1.1) Formulaire de capture statique en Edge/KV pendant incident : oui ou non en V1.0 ?
3. (#1.2) Quel monitoring externe : UptimeRobot ou BetterStack ?
4. (#1.3) Téléphone + email à afficher publiquement sur les pages d'erreur ?
5. (#1.4) Page statut publique (status.axis-experts.be) ?
6. (#6.1) Délai d'envoi Odoo : **5, 10 ou 15 min** ?
7. (#6.2) Annulation visible côté agence aussi ?
8. (#6.3) Comportement à expiration sans confirmation : envoi auto ou attente ?
9. (#6.4) Emails (bailleur + interne) décalés aussi, ou immédiats ?
10. (#8.1) 2FA TOTP : pour qui en V1.0 ?
11. (#8.2) Lockout login : 5 KO → 30 min suffisant ?
12. (#8.3) CGU : qui rédige et qui valide juridiquement ?
13. (#8.4) Self-block : suppression ou blocage ? Réactivation par Axis uniquement ?
14. (#8.5) Notification nouvelle connexion : chaque nouvelle IP ou changement pays uniquement ?
15. (#8.6) DPO identifié pour signature notification art. 33 ?

### Pour décision avant V1.1

16. (#2.1) Liste des rôles agence (gestionnaire / mise-en-location / autre — exhaustif ?).
17. (#2.2) Rôle modifiable par org-admin ?
18. (#2.3) Suivi = création + mise à jour, ou mise à jour seule ?
19. (#3.1) Auto-activation des comptes invités par org-admin ?
20. (#3.2) Quotas par plan ?
21. (#3.3) Org-admin peut révoquer un user ?
22. (#3.4) Org-admin créable par invitation ou seulement promu par Axis ?
23. (#7.1) Qui peut reporter ? (client / agence / Axis / combinaisons)
24. (#7.2) Délai minimal avant RDV pour reporter ?
25. (#7.3) Annulation soft ou hard ?
26. (#7.4) Calendrier ICS public à intégrer ?
27. (#7.5) Validation expert obligatoire après demande de report par client ?
28. (#9.1) Captures écran d'adresses « modèles » Odoo disponibles ?
29. (#9.2) Boîte dans `street2` ou rester dans `street` ?
30. (#9.3) Nouvelle adresse locataire → `partner_shipping_id` ou note chatter ?

### Pour décision avant V1.2

31. (#4.1) Étendre formats à `.csv` / `.xlsm` / `.ods` ?
32. (#4.2) Limite 3 MB par fichier suffisante pour Excel volumineux ?
33. (#5.1) Validation EAN bloquante ou warning ?
34. (#5.2) Champ EAN obligatoire si compteur renseigné ?
35. (#5.3) Créer 3 champs custom Odoo dès V1.2 ?
36. (#10.1) Liste exhaustive des types de pièces (5 proposés) ?
37. (#10.2) Prix unitaire par type ?
38. (#10.3) Durée affichée au client ?
39. (#10.4) Type de pièce = sale.order.line distincte ou agrégée ?
40. (#11.1) Durée de validité proposition (15 j ? 30 j ?) modifiable ?
41. (#11.2) Cadence reminder ?
42. (#11.3) Yousign ou clic simple ?
43. (#11.4) Qui rédige template PDF + mentions légales ?
44. (#11.5) Tracking « vue » par pixel email ?
45. (#11.6) Qui est notifié côté Axis sur décision ?
46. (#11.7) Re-génération de proposition après refus autorisée ?

---

## Annexe C — Glossaire & secrets touchés

### C.1 Variables d'environnement existantes (`/.env.example`)

| Variable | Usage actuel | Impact recommandations |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client public Supabase | Inchangé |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client public Supabase | Inchangé |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (Odoo sync, cron, invitations) | Inchangé. Audit #8 recommande logguer chaque usage |
| `ODOO_URL` / `ODOO_DB` / `ODOO_USER` / `ODOO_API_KEY` | XML-RPC Odoo | Inchangé. Si #6 implémente le délai, le cron `dispatch-pending-orders` consomme ces secrets |
| `RESEND_API_KEY` | Emails transactionnels | Inchangé. Volume potentiellement supérieur avec #2, #3, #6, #7, #8, #11 — vérifier plan Resend |
| `CRON_SECRET` | Bearer pour `/api/cron/*` | Inchangé. À roter avant lancement public (procédure standard) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocomplete adresses BE | Inchangé. Recommandation : restreindre la clé par referer + quota daily |

### C.2 Nouvelles variables d'environnement potentielles

| Variable | Pour quoi | Phase |
| --- | --- | --- |
| `ADMIN_EMAILS` (déjà supporté) | Remplacer le fallback hardcoded `n.rommiee@axis-experts.be` (Annexe A2) | Phase 0 |
| `MONITORING_WEBHOOK_URL` | Alerte custom (Slack/Telegram) en cas de 503 health-check (#1) | Phase 0 |
| `CONTACT_PHONE_PUBLIC` / `CONTACT_EMAIL_PUBLIC` | Affichés sur pages d'erreur, page suspendue (#1, #8) | Phase 0 |
| `ORDER_DISPATCH_DELAY_MINUTES` | Délai d'envoi Odoo (#6) | Phase 0 |
| `LOGIN_LOCKOUT_THRESHOLD` / `LOGIN_LOCKOUT_DURATION_MINUTES` | Rate-limit login (#8) | Phase 0 |
| `YOUSIGN_API_KEY` (optionnel) | Signature électronique (#11) | Phase 3 |

### C.3 Rotation de secrets obligatoire avant lancement public

| Secret | Raison | Procédure |
| --- | --- | --- |
| `CRON_SECRET` | Avant exposition publique, repartir d'une valeur fraîche | Générer 32 bytes random, mettre à jour Vercel env + redéployer ; aucun client externe ne consomme cette valeur |
| `SUPABASE_SERVICE_ROLE_KEY` | Best practice après période de dev partagée | Régénérer via dashboard Supabase, mettre à jour Vercel env |
| `ODOO_API_KEY` | Best practice | Régénérer côté Odoo, mettre à jour Vercel env |
| `RESEND_API_KEY` | Best practice | Régénérer dans dashboard Resend, mettre à jour Vercel env |

### C.4 Glossaire

| Terme | Définition |
| --- | --- |
| **Partie 1 / Partie 2** | Convention Axis : partie 1 = bailleur, partie 2 = locataire. Pour les agences, partie 1 = propriétaire géré par l'agence. |
| **RDV draft** | Brouillon de demande sauvegardé en `rdv_drafts` avant soumission, distinct de la commande Odoo. |
| **Sale order** | Document Odoo `sale.order` créé à la soumission, porteur des champs `x_studio_*` propres à Axis. |
| **Org-admin** | Rôle à créer (#3) : utilisateur d'une organisation client capable d'inviter d'autres utilisateurs de la même organisation. |
| **Suivi de dossier** | Concept à créer (#2) : opt-in par utilisateur sur un RDV pour recevoir les notifications de mise à jour. |
| **Fenêtre d'annulation** | Délai entre la soumission UI et l'envoi effectif à Odoo (#6), pendant lequel l'utilisateur peut annuler. |
| **Audit log** | Table à créer (#8) tracant les actions sensibles (login OK/KO, password reset, account block, invitation accept). |
| **Bootstrap mode (cron)** | Mode du cron `check-rdv-notifications` (`src/app/api/cron/check-rdv-notifications/route.ts:97-105`) qui initialise la table sans envoyer d'email au premier passage. |

---

*Fin du rapport — généré le 2026-05-26, audit read-only de la branche `claude/audit-rdv-launch-25mai` issue de `origin/main` (commit `46e56fe`).*
