# AUDIT — Fork / white-label du portail RDV `axis-experts-rdv`

> **Nature de ce document :** audit en LECTURE SEULE. Aucun code applicatif, aucune DB, aucun
> déploiement n'a été modifié. Objectif : inventorier l'existant, isoler tout ce qui est
> *tenant-specific*, et produire une base directement exploitable pour un devis de duplication
> vers une structure tierce indépendante.
>
> Date : 2026-05-29 · Commit auditté : branche de travail courante · Périmètre : repo complet.

---

## 0. Notes préalables (écarts constatés avec le brief)

1. **Référence projet Supabase.** Le brief cite la ref `psbcebctdkxuqnoxgwrs`. Cette chaîne
   **n'existe nulle part** dans le repo. La seule ref Supabase trouvée en dur est dans un
   **commentaire** : `supabase/migrations/20260416120000_user_soft_delete_and_blocking.sql:12`
   → projet `(woaxmqckupcgwsjbnlep)`. **Bonne nouvelle pour le fork :** la connexion Supabase
   est 100 % pilotée par variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, etc.) ; aucune
   ref n'est codée en dur dans l'application. Le commentaire est documentaire et sans impact
   fonctionnel.
2. **Branche.** Le brief proposait `claude/audit-fork-rdv`. Conformément aux consignes
   d'environnement de cette session, l'audit a été réalisé et committé sur la branche de
   développement désignée (`claude/inspiring-hopper-FPjAZ`). Aucun fichier autre que le présent
   `AUDIT_FORK_RDV.md` n'a été créé/modifié.
3. **Schéma DB incomplet dans le repo (RISQUE MAJEUR).** Trois tables utilisées par le code
   **n'ont aucune migration** dans `supabase/` : `portal_submissions`, `rdv_notifications_sent`
   (aucune définition nulle part) et `request_log` (définie seulement dans
   `docs/MIGRATIONS_TO_RUN.md`, pas dans `supabase/migrations/`). Le schéma du repo **ne suffit
   pas** à reconstruire une base fonctionnelle. Voir §B.

---

## 1. Résumé exécutif

### Mono-tenant ou multi-tenant ?

**Réponse nuancée : « multi-organisations à l'intérieur d'un mono-tenant Axis ».**

- ✅ **Couche données = multi-organisations.** Le code gère N organisations via la table
  `organizations` (et `portal_clients`). Chaque org porte sa config : `odoo_partner_id`,
  `odoo_agency_id`, `odoo_template_prefix`, `logo_url`, `product_config`, type de client,
  réglages de notifications, champs personnalisés activés. Ajouter un client AISE / AIS Le Relais
  / Home Invest, etc. = **insertion de données**, pas du code.
- ❌ **Couche marque & intégrations = mono-tenant Axis, en dur.** L'identité (logo, favicon,
  titre, couleurs, CGU, footers), l'émetteur d'emails (`noreply@axis-experts.be`), l'adresse de
  notification interne (`info@axis-experts.be`), l'URL Odoo (`axisexperts.odoo.com`) et surtout
  la **table de mapping `CLIENT_TEMPLATES`** (IDs de devis-types Odoo pour `CPASBXL`/`AXIS`) sont
  **codés en dur**.

**Conclusion :** un fork pour un tiers indépendant **n'est PAS** une simple opération de config.
Il faut (a) provisionner une nouvelle stack (Supabase + Vercel + Resend + Odoo), (b) **modifier
du code** pour remplacer toutes les valeurs Axis en dur, (c) **reconstruire le schéma DB complet**
(les migrations du repo sont incomplètes et non rejouables en l'état), (d) re-mapper les
devis-types Odoo du tiers.

### Complexité globale

**Moyenne à élevée.** Pas de réécriture, mais beaucoup de points de contact dispersés :
~60 occurrences « Axis » dans le code, un mapping Odoo en dur, un schéma DB à reconstituer
manuellement, et une dépendance forte à des **champs Odoo custom `x_studio_*`** que le tiers
devra recréer à l'identique dans SA base Odoo.

### Risques principaux

| # | Risque | Gravité |
|---|--------|---------|
| R1 | **Schéma DB incomplet** : `portal_submissions`, `rdv_notifications_sent`, `request_log` absents des migrations → DB du fork non fonctionnelle si on se fie au repo. | 🔴 Élevé |
| R2 | **Migrations non rejouables** : plusieurs migrations « à exécuter manuellement », ad-hoc, contenant du seed tenant Axis mélangé au structurel. Pas de `supabase db push` propre. | 🔴 Élevé |
| R3 | **Champs Odoo `x_studio_*` custom** : 12 champs custom + tags `ELE/ELS` + devis-types attendus côté Odoo. Si l'Odoo du tiers diffère, la création de commande casse. | 🔴 Élevé |
| R4 | **`CLIENT_TEMPLATES` en dur** : IDs numériques de devis-types valides uniquement dans l'Odoo d'Axis. À remapper pour le tiers, sinon RDV non créés. | 🟠 Moyen |
| R5 | **Branding dispersé** : logo en dur (URL WordPress Axis) sur ~9 pages + favicon + emails + CGU. Oublis faciles. | 🟠 Moyen |
| R6 | **CGU/RGPD** : mentions légales = Axis Experts SRL. Le tiers doit fournir ses propres CGU (responsable de traitement différent). | 🟠 Moyen (juridique) |
| R7 | **Données réelles dans le repo** : emails admin, IDs partenaires Odoo, prix devis-types. Pas secret mais à nettoyer pour le tiers. | 🟢 Faible |

---

## A. Architecture & stack

### Ce qui existe

| Élément | Détail |
|---------|--------|
| Framework | **Next.js `^16.2.5`** (App Router), **React `19.2.4`**, **TypeScript `^5`** |
| ⚠️ Particularité | `AGENTS.md` : *« This is NOT the Next.js you know »* — version avec breaking changes ; docs internes dans `node_modules/next/dist/docs/`. À prendre en compte pour toute reprise. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), thème via `@theme inline` dans `globals.css` ; composants **shadcn/ui** scaffoldés à la main dans `src/components/ui/` |
| Package manager | **pnpm** (`pnpm-lock.yaml`) |
| Tests | **Vitest** + Testing Library (jsdom) — quelques tests unitaires (`*.test.ts`) |
| Lint | ESLint 9 + `eslint-config-next` |
| Déploiement | **Vercel** (`vercel.json`) — 1 cron : `/api/cron/check-rdv-notifications` toutes les 10 min |
| Config Next | `next.config.ts` : `experimental.proxyClientMaxBodySize: "25mb"` (uploads) |
| Middleware | `src/proxy.ts` (proxy Next 16) → `src/lib/supabase/middleware.ts` |

**Dépendances clés** : `@supabase/ssr` + `@supabase/supabase-js` (auth/DB), `resend` (emails),
`xmlrpc` (Odoo), `zod` (validation), `recharts` (stats admin), `react-day-picker` +
`date-fns`/`date-fns-tz` (calendrier/dates), `@googlemaps/js-api-loader` (autocomplete adresses),
`react-markdown` (rendu CGU), Radix UI + `lucide-react` + `sonner` (UI/toasts).

**Structure des dossiers**

```
src/
  app/                 # App Router : pages + API routes
    api/               # ~45 routes (admin, odoo, dactylo, auth, cron, submit-rdv, cgu, drafts…)
    admin/             # back-office (orgs, users, custom-fields, stats)
    (pages portail)    # login, demande, dashboard, brouillons, profil, confirmation, setup-account…
    layout.tsx         # métadonnées + favicon (branding)
    globals.css        # palette / design tokens (branding)
  components/          # ui/ (shadcn), dactylo/, modales métier
  content/cgu-v1.md    # CGU (branding/juridique)
  lib/                 # odoo.ts, email.ts, admin.ts, supabase/, notification-recipients, etc.
  proxy.ts             # middleware
supabase/              # migrations/ + 3 .sql « libres » (migration.sql, messaging.sql, rdv_drafts.sql)
public/                # assets (svg defaults Next + 2 jpg logos legacy)
docs/                  # procédures (clean-launch, migrations, admin users, design system, monitoring…)
```

### Tenant-specific dans ce bloc

- `package.json:2` → `"name": "axis-experts-rdv"` (cosmétique).
- `README.md` = template `create-next-app` par défaut (aucun branding — à réécrire).

### Étapes de duplication

Fork GitHub → renommer le projet → adapter `package.json` name & README → réinstaller (`pnpm i`).
Le socle technique est réutilisable tel quel.

---

## B. Supabase (schéma)

### Ce qui existe (STRUCTUREL — à recréer à l'identique)

**Tables (11 dans le repo) :** `portal_clients`, `organizations`, `invitations`, `rdv_drafts`,
`portal_message_reads`, `custom_fields`, `organization_custom_fields`, `rdv_custom_values`,
`product_catalog`, `user_consents`, `audit_log`.

**Détail des tables principales :**
- `portal_clients` (`supabase/migration.sql`, étendue par de multiples migrations) : 1 user portail
  ↔ 1 partenaire Odoo. Colonnes clés : `user_id` (FK auth.users), `odoo_partner_id`,
  `odoo_agency_id`, `odoo_contact_partner_id`, `odoo_template_prefix`, `nom_societe`,
  `first_name`/`last_name`/`display_name` (généré), `logo_url`, `product_config` (jsonb),
  `client_type`, `organization_id` (FK), traçabilité soft-delete/blocage
  (`deleted_at/by`, `blocked_at/by`). Trigger `portal_clients_updated_at`.
- `organizations` (`supabase/migrations/organizations.sql` + régularisations) : `name`,
  `odoo_partner_id`, `odoo_agency_id`, `odoo_template_prefix` (default `'AXIS'`), `client_type`
  (`social|agency|dactylo`), `logo_url`, `product_config`, contacts, `is_active`, et bloc
  notifications (`notifications_enabled`, `notification_recipients_mode`,
  `notification_custom_emails`, `notify_on_create`, `notify_on_update`). Triggers
  `organizations_updated_at` + `trigger_cascade_org_deactivation`.
- `invitations` (`invitations_v2.sql`) : `token` (uuid unique), `email`, `organization_id`,
  `client_type`, `expires_at`, `used_at`, `created_by`.
- `rdv_drafts`, `portal_message_reads`, `custom_fields` + `organization_custom_fields` +
  `rdv_custom_values` (système de champs perso), `product_catalog` (mapping code→default_code Odoo),
  `user_consents` (RGPD/CGU), `audit_log` (journal d'actions).

**Fonctions / triggers :** `update_updated_at()` ; `cascade_org_deactivation()` (désactiver une org
bloque ses users actifs). **Vues :** aucune.

**RLS :** ~20 policies (lecture/écriture limitées à `auth.uid()` / à l'org de l'utilisateur ;
lecture libre authentifiée pour `custom_fields` & `product_catalog` ; `audit_log` =
service_role only).

**Storage :** 1 bucket privé **`rdv-documents`** (`supabase/migration.sql`) avec policies par
dossier `auth.uid()`.

**Edge Functions :** **AUCUNE**. Pas de `supabase/functions/`, pas de `config.toml`. Le « cron »
est un cron **Vercel** appelant une route Next, pas une Edge Function Supabase.

### ⚠️ Manques structurels (RISQUE R1/R2)

| Table | Utilisée dans le code | Définie dans le repo ? |
|-------|----------------------|------------------------|
| `portal_submissions` | oui (`notification-recipients.ts`, submit-rdv, +1) | ❌ **Aucune migration** |
| `rdv_notifications_sent` | oui (cron notifications) | ❌ **Aucune migration** |
| `request_log` | oui (`rate-limit.ts`) | ⚠️ seulement dans `docs/MIGRATIONS_TO_RUN.md` |

➡️ Le schéma réel de prod a divergé du repo. **Reconstituer ces 3 tables est indispensable** et
demande un dump du schéma Supabase de prod (ou rétro-ingénierie depuis le code).

De plus, plusieurs migrations portent l'avertissement *« RUN MANUALLY IN SUPABASE SQL EDITOR,
DO NOT run supabase db push »* et contiennent des opérations non idempotentes (renommages, DROP).
Il n'existe **pas** de chemin `supabase db reset` propre.

### Tenant-specific (SEED à NE PAS recopier tel quel — données Axis)

| Fichier:ligne | Contenu tenant Axis |
|---------------|---------------------|
| `supabase/migration.sql:85` | `UPDATE portal_clients SET odoo_partner_id = 77104 WHERE odoo_template_prefix = 'CPASBXL'` |
| `supabase/migrations/organizations_data_migration.sql:13-63` | Orgs AXIS (`88413`), EVERECITY (`75694`), CPAS BXL (`77104`), org `77091` |
| `supabase/migrations/20260421120000_add_dactylo_client_type.sql:97-124` | Org **Prodactylo** (`61143`, prefix `PRODACTYLO`) |
| `supabase/migrations/product_catalog_sb.sql:7-26` | 16 articles **Sambre et Biesme** (prefix `SB_`) |
| `supabase/migrations/0010_custom_fields.sql:110-126` & `0011_*.sql:10-20` | Bibliothèque de champs perso (seed Everecity) |
| `supabase/migrations/20260416120000_*.sql:12` | Commentaire ref projet `(woaxmqckupcgwsjbnlep)` |

### Étapes de duplication (Supabase)

1. Créer le **nouveau projet Supabase** (récupère URL + anon key + service_role key).
2. **Reconstituer le schéma complet** = migrations structurelles du repo **+** les 3 tables
   manquantes (`portal_submissions`, `rdv_notifications_sent`, `request_log`). Idéalement : partir
   d'un **dump `schema-only`** de la prod Axis plutôt que des migrations du repo.
3. Recréer le bucket `rdv-documents` (privé) + policies.
4. **NE PAS** rejouer les seeds tenant (orgs/partner_id/SB/Everecity). Remplacer par les données
   du tiers (voir §mapping clients).
5. Configurer Auth : Redirect URLs (callback + reset-password), templates email Supabase,
   éventuel `pg_cron` (purge invitations / request_log — cf. `docs/`).

---

## C. Intégration Odoo

### Ce qui existe

- **Config :** `src/lib/odoo.ts:3-6` lit `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY`
  (XML-RPC, auth via `/xmlrpc/2/common`, cache UID, retry sur access denied).
- **Modèles Odoo appelés :** `sale.order`, `sale.order.line`, `sale.order.template`,
  `product.template`, `product.product`, `res.partner`, `res.country`, `ir.attachment`,
  `mail.message`, `crm.tag` / `sale.order.tag`.
- **Flux principal** (`src/app/api/submit-rdv/route.ts`) : recherche/création des partenaires
  (bailleur, locataire, adresse de mission, représentant), création `sale.order` + lignes (ou via
  devis-type), upload pièces jointes (`ir.attachment`), pose de tags `ELE`/`ELS`, email client +
  email interne avec lien `axisexperts.odoo.com`.
- **Dactylo** (`src/lib/odoo/dactylo.ts`) : commandes filtrées sur `x_studio_suivi_expert =
  "Dactylo"`, upload batch, passage à `"A vérifier par expert"`.
- **Messagerie** (`src/app/api/odoo/messages/route.ts`) : lecture/écriture `mail.message`,
  pièces jointes, (un)subscribe.
- **Stats** (`src/app/api/admin/stats/*`, `.../organizations/[id]/stats`) : `search_count` sur
  `sale.order` par partenaire/agence, lecture `x_studio_date_prochain_rendez_vous_1`.

### Champs Odoo CUSTOM requis chez le tiers (RISQUE R3)

Sur **`sale.order`** : `x_studio_suivi_expert`, `x_studio_type_de_bien_1`,
`x_studio_adresse_de_mission`, `x_studio_date_prochain_rendez_vous_1`,
`x_studio_partie_1_bailleurs_`, `x_studio_partie_2_locataires_`, `x_studio_agence_partenaire`,
`x_studio_expert_externe_`, `x_studio_type_de_client`, `x_studio_portail_client`,
`x_studio_conseil_intervenant_2_`. Sur **`res.partner`** : `x_studio_agent_partenaire`.
➡️ Ces champs doivent être **recréés à l'identique** (mêmes noms techniques) dans l'Odoo du tiers,
sinon création de commande KO.

### Valeurs tenant-specific en dur

| Fichier:ligne | Valeur |
|---------------|--------|
| `src/lib/odoo.ts:90-109` | **`CLIENT_TEMPLATES`** : IDs devis-types `CPASBXL` (165-181) et `AXIS` (143-164) — valides uniquement dans l'Odoo Axis |
| `src/app/api/submit-rdv/route.ts:1139` | `https://axisexperts.odoo.com/odoo/sales/${orderId}` (lien email interne) |
| `src/app/api/submit-rdv/route.ts:557,563-573` | Noms de tags `"ELE"` / `"ELS"` |
| `src/app/api/submit-rdv/route.ts:354` | Fallback `belgiumCountryId = 21` (res.country) |
| `src/lib/odoo/dactylo.ts:9,12` | Statuts `"Dactylo"`, `"A vérifier par expert"` |
| `src/lib/types.ts`, `src/lib/product-icon.ts`, `src/lib/product-mapping.ts` | Patterns de `default_code` produits (`_A0/_A1.._A5`, `_M1.._M5`, `_KOT`, `BUREAU`, `COMMUNS`, `_ELLE_/_ELE_`, etc.) |
| `src/lib/odoo/dactylo.ts:5,15` | Limites `DACTYLO_ORDERS_LIMIT=200`, `MAX_LINES_PER_BATCH=50` |
| `src/components/PriceCalculatorModal.tsx:39-64` | `FALLBACK_PRICES` (tarifs EUR en dur, par type de bien/mission) — fallback si le catalogue Odoo ne charge pas ; **tarifs Axis** |
| `src/app/api/admin/invite/route.ts` | `INVITE_TTL_DAYS = 7` (durée de validité des invitations) |

### À configurer chez le tiers

Créer un **utilisateur API Odoo + clé API** ; recréer les **champs `x_studio_*`** ;
créer les **produits** avec `default_code` respectant le préfixe par org et les patterns ;
créer les **devis-types** et **remapper `CLIENT_TEMPLATES`** avec les nouveaux IDs ;
créer les **tags** `ELE`/`ELS` ; créer les **partenaires/agences** (et flag
`x_studio_agent_partenaire` sur les agents). Renseigner `ODOO_*` dans l'env.

---

## D. Mono-tenant vs multi-tenant — relevé exhaustif des valeurs en dur

> Voir §1 pour la conclusion. Ci-dessous le détail file:ligne des occurrences tenant Axis dans le
> **code applicatif** (hors `docs/`). ✅ = pilotable par données/env ; 🔧 = à modifier dans le code.

**Marque « Axis Experts » / domaine (🔧)** — répétés dans :
`src/app/layout.tsx:6-9` (title, description, favicon) ·
`src/lib/email.ts:16-17` (FROM, reply-to) ·
`src/lib/admin.ts:3` (`FALLBACK_ADMIN = n.rommiee@axis-experts.be`) ·
`src/content/cgu-v1.md` (intégralité — éditeur, contact, RGPD) ·
`src/components/error-fallback.tsx:21,22,57,60,94-99` ·
`src/components/dactylo/DactyloHeader.tsx:28` ·
`src/app/setup-account/page.tsx:136-137,299` ·
`src/app/account-suspended/page.tsx:11-12,38,52-82` ·
`src/app/login/page.tsx:86,157` · `src/app/reset-password/page.tsx:65,148` ·
`src/app/dashboard/page.tsx:522,527` · `src/app/brouillons/page.tsx:150,155` ·
`src/app/profil/page.tsx:121,126,217` · `src/app/demande/page.tsx:786-787,1030,1978` ·
`src/app/admin/page.tsx:138` ·
`src/app/admin/organizations/[id]/NotificationsTab.tsx:530` ·
`src/app/api/admin/invite/route.ts:205,213,227` ·
`src/app/api/admin/organizations/[id]/notifications/test/route.ts:40,54,63` ·
`src/app/api/submit-rdv/route.ts:223,987,1003,1087,1139,1149,1157` ·
`src/lib/email-templates/rdv-notification.ts:100,131,132`.

**Logo (URL WordPress Axis en dur) (🔧)** — `https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png`
dans : `setup-account:136`, `demande:786`, `profil:121`, `reset-password:65`, `login:86`,
`account-suspended:11`, `dashboard:522`, `brouillons:150`, `error-fallback:21`.
**Favicon (🔧)** : `layout.tsx:9` (`...cropped-Axis-favicon-32x32.png`).

**Couleur primaire (🔧)** — `#F5B800` (jaune Axis) : `src/app/globals.css:4,7,27,35` (+ déclinaison
`#d9a400`, `#F5B80020`) et **codée en dur dans les templates email HTML** :
`invite/route.ts:217,224`, `rdv-notification.ts:116`, `submit-rdv/route.ts:987,1139`,
`notifications/test/route.ts`.

**Noms d'organisations (data, ✅ — pas du branding)** : apparaissent surtout en **commentaires**
et **seeds SQL** (Everecity, Sambre et Biesme, CPAS — cf. §B) et comme **placeholder UI**
(`admin/organizations/page.tsx:159` → `"CPAS de Bruxelles"`). La logique métier ne hardcode pas de
nom d'org : elle lit `organizations`/`portal_clients`. ➡️ migration de **données**, pas de code.

**Odoo URL / partner IDs / templates (🔧/data)** : cf. §C.

**Ref Supabase (✅)** : pilotée par env (cf. §0).

---

## E. Branding & assets

### Ce qui existe / tenant-specific

| Élément | Emplacement | Action fork |
|---------|-------------|-------------|
| Palette / tokens | `src/app/globals.css` (`#F5B800` + dérivés) | 🔧 Remplacer par la charte du tiers |
| Titre / description / favicon | `src/app/layout.tsx:6-9` | 🔧 Remplacer |
| Logo principal | URL WP Axis en dur sur 9 pages | 🔧 Héberger le logo du tiers (idéalement dans `public/`) et remplacer toutes les occurrences |
| Footers / mentions | login, reset-password, setup-account, account-suspended, error-fallback | 🔧 Remplacer raison sociale + email contact |
| Police | `--font-sans: system-ui…` (`globals.css`) | ✅ neutre (aucune font de marque) |
| CGU | `src/content/cgu-v1.md` | 🔧 Réécriture juridique complète (cf. §G/risque R6) |
| README | `README.md` (template par défaut) | 🔧 Réécrire |
| Logos **par organisation** | colonne DB `organizations.logo_url` / `portal_clients.logo_url` | ✅ data-driven (uploadé par org) |
| Assets `public/` | `cpas_ocmw.jpg`, `logo_evercity.jpg`, `logos/cpas_ocmw.jpg` | ⚠️ **non référencés dans le code** (legacy) — à supprimer/ignorer |
| SVG par défaut Next | `public/next.svg`, `vercel.svg`, etc. | ✅ neutres |

---

## F. Email / Resend

### Ce qui existe

- **Client :** `src/lib/email.ts` — init lazy de `Resend` via `RESEND_API_KEY` (erreur propre si
  absente). Helper `sendEmail()` avec tags + blocklist de domaines en prod
  (`axis-experts.test`, `example.com`, `example.org` — `email.ts:19-23`).
- **Émetteur / reply-to (🔧)** : `email.ts:16-17`
  `FROM = "Axis Experts <noreply@axis-experts.be>"`, `DEFAULT_REPLY_TO = "info@axis-experts.be"`.
- **Templates email (tous brandés Axis en dur, 🔧) :**
  - **Invitation** : `src/app/api/admin/invite/route.ts:205-231` (bouton `#F5B800`, « portail
    Axis Experts », lien valable 7 jours, `NEXT_PUBLIC_SITE_URL`).
  - **Notification RDV planifié/modifié** : `src/lib/email-templates/rdv-notification.ts`
    (`[Axis Experts] RDV …`, bandeau `#F5B800`, footer « Axis Experts — Cabinet d'expertise »).
  - **Confirmation demande (client) + notification interne** :
    `src/app/api/submit-rdv/route.ts` (~975-1160) — bandeau Axis, mention
    `noreply@axis-experts.be`, **destinataire interne en dur `info@axis-experts.be`** (`:1149`),
    lien Odoo Axis (`:1139`).
  - **Email de test notifications** : `.../notifications/test/route.ts:40,54,63`.

### Tenant-specific / étapes

🔧 Tout est à reprendre : créer le **compte Resend** du tiers, **vérifier le domaine** (DKIM/DMARC),
remplacer `FROM`/`reply-to`, le destinataire interne, et tout le branding/couleur des templates.
Adapter `PRODUCTION_BLOCKLIST_DOMAINS` si besoin.

---

## G. Fonctionnels spécifiques

### Système d'invitation
Org-scoped. `POST /api/admin/invite` crée une ligne `invitations` (token uuid, `expires_at` 7 j,
`organization_id`, `client_type`) et envoie l'email (lien `{NEXT_PUBLIC_SITE_URL}/setup-account?token=…`).
Redemption : `/setup-account` → `/api/auth/validate-token` + `/api/auth/setup-account` (création du
compte auth + `portal_clients` lié à l'org). Dépend des données d'org ; branding email en dur (§F).

### Champs personnalisés (custom fields)
3 tables : `custom_fields` (bibliothèque globale), `organization_custom_fields` (activation +
`required`/`position` par org), `rdv_custom_values` (valeurs saisies par commande). Admin :
`/admin/custom-fields` + `CustomFieldsTab`. Les valeurs ne partent **pas** dans Odoo (note UI).
Seed initial orienté Everecity (cf. §B). Mécanisme générique → réutilisable ; seul le **seed** est
tenant-specific.

### Notifications RDV
Cron Vercel (10 min) → `GET /api/cron/check-rdv-notifications` (auth `Bearer CRON_SECRET`). Lit les
commandes Odoo récemment modifiées, déduplique via **`rdv_notifications_sent`** (table absente du
repo — R1), résout les destinataires via `src/lib/notification-recipients.ts` selon le mode de l'org
(`creator_only` | `all_org_users` | `custom_list`, lit `portal_submissions` — aussi absente),
respecte `notifications_enabled` + `notify_on_create`/`notify_on_update`. Template = §F.

### Dashboard admin + statistiques
`/admin` (vue d'ensemble « portail Axis Experts » en dur, `admin/page.tsx:138`). Stats Supabase
(`/api/admin/stats` : counts orgs/users/invitations en attente) + stats Odoo
(`/api/admin/stats/missions-by-org`, `portal-orders`, `organizations/[id]/stats` : `search_count`
`sale.order` par partenaire/agence, dates RDV). Recharts pour le rendu. Dépend des `odoo_partner_id`
/ `odoo_agency_id` de chaque org.

### Auth / rôles
Admins = liste server-side `ADMIN_EMAILS` (fallback `n.rommiee@axis-experts.be`, `admin.ts:3`).
Middleware (`src/lib/supabase/middleware.ts`) redirige les admins vers `/admin`, applique le gate
CGU (`CURRENT_CGU_VERSION = "v1.0"`) et le blocage/suspension. Users portail = `portal_clients`
liés à une org. Dactylo = route `/dactylo` (org de type `dactylo`).

---

## H. Variables d'environnement

| Variable | Rôle | Tenant-specific ? | Où l'obtenir pour le tiers |
|----------|------|:---:|----------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase | **Oui** | Nouveau projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | **Oui** | Supabase → API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service-role (serveur) | **Oui** | Supabase → API settings (secret) |
| `ODOO_URL` | URL instance Odoo | **Oui** | Odoo du tiers |
| `ODOO_DB` | Nom base Odoo | **Oui** | Odoo du tiers |
| `ODOO_USER` | Email compte API Odoo | **Oui** | Compte API créé chez le tiers |
| `ODOO_API_KEY` | Clé API Odoo | **Oui** | Odoo → Préférences → Compte API |
| `RESEND_API_KEY` | Emails transactionnels | **Oui** | Compte Resend du tiers |
| `CRON_SECRET` | Bearer pour `/api/cron/*` | **Oui** | À générer (secret) |
| `NEXT_PUBLIC_SITE_URL` | URL prod (liens emails/invitations) | **Oui** | Domaine du tiers |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocomplete adresses BE | **Oui** | Google Cloud du tiers |
| `ADMIN_EMAILS` | Liste admins (CSV, lowercase) | **Oui** | Emails admin du tiers |
| `NODE_ENV` | Géré par la plateforme | Non | Vercel |
| `NEXT_PUBLIC_ADMIN_EMAIL` | **Déprécié / supprimé** (V2.5) | — | Ne pas réintroduire |

Usages : `src/lib/supabase/*` (4 vars Supabase), `src/lib/odoo.ts:3-6`, `src/lib/email.ts:8`,
`src/lib/admin.ts:9`, `src/app/api/cron/...:89` (`CRON_SECRET`), `src/app/api/admin/invite:197`
(`NEXT_PUBLIC_SITE_URL`), `src/lib/google-maps-loader.ts:35`. Référence opérationnelle :
`docs/CLEAN_LAUNCH_PROCEDURE.md §1.3` (liste des vars Vercel prod).

> ⚠️ **`.env.example` incomplet** : il **n'inclut pas** `ADMIN_EMAILS` ni `NEXT_PUBLIC_SITE_URL`,
> pourtant tous deux utilisés et requis en prod. À compléter lors du fork pour éviter qu'un
> déploiement hérite du fallback admin Axis (`n.rommiee@axis-experts.be`) ou génère des liens
> d'invitation erronés.

---

## 2. Procédure de duplication end-to-end (ordonnée)

1. **Pré-requis client** : voir §5 (Odoo+clé, domaine, logos/charte, liste organisations, comptes).
2. **Supabase** : créer le projet → reconstruire le **schéma complet** (migrations structurelles +
   `portal_submissions`, `rdv_notifications_sent`, `request_log` ; idéalement via dump schema-only
   de la prod Axis) → bucket `rdv-documents` + policies → Auth (redirect URLs, templates).
3. **Variables d'env** : renseigner les 12 vars (§H) en local (`.env`) puis sur Vercel.
4. **Fork GitHub** : forker le repo, renommer (`package.json`, README), créer le projet Vercel lié.
5. **Vercel** : importer le repo, configurer les env (prod + preview), vérifier le cron
   (`vercel.json`).
6. **Odoo** : créer compte API + clé ; recréer les **champs `x_studio_*`** ; créer produits
   (`default_code` + préfixes), devis-types, tags `ELE`/`ELS`, partenaires/agences →
   **remapper `CLIENT_TEMPLATES`** (`src/lib/odoo.ts`) + l'URL Odoo (`submit-rdv:1139`).
7. **Resend** : compte + vérif domaine (DKIM/DMARC) → MAJ `FROM`/reply-to/interne + templates.
8. **Branding** : palette (`globals.css`), logo (9 pages) + favicon (`layout.tsx`), titres/footers,
   README.
9. **CGU / RGPD** : réécrire `src/content/cgu-v1.md` (responsable de traitement = le tiers).
10. **Mapping clients/organisations** : insérer les organisations du tiers (`organizations` +
    `portal_clients`) avec leurs `odoo_partner_id`/`odoo_agency_id`/prefix/`logo_url`/
    `product_config` + activer leurs champs perso + `product_catalog`.
11. **DNS / domaine** : pointer le domaine du tiers sur Vercel ; aligner `NEXT_PUBLIC_SITE_URL` et
    les Redirect URLs Supabase.
12. **Tests** : smoke test bout-en-bout (cf. `docs/CLEAN_LAUNCH_PROCEDURE.md §1.5`) — invitation →
    compte → demande RDV avec docs → vérif création commande Odoo + pièces jointes → emails →
    reset password cross-device → notifications cron.

---

## 3. Tableau récapitulatif pour DEVIS

> Estimations en heures, hors temps d'attente client (fourniture comptes/Odoo). « TS » = poste
> tenant-specific. Hypothèse : 1 dev senior familier du stack.

| # | Poste de travail | TS (O/N) | Action | Effort (h) | Dépendances / risques |
|---|------------------|:---:|--------|:---:|-----------------------|
| 1 | Fork GitHub + renommage projet + README | O | Fork, `package.json`, README, `pnpm i` | 1 | — |
| 2 | Provisionnement Supabase (projet, bucket, Auth) | O | Création + config | 2 | Accès Supabase tiers |
| 3 | **Reconstruction schéma DB complet** | O | Migrations structurelles + 3 tables manquantes (dump prod) | 6 | 🔴 R1/R2 — schéma incomplet/non rejouable |
| 4 | Insertion données organisations du tiers (mapping clients) | O | Seeds `organizations`/`portal_clients`/`product_catalog`/champs perso | 4 | Liste orgs + IDs Odoo du tiers |
| 5 | Compte API Odoo + clé | O | Création/échange clé | 1 | Client |
| 6 | **Recréation champs `x_studio_*` + tags + devis-types Odoo** | O | Config Odoo côté tiers | 8 | 🔴 R3 — dépend de l'admin Odoo tiers |
| 7 | Remapping `CLIENT_TEMPLATES` + URL Odoo dans le code | O | Édition `odoo.ts`, `submit-rdv` | 2 | 🟠 R4 — IDs devis-types tiers |
| 8 | Variables d'environnement (local + Vercel prod/preview) | O | 12 vars | 1 | Tous comptes tiers |
| 9 | Projet Vercel + déploiement + cron | O | Import, env, build | 2 | Build Next 16 « modifié » |
| 10 | Compte Resend + domaine (DKIM/DMARC) | O | Vérif domaine | 2 | Accès DNS |
| 11 | Templates email (émetteur, interne, branding) | O | `email.ts` + 4 templates | 4 | R5 |
| 12 | Branding UI (palette, logo ×9, favicon, footers) | O | `globals.css`, layout, pages | 5 | R5 — oublis |
| 13 | CGU / mentions légales | O | Réécriture `cgu-v1.md` | 3 | 🟠 R6 — fourni par juriste tiers |
| 14 | Google Maps API key + restriction domaine | O | GCP | 1 | Client |
| 15 | DNS / domaine + Redirect URLs Supabase | O | Config | 2 | Propagation DNS |
| 16 | Tests bout-en-bout + recette | O | Smoke test complet | 6 | Données Odoo tiers prêtes |
| 17 | Buffer / imprévus (schéma divergent, champs Odoo) | — | — | 6 | R1/R3 |
| | **TOTAL estimé** | | | **≈ 56 h** | ≈ 7–8 j·h |

> Fourchette recommandée pour devis : **50–65 h** selon la qualité de l'Odoo fourni par le tiers
> (poste #6 = principal facteur de variance) et la disponibilité d'un dump schéma de la prod Axis
> (poste #3).

---

## 4. Éléments que le client tiers doit fournir

1. **Odoo** : instance opérationnelle + **compte utilisateur API + clé API** ; capacité à créer
   les **champs custom `x_studio_*`**, les **devis-types**, **produits** (`default_code` selon
   préfixes), **tags `ELE`/`ELS`**, et les **partenaires/agences** (avec flag
   `x_studio_agent_partenaire`).
2. **Domaine** web dédié au portail (+ accès DNS) pour `NEXT_PUBLIC_SITE_URL` et le domaine email.
3. **Charte graphique** : logo (formats web), favicon, couleur(s) primaire(s), éventuelle police.
4. **Liste des organisations/clients** à charger : pour chaque org → nom, `odoo_partner_id`,
   éventuel `odoo_agency_id`, préfixe, type (`social`/`agency`/`dactylo`), logo, options produits.
5. **Compte Resend** (ou autorisation de le créer) + accès DNS pour DKIM/DMARC + adresses
   `noreply@`/`info@` (ou équivalent) du tiers.
6. **Comptes plateformes** : organisation **Vercel** et projet **Supabase** (ou autorisation de
   création), **Google Cloud** (clé Maps).
7. **CGU / mentions légales** du tiers (raison sociale, coordonnées, responsable de traitement,
   sous-traitants) pour réécrire `cgu-v1.md`.
8. **Emails administrateurs** du tiers (pour `ADMIN_EMAILS`).

---

*Fin de l'audit — document non destructif, aucune ressource Axis modifiée.*
