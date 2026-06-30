# AUDIT NOTIFICATIONS & PRÉFÉRENCES AGENCE — axis-experts-rdv
## Audit pur complémentaire (lecture seule) — branche notifications/préférences

**Date :** 2026-06-30
**Complète :** `AUDIT_AGENCE_2026-06-30.md` (branche `claude/audit-agency-org-experience-i1dbec`),
section C (notifications). Ce document **ne ré-audite pas** les constats déjà établis
(`client_type` dupliqué sans helper `isAgency`, `odoo_agency_id` jamais peuplé, garde
`isAdmin` par allowlist, 2 prefs/3) ; il les **prolonge** avec les décisions produit
désormais actées et trace les chemins « pref → envoi » et « commande → demandeur ».

**Méthode :** chaque constat est prouvé par `fichier:ligne`. Les points non prouvables par
le code seul sont marqués `⚠️ NON VÉRIFIÉ` (nécessitent un runtime Odoo/Supabase live).
**Aucune modification de code applicatif.** Un seul fichier produit : ce rapport.

---

## 1. Résumé exécutif

- **Identité du « demandeur connecté » (priorité a) : RÉSOLUE, table `portal_submissions`.**
  À chaque soumission, `submit-rdv` insère `(odoo_order_id, odoo_order_name, user_id,
  organization_id)` (`src/app/api/submit-rdv/route.ts:1326-1333`). Le mode `creator_only`
  s'en sert déjà pour retrouver l'email du demandeur d'une commande
  (`src/lib/notification-recipients.ts:69-79`). **C'est la base prête à l'emploi du
  destinataire par défaut** de la confirmation RDV (N3) et du rapport (N4).
- **Où vivent les prefs + qui les édite (priorité b) :** 5 colonnes sur `organizations`
  (migration `20260521120000_…:56-68`), **lues/écrites uniquement** par des routes
  `/api/admin/...` gardées `isAdmin` (allowlist email, `src/lib/admin.ts:18-21`). **Aucune
  route portail.** Verrou self-service réel : `organizations` n'a **qu'une policy RLS
  SELECT**, **pas d'UPDATE** (`supabase/migrations/organizations.sql:29-31`) → un client
  utilisateur ne peut pas écrire la fiche org.
- **Correction d'un constat C4 :** les 2 prefs `notify_on_create`/`notify_on_update`
  pilotent **toutes deux le MÊME email RDV date/heure** (cron), distinguées par « date
  initiale » vs « date modifiée » (`check-rdv-notifications/route.ts:315-322`). Elles ne
  gardent **pas** l'email de confirmation de commande (qui part au bailleur, sans pref,
  `submit-rdv:1147-1176`). Donc la pref « confirmation commande EDL » **n'existe pas encore
  réellement** comme toggle.
- **3 chantiers — faisabilité :** (1) **Self-service des prefs : moyen** (UI/garde à créer,
  RLS à ouvrir ou route admin-client gardée). (2) **Confirmation RDV au demandeur +
  multi-destinataires : moyen** (email + identité demandeur prêts ; reste le sélecteur et le
  peuplement `odoo_agency_id`). (3) **Rapport → intervenant n°1 : complexe** (tout est à
  créer côté envoi ; dépend d'Odoo).
- **Vrais points durs :** (i) `odoo_agency_id` jamais peuplé bloque silencieusement la
  notif agence ; (ii) `x_studio_conseil_intervenant_1_` jamais écrit aujourd'hui ; (iii)
  aucun mécanisme d'envoi de rapport ; (iv) RLS org en lecture seule pour le self-service.

---

## 2. N1 — Système de préférences EXISTANT (admin-only)

### 2.1 Où les prefs sont STOCKÉES
5 colonnes sur la table `organizations` (régularisées par migration) :

| Colonne | Type / défaut | Preuve |
|---|---|---|
| `notifications_enabled` | BOOLEAN NOT NULL DEFAULT false | `supabase/migrations/20260521120000_regularize_notifications_and_product_catalog.sql:56` |
| `notification_recipients_mode` | TEXT NOT NULL DEFAULT `'all_org_users'` | `:59` |
| `notification_custom_emails` | JSONB NOT NULL DEFAULT `'[]'` | `:62` |
| `notify_on_create` | BOOLEAN DEFAULT true | `:65` |
| `notify_on_update` | BOOLEAN DEFAULT true | `:68` |

- CHECK sur `notification_recipients_mode IN ('creator_only','all_org_users','custom_list')` :
  même migration, bloc `DO $$` (≈ `:74-88`).
- **`⚠️ NON VÉRIFIÉ` :** les routes/cron contiennent un *fallback* « colonnes non encore
  migrées » (`notifications/route.ts:60-71`, `:266-284` ; `check-rdv-notifications:272-285`)
  → indice que le schéma a pu diverger en prod. À confirmer en base.

### 2.2 Où elles sont LUES / ÉCRITES, et le garde-fou admin
- **LECTURE :** `GET /api/admin/organizations/[id]/notifications/route.ts:50-71` (client
  service-role `createAdminClient()` `:48`, qui **bypass le RLS**).
- **ÉCRITURE :** `PATCH` même fichier, `:257-284` (update + select).
- **Garde admin :** `requireAdmin()` `notifications/route.ts:19-37` → `isAdmin(user.email)`
  `:30`, refus **`"Accès refusé"` (403)** `:32`. `isAdmin` = allowlist d'emails
  `src/lib/admin.ts:18-21` (env `ADMIN_EMAILS`, sinon fallback `n.rommiee@axis-experts.be`
  `:3`). **C'est exactement le garde du Bloc D** de l'audit précédent (audit §3).
- **UI :** `src/app/admin/organizations/[id]/NotificationsTab.tsx` (modes `:44-48`, type
  `NotificationsConfig` `:19-25`) — onglet admin uniquement.

### 2.3 Quel envoi ces 2 prefs déclenchent réellement (chemin pref → envoi)
**Une seule famille d'emails est gardée par ces prefs : la notification RDV date/heure
(cron).**
- Cron `src/app/api/cron/check-rdv-notifications/route.ts` scanne les `sale.order` Odoo
  ayant `x_studio_date_prochain_rendez_vous_1` (`:121, 131`).
- Il distingue **`initial`** (1ère date vue, hors bootstrap) vs **`updated`** (date changée)
  `:237-245`.
- Garde par pref : `notificationType === "initial" && !notify_on_create` → skip
  `:315-318` ; `=== "updated" && !notify_on_update` → skip `:319-322`. (Et `notifications_enabled`
  `:300-303`.)
- Destinataires : `resolveNotificationRecipients(...)` `:324-329`. Email : template
  `src/lib/email-templates/rdv-notification.ts` via `buildRdvNotificationEmail` `:347`,
  envoi `sendEmail` `:361`.

> **Constat clé (corrige C4) :** `notify_on_create` ≠ « confirmation de commande EDL ».
> Les deux prefs gardent le **même** email RDV (template `rdv-notification.ts`), selon que la
> **date** est posée pour la 1ère fois ou modifiée. L'email de **confirmation de commande**
> à la soumission part séparément au **bailleur** sans aucune pref
> (`submit-rdv:1147-1176`), et un email **interne** part à `info@axis-experts.be`
> (`submit-rdv:1287-1295`).

- **ÉTAT ACTUEL :** prefs stockées sur `organizations`, lues/écrites admin-only, gardant
  uniquement la notif RDV (initial/updated). · **OÙ BRANCHER :** stockage
  `20260521120000_…:56-68` ; lecture/écriture `notifications/route.ts:50-71, 257-284` ;
  garde `admin.ts:18-21` ; consommation `check-rdv-notifications/route.ts:300-329`. ·
  **FAISABILITÉ :** n/a (constat). · **DÉCISION PRODUIT RESTANTE :** clarifier la sémantique
  produit des 2 toggles (RDV initial vs modifié) vs le libellé attendu (« confirmation
  commande » / « confirmation date/heure »), car le mapping actuel diffère du libellé C4.

---

## 3. N2 — Self-service : exposer les préférences à l'agence connectée

### 3.1 Écran de réglages côté portail ?
- **Aucun écran de préférences/organisation côté portail.** Pages portail existantes :
  `/dashboard`, `/demande`, `/profil`, `/brouillons`, `/confirmation`, `/cgu-required`,
  `/account-suspended` (inventaire `src/app/*/page.tsx`). La **seule** UI de config
  utilisateur est `/profil` (`src/app/profil/page.tsx`), qui n'édite que `first_name` /
  `last_name`.
- **Point d'accroche naturel :** la page `/profil` et son bouton d'accès dans l'en-tête
  dashboard (`src/app/dashboard/page.tsx:552-564`, `router.push("/profil")` `:554`). Pas de
  layout/sidenav portail partagé (chaque page rend son propre en-tête).

### 3.2 Identification serveur de l'org du connecté (réutilisable)
Pattern établi et **directement réutilisable** : résoudre `organization_id` depuis
`portal_clients` via `user.id`.
- `src/app/api/profile/route.ts:44-48` (GET) et `:108-112` (PATCH, client utilisateur + RLS).
- `src/app/api/custom-fields/route.ts:18-22` → puis lecture org-scopée via admin-client `:28-36`.
- `src/app/api/rdv-custom-values/route.ts:40-44` (résolution org_id) ; `auth/me/route.ts`.

> **Modèle de route self-service idéal (déjà présent) :** `custom-fields/route.ts:18-36` —
> client **utilisateur** (RLS) pour résoudre `organization_id`, puis client **admin** pour
> lire/écrire les données scopées à cette org avec contrôle applicatif « c'est bien mon org ».
> Une route portail de prefs suivrait ce schéma.

### 3.3 Ce qui empêche aujourd'hui une agence d'éditer ses prefs
- **RLS `organizations` : SELECT seulement, pas d'UPDATE.** Policy unique
  `supabase/migrations/organizations.sql:29-31` (lecture de SA propre org). **Aucune policy
  UPDATE** → un client utilisateur ne peut pas modifier la fiche org. Seul le service-role
  (admin-client) écrit (et bypass le RLS).
- Par contraste, `portal_clients` **a** une policy UPDATE par-utilisateur
  (`supabase/migrations/20260417104648_portal_clients_update_policy.sql:16-20`,
  `auth.uid() = user_id`) — c'est ce qui rend `/api/profile` self-service.
- **Conséquence :** rendre les prefs éditables par l'agence implique soit (a) **une nouvelle
  route portail en admin-client + garde « mon org »** (modèle `custom-fields`), soit (b)
  **une policy RLS UPDATE** sur `organizations` (délicate : RLS ne restreint pas par colonne
  → exposerait toute la fiche org, sauf à passer par une fonction `SECURITY DEFINER`).

- **ÉTAT ACTUEL :** pas d'écran ni de route portail pour les prefs ; RLS org en lecture
  seule. · **OÙ BRANCHER :** écran `src/app/profil/page.tsx` (+ entrée en-tête
  `dashboard/page.tsx:552-564`) ; nouvelle route portail calquée sur
  `custom-fields/route.ts:18-36` ; verrou RLS `organizations.sql:29-31`. · **FAISABILITÉ :**
  moyen. · **DÉCISION PRODUIT RESTANTE :** (i) per-org (toute l'agence partage) ou
  per-utilisateur ? (ii) qui dans l'agence a le droit d'éditer (tout membre, ou un « gérant »
  — concept de rôle inexistant aujourd'hui) ? (iii) route admin-client gardée vs RLS UPDATE.

---

## 4. N3 — Confirmation DATE/HEURE du RDV : destinataires

### 4.1 Prérequis `odoo_agency_id` jamais peuplé — confirmé
- Le cron matche l'org via `odoo_partner_id` **OU** `odoo_agency_id`
  (`check-rdv-notifications/route.ts:253-255, 263-270`). Si l'org agence n'a pas
  `odoo_agency_id`, **elle n'est pas notifiée**.
- `odoo_agency_id` n'est **écrit que par l'admin** (création/édition de fiche) :
  `src/app/api/admin/organizations/route.ts:106-126`,
  `src/app/api/admin/organizations/[id]/route.ts:134-138`, formulaire
  `admin/organizations/[id]/page.tsx:620-624`. **Jamais écrit dans le flux de création de
  commande.**
- **Où l'org agence est résolue dans le flux :** `src/lib/odoo/resolve-agency.ts:90-123`
  (`resolveAgentAgency(email)` → `agencyId` = `parent_id` société) ; appelée par
  `submit-rdv:647`. **Mais cette résolution écrit l'ID dans le champ Odoo de la commande**
  (`x_studio_many2one_field_4ea_1jrimutbv` / `x_studio_agence_partenaire`,
  `submit-rdv:649-653`), **pas dans `organizations.odoo_agency_id`** (Supabase). C'est
  l'endroit naturel pour, à terme, renseigner aussi la colonne Supabase.

### 4.2 « La personne connectée qui a fait la demande » sur une commande
- **Persisté dans Supabase, table `portal_submissions`** : insert
  `(odoo_order_id, odoo_order_name, user_id, organization_id)` à la soumission
  (`submit-rdv:1326-1333`). `user_id` = l'utilisateur authentifié (`user` depuis
  `supabase.auth.getUser()` `submit-rdv:108`).
- **Lecture du demandeur :** `notification-recipients.ts:69-79` — mode `creator_only` :
  `portal_submissions.select("user_id").eq("odoo_order_id", orderId)` puis
  `auth.admin.getUserById(user_id)` → email. **C'est le destinataire par défaut prêt à
  l'emploi.**
- L'email du demandeur n'est **pas** stocké comme champ sur la commande Odoo ; le lien
  user↔order vit **uniquement** dans `portal_submissions`. `⚠️ NON VÉRIFIÉ` : aucune
  migration `portal_submissions` dans le repo (grep `supabase/` = 0) → schéma hors-repo, à
  confirmer en base.

### 4.3 Email RDV date/heure : existe-t-il déjà ?
- **Oui, réutilisable.** Cron `check-rdv-notifications/route.ts` + template
  `rdv-notification.ts` (`buildRdvNotificationEmail`, sujet « [Axis Experts] RDV
  planifié/mis à jour »). Trigger : changement de
  `x_studio_date_prochain_rendez_vous_1`. Destinataires via
  `resolveNotificationRecipients` (`:324-329`). **Aujourd'hui le demandeur n'est ciblé que
  si le mode est `creator_only`** ; les modes `all_org_users`/`custom_list` ne le ciblent pas
  spécifiquement.

### 4.4 Inventaire des données pour un sélecteur multi-destinataires
*(inventaire seul — aucune conception d'UI)*

| Cible voulue | Donnée disponible | Preuve |
|---|---|---|
| Demandeur connecté | `portal_submissions.user_id` → email | `submit-rdv:1326-1333` ; `notification-recipients.ts:69-79` |
| Toute l'org (membres) | `portal_clients` filtré `organization_id` (actifs) → `user_id` → email | `notification-recipients.ts:28-47` ; `notifications/route.ts:80-96` |
| Emails saisis manuellement | `organizations.notification_custom_emails` (JSONB) | `20260521120000_…:62` ; validés `notification-recipients.ts:18-22` |
| Invités (pending/used) | table `invitations` (`email`, `organization_id`, `used_at`) | `supabase/migrations/invitations_v2.sql:13-23` |
| « Toute l'org SAUF certains » | **Aucune structure d'exclusion existante** | — (à créer) |

- **ÉTAT ACTUEL :** email RDV + identité demandeur prêts ; agence notifiée seulement si
  `odoo_agency_id` peuplé. · **OÙ BRANCHER :** peuplement `odoo_agency_id`
  (`submit-rdv:647-653` côté flux, ou `[id]/route.ts:134-138` côté admin) ; destinataire par
  défaut `notification-recipients.ts:62-86` ; ciblage `check-rdv-notifications:324-329`. ·
  **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT RESTANTE :** comment peupler `odoo_agency_id`
  (rétro-remplissage + à la création) ; sémantique des modes (le demandeur doit-il être
  ajouté en plus des modes existants ?) ; gestion du cas « org sauf certains » (nouvelle
  structure).

---

## 5. N4 — Envoi du RAPPORT d'expertise → intervenant n°1

### 5.1 Mécanisme d'envoi/partage du rapport — reconfirmé : INEXISTANT
- Aucun template rapport, aucun envoi, aucune génération PDF (0 dépendance pdf/puppeteer ;
  0 champ `x_studio_rapport`). « Rapport » n'apparaît que dans le **texte descriptif produit**
  Odoo (`submit-rdv:739-740` ; `src/lib/public-rdv/odoo-order.ts:29-31`), pas comme feature.
- **Le rapport pourrait exister comme `ir.attachment` Odoo** sur la `sale.order` : la route
  `src/app/api/odoo/attachments/route.ts:62-70` **lit** les pièces jointes
  (`res_model="sale.order"`), et `attachments/download/route.ts` permet le téléchargement.
  Mais **rien n'identifie quelle pièce est « le rapport »**, ni ne l'envoie : le cycle de vie
  (à quel moment, quel format) est **`⚠️ NON VÉRIFIÉ`** (dépend d'Odoo : qui dépose le PV PDF
  et avec quel nommage).

### 5.2 `x_studio_conseil_intervenant_1_` écrit aujourd'hui ?
- **Non.** Grep : seul `x_studio_conseil_intervenant_2_` est écrit (le **représentant**,
  `submit-rdv:692`). `…intervenant_1_` n'apparaît **nulle part** dans `src/`. Le champ reste
  vide à la création.
- **Où l'écrire pour pointer vers le demandeur connecté :** dans le payload `orderValues`
  (`submit-rdv:665-693`). La valeur naturelle = la fiche `res.partner` **individuelle de
  l'agent connecté**, déjà résolue : `resolveAgentAgency(user.email).agentContactId`
  (`resolve-agency.ts:81` ; déjà disponible dans `submit-rdv:647-653` via `agencyStampFields`).
  CONSTAT, pas de modif.

### 5.3 Conséquences Odoo d'écrire ce champ
- **`⚠️ NON VÉRIFIÉ` (zone runtime Odoo).** Le repo ne révèle pas qui d'autre lit
  `x_studio_conseil_intervenant_1_` ni quelles automatisations Odoo en dépendent (workflows,
  rapports, droits). À valider sur un Odoo de test avant toute écriture.

- **ÉTAT ACTUEL :** envoi rapport inexistant ; intervenant n°1 jamais écrit. · **OÙ
  BRANCHER :** écriture champ `submit-rdv:665-693` (valeur `agentContactId`,
  `resolve-agency.ts:81`) ; lecture/dépôt rapport `odoo/attachments/route.ts:62-70`. ·
  **FAISABILITÉ :** complexe (tout l'envoi à créer ; dépend d'Odoo). · **DÉCISION PRODUIT
  RESTANTE :** définir côté Odoo l'événement « rapport transmis » + le format/nommage du
  fichier ; confirmer la sémantique de `…intervenant_1_` (destinataire rapport) et l'absence
  d'effets de bord.

---

## 6. N5 — Stockage des nouvelles préférences (cartographie, pas conception)

Les prefs cibles : (1) confirmation **commande EDL** — **n'existe pas réellement** comme
toggle aujourd'hui (cf. N1/§2.3), (2) confirmation **date/heure RDV** — `notify_on_update`
(et `notify_on_create`) existent côté cron, (3) **réception rapport** — inexistante ; plus
les **réglages destinataires** (mode + emails).

Options que l'architecture rend naturelles (sans trancher) :

- **Option A — Par-org, sur `organizations` (continuité).** Les 5 colonnes y vivent déjà
  (`20260521120000_…:56-68`) avec `notification_recipients_mode` + `notification_custom_emails`.
  Ajouter `notify_on_report` (+ éventuel toggle « confirmation commande ») y serait cohérent.
  **Avantage :** un seul lieu, déjà consommé par cron/admin. **Limite :** granularité
  uniquement par-org ; et édition self-service bloquée par le RLS lecture-seule (N2/§3.3).
- **Option B — Par-utilisateur, sur `portal_clients` (ou table dédiée user).**
  `portal_clients` a déjà une policy RLS UPDATE par-utilisateur
  (`20260417104648_…:16-20`), ce qui rendrait le self-service **immédiat** sans nouvelle
  route admin-client. **Avantage :** « chaque membre choisit ce qu'il reçoit ». **Limite :**
  duplique la logique destinataires ; dispersion org vs user.
- **Option C — Table dédiée `notification_preferences`** (clé `organization_id` et/ou
  `user_id`). **Avantage :** modèle propre, extensible (par-event, exclusions « org sauf
  certains » de N3). **Limite :** plus de migration/refactor ; à arbitrer vs A/B.
- **Réglages destinataires (N3) :** réutilisent `notification_recipients_mode` /
  `notification_custom_emails`. Le cas « toute l'org **sauf** certains » n'a **aucune
  structure** aujourd'hui → nouvelle colonne/liste d'exclusion quel que soit A/B/C.

- **ÉTAT ACTUEL :** prefs par-org sur `organizations` ; pas de couche par-utilisateur ni
  d'exclusion. · **OÙ BRANCHER :** `20260521120000_…:56-68` (org) vs `portal_clients`
  (`20260417104648_…:16-20`, user). · **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT
  RESTANTE :** par-org vs par-utilisateur vs table dédiée ; où loger les exclusions.

---

## 7. Tableau récapitulatif

| ID | Sujet | Existe déjà ? | À créer | Faisabilité | Fichier:ligne |
|----|-------|---------------|---------|-------------|---------------|
| N1 | Prefs stockage (5 colonnes org) | Oui | — | n/a | `20260521120000_…:56-68` |
| N1 | Prefs lecture/écriture (admin) | Oui, admin-only | — | n/a | `notifications/route.ts:50-71, 257-284` |
| N1 | Garde-fou édition (allowlist) | Oui | — | n/a | `admin.ts:18-21` ; `notifications/route.ts:30` |
| N1 | Chemin pref → envoi (RDV cron) | Oui (1 seul email gardé) | clarif. mapping | n/a | `check-rdv-notifications/route.ts:300-361` |
| N2 | Écran prefs portail (self-service) | Non (seul `/profil`) | UI + route | moyen | `profil/page.tsx` ; `dashboard/page.tsx:552-564` |
| N2 | Identité org serveur (réutilisable) | Oui | — | simple | `custom-fields/route.ts:18-36` |
| N2 | Verrou RLS (org lecture-seule) | Oui (SELECT only) | UPDATE ou route admin-client | moyen | `organizations.sql:29-31` |
| N3 | `odoo_agency_id` peuplé | Non (admin manuel) | peuplement auto | moyen | `submit-rdv:647-653` ; `[id]/route.ts:134-138` |
| N3 | Identité « demandeur » sur commande | Oui (`portal_submissions`) | — | simple | `submit-rdv:1326-1333` ; `notification-recipients.ts:69-79` |
| N3 | Email RDV date/heure | Oui | ciblage demandeur | moyen | `check-rdv-notifications/route.ts` ; `rdv-notification.ts` |
| N3 | Données multi-destinataires | Oui (sauf exclusions) | sélecteur + exclusions | moyen | `notification-recipients.ts:28-47` ; `invitations_v2.sql:13-23` |
| N4 | Envoi/partage rapport | Non (inexistant) | template + cron + déclencheur | complexe | inexistant ; `attachments/route.ts:62-70` |
| N4 | `x_studio_conseil_intervenant_1_` écrit | Non (`_2_` seul écrit) | écriture champ | moyen | `submit-rdv:692, 665-693` ; `resolve-agency.ts:81` |
| N5 | Couche stockage prefs | Org (A) prêt ; user (B) possible | choix A/B/C + exclusions | moyen | `20260521120000_…:56-68` ; `20260417104648_…:16-20` |

---

## 8. Dépendances & ordre de chantier suggéré (description seule)

1. **Socle identité (prérequis de tout) :** confirmer `portal_submissions` en base
   (demandeur connecté, N3/§4.2) et **peupler `odoo_agency_id`** sur les orgs agence
   (N3/§4.1) — sinon ni la notif agence ni le rapport ne savent à qui parler. Décider du
   rétro-remplissage des commandes existantes.
2. **Stockage & droits (N5 + N2/§3.3) :** trancher par-org vs par-utilisateur ; selon le
   choix, ouvrir l'écriture (route portail admin-client gardée « mon org », ou RLS UPDATE).
   C'est le **prérequis du self-service**.
3. **Self-service prefs (N2) :** brancher l'écran sur `/profil` + route portail, en
   réutilisant le pattern `custom-fields/route.ts:18-36`. Inclut clarification du mapping des
   toggles (N1/§2.3) et ajout du toggle « réception rapport » (colonne `notify_on_report`).
4. **Confirmation RDV au demandeur + multi-destinataires (N3) :** étendre le ciblage du cron
   pour inclure le demandeur par défaut, alimenter le sélecteur par les sources §4.4 ;
   gérer le cas « org sauf certains » (nouvelle structure).
5. **Rapport → intervenant n°1 (N4, le plus lourd) :** d'abord côté **Odoo** (définir
   l'événement « rapport transmis », format/nommage du PV PDF, sémantique
   `…intervenant_1_`), puis côté portail (écriture du champ à la création
   `submit-rdv:665-693`, nouveau template + déclencheur d'envoi).

---

## 9. Zones non vérifiables sans runtime (Odoo/Supabase live)

- **Schéma Supabase :** présence réelle des 5 colonnes notifications et de
  `portal_submissions` en prod (les fallbacks « colonnes non migrées » suggèrent une
  divergence possible : `notifications/route.ts:60-71` ; `check-rdv-notifications:272-285`).
- **`odoo_agency_id` :** valeur réellement renseignée (ou non) sur les orgs agence.
- **Odoo — rapport :** existe-t-il un `ir.attachment` « rapport/PV PDF » sur les
  `sale.order`, à quel moment du cycle, sous quel nommage (pour pouvoir le repérer/envoyer).
- **Odoo — `x_studio_conseil_intervenant_1_` :** qui le lit, quelles automatisations en
  dépendent, effets de bord d'une écriture (N4/§5.3).
- **`ADMIN_EMAILS` vs email connecté :** confirme qui peut éditer aujourd'hui (lien Bloc D).

**À fournir pour lever ces points :** accès lecture Supabase (schéma + lignes
`organizations`/`portal_clients`/`portal_submissions`), variables d'env (`ADMIN_EMAILS`,
`CRON_SECRET`), et un compte Odoo de test pour inspecter pièces jointes et champs
`x_studio_*` d'une commande agence.

---
*Fin de l'audit complémentaire. Aucun fichier de code applicatif modifié.*
