# AUDIT DE RÉPLICATION — axis-experts-rdv

> **Objet** : cartographie de l'existant en vue d'une réplication *white-label mono-tenant* pour une société tierce indépendante (infra propre).
> **Nature** : audit **100 % statique**, lecture du code uniquement. Aucune connexion externe, aucune modification de fichier existant.
> **Seul fichier créé par cet audit** : `AUDIT_REPLICATION.md` (ce document).

## En-tête de l'audit

| Élément | Valeur |
|---|---|
| Commit audité (HEAD) | `87beca318286aa2b28c1abab173e7ec62184fb39` |
| Message du commit | `Merge pull request #30 from nrommiee/claude/docs` |
| Date du commit | 2026-05-31 12:02:33 +0200 |
| Branche de travail | `claude/dazzling-goldberg-mbKo0` |
| Branche par défaut du remote | `main` (`origin/HEAD -> origin/main`) |
| Relation HEAD ↔ origin/main | **Identiques** (0 commit d'écart dans les deux sens) — la branche de travail part d'une base propre alignée sur `main` |
| Remote | `http://127.0.0.1:41089/git/nrommiee/axis-experts-rdv` (mirroir de `nrommiee/axis-experts-rdv`) |

`git fetch --all` exécuté : OK (nombreuses branches `claude/*` et `chore/*` côté origin, non pertinentes pour l'audit).

**Convention de lecture** : « À CONFIRMER (hors repo) » = information qui ne peut pas être déterminée depuis le code (valeurs de secrets réelles, état réel du schéma Supabase distant, IDs/templates Odoo réels, etc.).

---

## TÂCHE 1 — STACK & STRUCTURE

### Versions (depuis `package.json`)

- **Framework** : Next.js `^16.2.5` (App Router). ⚠️ **Next.js 16 introduit des breaking changes** documentés dans `AGENTS.md` — notamment le middleware renommé : le projet utilise `src/proxy.ts` (export `proxy` + `config.matcher`) **et non** `middleware.ts`.
- **React** : `19.2.4` / `react-dom` `19.2.4`.
- **Node** : aucune contrainte `engines` déclarée dans `package.json`, pas de `.nvmrc` dans le repo → **À CONFIRMER (hors repo)** (typiquement Node 20+, cf. `@types/node ^20`).
- **TypeScript** : `^5` ; cible `ES2017`, `module: esnext`, `moduleResolution: bundler`, `strict: true`, alias `@/* -> ./src/*` (`tsconfig.json`).
- **Gestionnaire de paquets** : pnpm (présence de `pnpm-lock.yaml`).
- **Tests** : Vitest `^4.1.4` (`vitest.config.ts`), Testing Library, jsdom. Script `pnpm test`.
- **Lint** : ESLint `^9` + `eslint-config-next 16.2.2` (`eslint.config.mjs`).

### Dépendances clés (intégrations)

| Domaine | Paquet | Version |
|---|---|---|
| Supabase (client/SSR) | `@supabase/supabase-js` / `@supabase/ssr` | `^2.102.1` / `^0.10.0` |
| Odoo (XML-RPC) | `xmlrpc` (+ `@types/xmlrpc`) | `^1.3.2` |
| Emails | `resend` | `^6.10.0` |
| Cartes/Adresses | `@googlemaps/js-api-loader` | `^2.0.2` |
| Validation | `zod` | `^4.3.6` |
| UI | Radix UI, `lucide-react`, `recharts`, `react-day-picker`, `sonner`, Tailwind `^4` | — |
| Dates | `date-fns` / `date-fns-tz` | `^4.1.0` / `^3.2.0` |

### Structure des dossiers (réelle, hors `node_modules`/`.git`)

```
src/
  app/                      # App Router (pages + API routes)
    api/                    # Route handlers (admin, auth, odoo, public, cron, dactylo, drafts, messages…)
    admin/                  # Back-office (organizations, users, custom-fields)
    prendre-rdv/ confirmer/ # PARCOURS PUBLIC (sans login) — isolé du portail privé
    dashboard/ demande/ brouillons/ profil/ dactylo/  # PORTAIL PRIVÉ
    login/ setup-account/ reset-password/ account-suspended/ cgu-required/
    layout.tsx, page.tsx, error.tsx, global-error.tsx, not-found.tsx
  components/               # UI (shadcn/Radix wrappers), MessageDrawer, modals, dactylo/*
  lib/
    odoo.ts + odoo/         # Intégration Odoo XML-RPC (+ dactylo.ts, ownership.ts)
    supabase/               # client.ts, server.ts, admin.ts, middleware.ts
    email.ts + email-templates/
    public-rdv/             # schema, pricing, odoo-order, recap, uploads, validation
    audit/, validation/, rate-limit.ts, admin.ts, notification-recipients.ts, …
  content/cgu-v1.md
  proxy.ts                  # "middleware" Next 16 (auth gate + CGU gate + routing)
supabase/
  migration.sql, messaging.sql, rdv_drafts.sql
  migrations/*.sql          # migrations versionnées (cf. Tâche 4)
docs/                       # documentation métier (01..06 + guides)
public/                     # logos, assets (cpas_ocmw.jpg, logo_evercity.jpg, …)
.env.example, next.config.ts, vercel.json, tsconfig.json, vitest.config.ts
AGENTS.md, CLAUDE.md, PLAN.md, README.md
```

`next.config.ts` : unique réglage `experimental.proxyClientMaxBodySize: "25mb"` (limite proxy Vercel, alignée avec le budget upload de `submit-rdv`).

---

## TÂCHE 2 — SECRETS & VARIABLES D'ENVIRONNEMENT

> Aucune valeur de secret en clair n'a été trouvée dans le code (les `process.env.*` lisent des variables non valuées dans le repo). `.env.local` **n'existe pas** dans le repo (seul `.env.example` est présent). Voir cependant Tâche 3 pour les valeurs *non secrètes* mais couplées en dur.

### Inventaire exhaustif (grep `process.env` sur `src/`)

| Variable | Type | Public ? | Utilisée dans (`fichier:ligne`) | Rôle |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | **Public** (`NEXT_PUBLIC_`) | `lib/supabase/client.ts:5`, `server.ts:8`, `admin.ts:6`, `middleware.ts:26,143` | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | **Public** | `client.ts:6`, `server.ts:9`, `middleware.ts:27` | Clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **SECRET** | `admin.ts:7`, `middleware.ts:144` | Clé service-role (bypass RLS, serveur uniquement) |
| `ODOO_URL` | Odoo | **SECRET** (config infra) | `lib/odoo.ts:3` | URL instance Odoo |
| `ODOO_DB` | Odoo | **SECRET** | `lib/odoo.ts:4` | Nom de la base Odoo |
| `ODOO_USER` | Odoo | **SECRET** | `lib/odoo.ts:5` | Email compte API Odoo |
| `ODOO_API_KEY` | Odoo | **SECRET** | `lib/odoo.ts:6` | Clé API Odoo |
| `RESEND_API_KEY` | Resend | **SECRET** | `lib/email.ts:8` | Clé API Resend |
| `CRON_SECRET` | Plateforme | **SECRET** | `api/cron/check-rdv-notifications:89`, `api/public/rdv/cron:49`, `api/public/rdv/validation-cron:68` | Bearer partagé pour protéger les crons |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps | **Public** | `lib/google-maps-loader.ts:35` | Clé Google Maps (autocomplete adresses) |
| `NEXT_PUBLIC_SITE_URL` | App | **Public** | `api/admin/invite:197`, `api/public/rdv/route:173`, `api/public/rdv/cron:66`, `api/public/rdv/validation-cron:83` | URL de base pour les liens emails (fallback : `request.url` origin) |
| `ADMIN_EMAILS` | App | **SECRET** (liste) | `lib/admin.ts:9` | Liste d'emails admin (CSV). **Fallback hardcodé** si absente (cf. Tâche 3) |
| `VERCEL_ENV` | Plateforme | injectée par Vercel | `api/public/rdv/cron:43,75`, `api/public/rdv/validation-cron:63,87` | Détection prod vs preview |
| `NODE_ENV` | Plateforme | runtime | `lib/email.ts:51`, `api/submit-rdv:1020,1154` | Garde blocklist email en prod / tag |

### Contenu de `.env.example` (présent dans le repo)

```
NEXT_PUBLIC_SUPABASE_URL=           # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Clé publique Supabase (anon)
SUPABASE_SERVICE_ROLE_KEY=          # Clé service-role (serveur uniquement)
ODOO_URL=                           # URL de l'instance Odoo
ODOO_DB=                            # Nom de la base Odoo
ODOO_USER=                          # Email utilisateur Odoo (compte API)
ODOO_API_KEY=                       # Clé API Odoo
RESEND_API_KEY=                     # Clé API Resend
CRON_SECRET=                        # Secret partagé pour /api/cron/*
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=    # Clé Google Maps
```

**⚠️ Écarts `.env.example` vs code (à compléter pour le nouveau tenant)** :
- `NEXT_PUBLIC_SITE_URL` — **utilisée mais ABSENTE** de `.env.example`. Critique : sans elle, les liens d'invitation/confirmation retombent sur l'origin de la requête.
- `ADMIN_EMAILS` — **utilisée mais ABSENTE** de `.env.example`. Sans elle, l'unique admin reconnu est le fallback hardcodé `n.rommiee@axis-experts.be` (cf. Tâche 3).
- `VERCEL_ENV` / `NODE_ENV` — injectées par la plateforme (normal qu'elles ne soient pas dans `.env.example`).

**Aucune valeur de secret en clair à purger n'a été détectée dans le repo.**

---

## TÂCHE 3 — VALEURS HARDCODÉES AXIS-SPÉCIFIQUES (à reparamétrer)

> Légende type : **Métier/Branding** = marque, contacts, logos ; **Odoo** = instance/IDs/champs ; **Supabase** = project ref ; **Maps** = restriction géo.

### 3.1 Branding & contacts (Métier)

| Valeur trouvée | `fichier:ligne` | Type |
|---|---|---|
| `https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png` (logo) | `prendre-rdv/page.tsx:14`, `prendre-rdv/merci/page.tsx:10`, `confirmer/[token]/page.tsx:14`, `confirmer/partie/[token]/page.tsx:14`, `demande/page.tsx:786`, `brouillons/page.tsx:150`, `profil/page.tsx:121`, `reset-password/page.tsx:65`, `login/page.tsx:86`, `account-suspended/page.tsx:11`, `dashboard/page.tsx:522`, `setup-account/page.tsx:136`, `error-fallback.tsx:21`, `email-templates/public-rdv-confirm.ts:15`, `…-confirmed.ts:15`, `…-reminder.ts:15`, `…-validation.ts:16` | Métier/Branding |
| Favicon `https://axis-experts.be/wp-content/uploads/2022/11/cropped-Axis-favicon-32x32.png` | `app/layout.tsx:9` | Métier/Branding |
| Titre/description `"Axis Experts - Portail de demande de RDV"` | `app/layout.tsx:6-7` | Métier/Branding |
| `https://www.axis-experts.be` (liens site) | `prendre-rdv/merci/page.tsx:50`, `confirmer/[token]/ConfirmClient.tsx:99`, `confirmer/[token]/page.tsx:105`, `confirmer/partie/[token]/ValidateClient.tsx:73` | Métier/Branding |
| `info@axis-experts.be` (contact / reply-to / destinataire interne) | `email.ts:17` (DEFAULT_REPLY_TO), `submit-rdv:1149,1157`, `validation-cron:27` (INTERNAL_EMAIL), `account-suspended:52,55,79,82`, `error-fallback.tsx:57,60,96,99`, `confirmer/partie/[token]/ValidateClient.tsx:69,90,129`, `confirmer/partie/[token]/page.tsx:110`, `email-templates/public-rdv-confirmed.ts:40`, `…-validation.ts:41` | Métier |
| Expéditeur Resend `"Axis Experts <noreply@axis-experts.be>"` | `email.ts:16` | Métier/Resend |
| Téléphone `02 880 90 90` | `prendre-rdv/page.tsx`, `confirmer/partie/[token]/page.tsx:110`, `confirmer/partie/[token]/ValidateClient.tsx:69,90,129`, `email-templates/public-rdv-confirmed.ts:40`, `…-validation.ts:41` | Métier |
| Email admin de secours `n.rommiee@axis-experts.be` (FALLBACK_ADMIN) | `lib/admin.ts:3` | Métier (auth admin) |
| Couleur de marque `#F5B800` (jaune Axis) | nombreux templates email + pages | Branding (cosmétique) |
| Blocklist domaines `axis-experts.test` | `email.ts:20` | Métier (garde-fou prod) |
| Mention « Axis Experts — Cabinet d'expertise immobilière » | `email-templates/public-rdv-validation.ts:42` | Métier |
| Assets logos clients : `public/logo_evercity.jpg`, `public/cpas_ocmw.jpg`, `public/logos/cpas_ocmw.jpg` | `public/` | Métier |

### 3.2 Odoo (instance / IDs / templates)

| Valeur trouvée | `fichier:ligne` | Type |
|---|---|---|
| Lien direct devis `https://axisexperts.odoo.com/odoo/sales/${orderId}` | `api/submit-rdv/route.ts:1139` | **Odoo (instance hardcodée)** |
| Préfixe template par défaut `"AXIS"` (fallback à la création d'org) | `api/admin/organizations/route.ts:129` | Odoo (métier) |
| `CLIENT_TEMPLATES` — table de mapping IDs templates Odoo en dur : `CPASBXL` (studio/app1..app5/bureau/communs → IDs 165..181) et `AXIS` (app1..app5/studio → IDs 143..164) | `lib/odoo.ts:90-109` | **Odoo (template IDs numériques)** |
| Partner ID `77104` (CPAS BXL) — `UPDATE` direct | `supabase/migration.sql:85,89`, `organizations_data_migration.sql:38,48` | Odoo (partner ID) |
| Partner IDs seedés : `88413` (AXIS), `75694` (EVERECITY), `77104` (CPASBXL), `77091` (org « AXIS ») | `supabase/migrations/organizations_data_migration.sql:13-63` | Odoo (partner IDs) |
| Partner ID `61143` (Prodactylo, sous-traitant) + prefix `PRODACTYLO` | `supabase/migrations/20260421120000_add_dactylo_client_type.sql:19,112,123` | Odoo (partner ID) |
| Préfixe produits `SB` (Sambre Et Biesme) — seed product_catalog | `supabase/migrations/product_catalog_sb.sql` | Odoo/Métier |
| Statuts métier `x_studio_suivi_expert` : `"Demande reçue"`, `"En cours"`, `"RDV proposé"`, `"RDV confirmé"`, `"Dactylo"`, `"A vérifier par expert"` | `submit-rdv:635`, `public-rdv/odoo-order.ts:325`, `public-rdv/validation.ts:12-13`, `odoo/dactylo.ts:9,12` | Odoo (valeurs Studio) |
| Tags mission `ELE` / `ELS` | `submit-rdv:557`, `public-rdv/odoo-order.ts:227`, `cron/check-rdv-notifications:157` | Odoo (tags) |
| Champs Studio custom (`x_studio_*`) — voir Tâche 5 | tout `src/` Odoo | Odoo (modèle custom) |
| Pays Belgique : `res.country code=BE`, fallback `country_id=21` | `submit-rdv:354,358`, `public-rdv/odoo-order.ts:216` | Odoo (donnée géo) |

### 3.3 Supabase (project ref)

| Valeur trouvée | `fichier:ligne` | Type |
|---|---|---|
| Project ref **`woaxmqckupcgwsjbnlep`** (en commentaire « Execute via Supabase SQL Editor on the project (…) ») | `supabase/migrations/20260416120000_user_soft_delete_and_blocking.sql:12` | **Supabase (project ref, en commentaire)** |

**Note importante** : le project ref `psbcebctdkxuqnoxgwrs` mentionné dans la consigne d'audit **n'apparaît nulle part dans le repo**. Le seul project ref présent est `woaxmqckupcgwsjbnlep`, et **uniquement dans un commentaire** de migration (pas dans du code exécutable). Le project ref réel utilisé en runtime provient de `NEXT_PUBLIC_SUPABASE_URL` (env, hors repo). → divergence à confirmer : **À CONFIRMER (hors repo)**.

### 3.4 Google Maps

| Valeur trouvée | `fichier:ligne` | Type |
|---|---|---|
| Restriction géographique `componentRestrictions: { country: "be" }` | `lib/useAddressAutocomplete.ts:47` | Maps (géo) |
| Version API `v: "weekly"` | `lib/google-maps-loader.ts:45` | Maps (config) |

> La **clé** Maps n'est pas en dur (env `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Seule la restriction pays `be` est codée en dur.

---

## TÂCHE 4 — SCHÉMA SUPABASE

> ⚠️ **Le schéma versionné dans le repo n'est PAS la source de vérité.** Quasi tous les fichiers SQL portent la mention « À EXÉCUTER MANUELLEMENT EN SQL EDITOR / NE PAS exécuter via `supabase db push` ». Il n'y a **pas de `supabase/config.toml`**, **pas de dossier `supabase/functions/` (aucune Edge Function)**, et les migrations ne sont pas chaînées par un outil. Le schéma réel **vit côté projet Supabase distant** — l'état exact est **À CONFIRMER (hors repo)**.

### Tables définies dans le repo

| Table | Fichier | Colonnes clés / notes |
|---|---|---|
| `public.portal_clients` | `migration.sql` (+ `split_client_name`, `add_product_config`, `soft_delete`, `organizations.sql`) | `user_id` FK auth.users, `odoo_partner_id`, `odoo_template_prefix`, `odoo_agency_id`, `odoo_contact_partner_id`, `client_type` (`social`/`agency`/`dactylo`), `nom_societe`, `nom_bailleur`, `email_bailleur`, `telephone_bailleur`, `product_config` JSONB, `logo_url`, `organization_id` FK, `first_name`/`last_name` + `display_name` (GENERATED), `deleted_at/by`, `blocked_at/by`, timestamps. UNIQUE(user_id). |
| `organizations` | `organizations.sql` (+ `regularize_notifications`) | `name`, `odoo_partner_id`, `odoo_agency_id`, `odoo_template_prefix` (DEFAULT `'AXIS'`), `client_type` CHECK(`social`/`agency`/`dactylo`), `logo_url`, `product_config`, `contact_*`, `is_active`, + 5 colonnes notifications (`notifications_enabled`, `notification_recipients_mode` CHECK creator_only/all_org_users/custom_list, `notification_custom_emails` JSONB, `notify_on_create`, `notify_on_update`). |
| `invitations` | `invitations_v2.sql` (+ `add_dactylo_client_type`) | `token` UUID UNIQUE, `email`, `organization_id` FK, `client_type` CHECK, `expires_at`, `used_at`, `created_by`. (Ancienne `invitations_legacy` renommée ; schéma legacy documenté dans `invitations_legacy_doc.sql`.) |
| `custom_fields` | `0010_custom_fields.sql` (+ `0011`) | bibliothèque globale : `label`, `field_key` UNIQUE, `field_type` CHECK, `options` JSONB, `mission_type` CHECK(entree/sortie/both). **Seed « Everecity »** (n_archi, n_lgt, etage, vivaqua, motif_depart…). |
| `organization_custom_fields` | `0010_custom_fields.sql` | activation par org : `organization_id`, `custom_field_id`, `required`, `position`, `active`. |
| `rdv_custom_values` | `0010_custom_fields.sql` | valeurs par RDV : `organization_id`, `custom_field_id`, `order_ref`, `value`. (Jamais envoyé à Odoo.) |
| `product_catalog` | `regularize_notifications` (+ `product_catalog_sb.sql`, `product_catalog_rls.sql`) | `code` UNIQUE, `odoo_default_code`, `label`. Seed prefix `SB`. |
| `rdv_drafts` | `rdv_drafts.sql` (+ `rdv_drafts_organization`) | brouillons : `user_id`, `form_data` JSONB, `selected_product/options`, `current_step`, `document_paths`, `organization_id`, `created_by`. |
| `portal_message_reads` | `messaging.sql` | suivi lecture messages : `user_id`, `odoo_order_id`, `last_read_at`. |
| `user_consents` | `phase0_rgpd_minimal.sql` | journal CGU : `user_id`, `cgu_version`, `accepted_at`, `ip_address`, `user_agent`. UNIQUE(user_id, cgu_version). |
| `audit_log` | `phase0_rgpd_minimal.sql` | journal d'audit : `user_id`, `organization_id`, `action`, `resource_type/id`, `metadata`, `ip_address`, `user_agent`. |
| `public_rdv_requests` | `public_rdv_requests.sql` (+ `public_rdv_documents`) | tampon demandes publiques : `token`, `status` CHECK(pending/confirmed/expired/cancelled), `form_data`, `email`, `phone`, `expires_at`, `confirmed_at`, `reminders_sent`, `odoo_order_id`, `documents` JSONB, `upload_failed`. **Isolée** (aucune FK auth.users), accès **service_role only**. |
| `public_rdv_party_validations` | `public_rdv_party_validations.sql` | token→(odoo_order_id, party p1/p2), `role`, `status`, `rdv_date_string`, `email`. Accès service_role only. |

### ⚠️ Tables référencées dans le code mais ABSENTES des migrations (drift de schéma — vivent uniquement côté Supabase)

| Table | Référencée dans | Définition repo |
|---|---|---|
| `portal_submissions` | `submit-rdv:1188`, `notification-recipients.ts:70` | **AUCUNE migration** → À CONFIRMER (hors repo) |
| `rdv_notifications_sent` | `cron/check-rdv-notifications:98,204,217,382` | **AUCUNE migration** → À CONFIRMER (hors repo) |
| `request_log` | `lib/rate-limit.ts:22,40` | **AUCUNE migration** → À CONFIRMER (hors repo) |

### RLS / Policies (présentes dans le repo)

- `portal_clients` : SELECT/UPDATE `auth.uid() = user_id` (`migration.sql`, + `portal_clients_update_policy.sql`).
- `organizations` : SELECT « lit son org » (via join portal_clients).
- `invitations` : **aucune policy publique** — accès **service_role uniquement**.
- `custom_fields` : SELECT pour tout authentifié. `organization_custom_fields` / `rdv_custom_values` : scoping par org via portal_clients.
- `product_catalog` : SELECT authentifié ; écriture service_role uniquement.
- `rdv_drafts` : CRUD `auth.uid() = user_id` (puis partage org via colonnes ajoutées).
- `portal_message_reads` : ALL `auth.uid() = user_id`.
- `user_consents` : SELECT/INSERT own. `audit_log`, `public_rdv_requests`, `public_rdv_party_validations` : **service_role only** (deny by default).
- **Storage** : bucket privé **`rdv-documents`** (à créer manuellement). Policies INSERT/SELECT scoping par dossier `auth.uid()`. Préfixe `public/<requestId>/…` pour le parcours public.

### Functions / Triggers (repo)

- Function `public.update_updated_at()` + triggers `portal_clients_updated_at`, `organizations_updated_at`.
- Function `cascade_org_deactivation()` (SECURITY DEFINER) + trigger `trigger_cascade_org_deactivation` : désactiver une org bloque tous ses `portal_clients` actifs.
- Mentions (commentées, non exécutées) de `pg_cron` pour purge des invitations utilisées > 30j.

### Edge Functions
**Aucune** (`supabase/functions/` inexistant). Toute la logique « serveur » est dans les route handlers Next.js + les crons Vercel.

---

## TÂCHE 5 — INTÉGRATION ODOO (XML-RPC)

### Couche d'accès (`src/lib/odoo.ts`)
- Transport : `xmlrpc.createSecureClient` (HTTPS port 443), endpoints `/xmlrpc/2/common` (auth) et `/xmlrpc/2/object` (`execute_kw`).
- **Auth** : `authenticate([db, user, apiKey, {}])` → `uid` mis en cache module (`uidCache`). Re-tentative automatique sur erreur d'auth (access denied / faultCode 3 / session expired) : vide le cache et réauthentifie une fois.
- Helpers exportés : `odooExecute(model, method, args, kwargs)`, `odooCreate(model, values)`, `odooSearch(model, domain, fields, limit)`.
- Identifiants entièrement par env (`ODOO_URL/DB/USER/API_KEY`) — pas de secret en dur.

### Mapping templates (en dur — `odoo.ts:90-121`)
`CLIENT_TEMPLATES[prefix][typeBien] = { entree, sortie }` avec `getTemplateId(prefix, typeBien, mission)`. Préfixes câblés : **`CPASBXL`** et **`AXIS`** (IDs numériques 143–181). → **point de couplage majeur pour la réplication** : ces IDs sont propres à l'instance Odoo Axis.

### Modèles Odoo utilisés
`sale.order`, `sale.order.line`, `sale.order.template.line`, `res.partner`, `res.country`, `product.template`, `product.product`, `ir.attachment`, `crm.tag`, `sale.order.tag`, `mail.message`.

### Méthodes utilisées
`authenticate`, `execute_kw`, `search_read`, `search_count`, `create`, `write`, `message_post`, `action_cancel`, `unlink`.

### Champs Studio custom mappés (`x_studio_*`)
`x_studio_adresse_de_mission`, `x_studio_agence_partenaire`, `x_studio_agent_partenaire`, `x_studio_conseil_intervenant_2_`, `x_studio_date_prochain_rendez_vous_1`, `x_studio_expert_externe_`, `x_studio_partie_1_bailleurs_` (+ `_confirm`, `_confirm_le_1`), `x_studio_partie_2_locataires_` (+ `_confirm`, `_confirm_le_1`), `x_studio_portail_client`, `x_studio_proposition_envoye`, `x_studio_rle_notification_rdv`, `x_studio_suivi_expert`, `x_studio_type_de_bien_1`, `x_studio_type_de_client`. → **schéma Studio propre à Axis**, à recréer/mapper côté nouveau tenant.

### Points d'entrée fonctionnels

1. **`POST /api/submit-rdv`** (portail privé, principal) :
   - Charge `portal_clients` → `odoo_partner_id` + `odoo_template_prefix`. **C'est ici que `odoo_template_prefix` et `partner_id` entrent en jeu.**
   - Agences (`client_type === 'agency'`) : produit/options résolus via `agencyPriceSelection` + `product_catalog` → `product.template`/`product.product` (Step 1b). `partner_id` de la commande = le bailleur réel ; l'agent reste dans `x_studio_agence_partenaire`.
   - Sinon : `getTemplateId(prefix, typeBien, mission)` → `sale_order_template_id`.
   - Crée l'adresse de mission (`res.partner type=delivery`, parent = client), résout/crée bailleur & locataire & représentant (dédoublonnage email→nom), crée `sale.order` (brouillon), lignes section/produit/notes, tag ELE/ELS, statut `En cours`, notes chatter (compteurs, décès…), pièces jointes (Storage + `ir.attachment`).
   - Track `portal_submissions` + `audit_log`.
2. **`createOdooOrderForRequest()`** (`lib/public-rdv/odoo-order.ts`) : crée le devis **brouillon** à la confirmation d'une demande **publique**. Jamais de `action_confirm`, jamais de `write` sur un `res.partner` existant. Anti-doublon via `odoo_order_id`. Statut initial `"Demande reçue"`. Prix pris depuis `list_price` Odoo.
3. **`/api/odoo/*`** (orders, products, messages, tags, attachments) : listing/lecture filtrés. `products` filtre par `odoo_template_prefix` (`filterProductsByPartner` → `default_code.startsWith(prefix)`). `orders`/ownership : social ⇒ filtre `partner_id`; agency ⇒ `x_studio_agence_partenaire IN agentIds` (`lib/odoo/ownership.ts`, agents = `res.partner` enfants avec `x_studio_agent_partenaire = true`).
4. **Dactylo** (`lib/odoo/dactylo.ts`) : liste les `sale.order` au statut `x_studio_suivi_expert = "Dactylo"`, upload `.docx` en `ir.attachment`, bascule vers `"A vérifier par expert"`.
5. **Cron notifications** (`/api/cron/check-rdv-notifications`) : `search_read` sale.order `x_studio_portail_client=true` + `x_studio_date_prochain_rendez_vous_1 != false`, dérive l'org via `partner_id`/`agency_id`, envoie notifications RDV.

---

## TÂCHE 6 — FLUX RESEND (emails)

- **Couche unique** : `src/lib/email.ts` → `sendEmail()` via `getResendClient()` (client paresseux sur `RESEND_API_KEY`).
- **Expéditeur (FROM)** : `"Axis Experts <noreply@axis-experts.be>"` (`email.ts:16`) — **hardcodé**.
- **Reply-To par défaut** : `info@axis-experts.be` (`email.ts:17`) — **hardcodé**.
- **Garde-fou prod** : en `NODE_ENV=production`, blocklist de domaines destinataires `axis-experts.test`, `example.com`, `example.org` (`email.ts:19-23`).
- Logging : sujets hashés (`hashShort`), jamais le contenu.

### Déclencheurs (call sites)

| # | Déclencheur | Fichier | Template | Expéditeur / Destinataire |
|---|---|---|---|---|
| 1 | Invitation portail (admin invite un user) | `api/admin/invite/route.ts:225` | HTML inline (lien `setup-account?token=`) | FROM Axis → email invité. Sujet « invitation au portail **Axis Experts** ». |
| 2 | Nouvelle demande RDV (client) | `api/submit-rdv/route.ts:1014` | HTML inline | FROM → `bailleurEmail` (si `notifyBailleur !== false`). |
| 3 | Notification interne nouvelle demande | `api/submit-rdv/route.ts:1148` | HTML inline (+ lien `axisexperts.odoo.com/...`) | FROM → **`info@axis-experts.be`** (hardcodé). |
| 4 | Notification RDV planifié/modifié (cron 10 min) | `api/cron/check-rdv-notifications/route.ts:361` | `buildRdvNotificationEmail` | FROM → destinataires résolus par `resolveNotificationRecipients` (creator_only / all_org_users / custom_list). |
| 5 | Email de test notifications (admin) | `api/admin/organizations/[id]/notifications/test/route.ts:167` | `buildTestEmail` (inline) | FROM → email saisi par l'admin. |
| 6 | Confirmation demande publique (double opt-in) | `api/public/rdv/route.ts:192` | `buildPublicRdvConfirmEmail` (lien `/confirmer/<token>`) | FROM → `data.email` (demandeur). |
| 7 | Rappel demande publique non confirmée (+24h/+48h, cron horaire) | `api/public/rdv/cron/route.ts:95` | `buildPublicRdvReminderEmail` | FROM → `row.email`. |
| 8 | Validation de présence par partie (cron 15 min) | `api/public/rdv/validation-cron/route.ts:266` | `buildPartyValidationEmail` (lien) | FROM → email partie « doit valider ». |
| 9 | Info RDV proposé (partie informée) | `validation-cron/route.ts:208` | `buildPartyInfoEmail` (sans lien) | FROM → email partie « informé seulement ». |
| 10 | RDV public confirmé (notif parties) | `validation-cron/route.ts:389` | `buildRdvConfirmedEmail` | FROM → emails parties. |
| 11 | RDV public confirmé (notif interne) | `validation-cron/route.ts:407` | `buildRdvConfirmedInternalEmail` | FROM → **`INTERNAL_EMAIL = info@axis-experts.be`** (`validation-cron:27`, hardcodé). |

Tous les templates (`src/lib/email-templates/*`) intègrent **logo Axis**, **couleur `#F5B800`**, téléphone **02 880 90 90** et **info@axis-experts.be** en dur → à paramétrer.

---

## TÂCHE 7 — FLUX AUTH PORTAIL (invitation / acceptation / connexion)

### Modèle d'accès
- Auth = **Supabase Auth** (email/mot de passe). Pas de rôle DB « admin » : un admin est un email présent dans `ADMIN_EMAILS` (sinon fallback `n.rommiee@axis-experts.be`) — `lib/admin.ts` / `isAdmin()`.
- Routage et gates dans **`src/proxy.ts` → `lib/supabase/middleware.ts` (`updateSession`)** :
  - Parcours **public** (`/prendre-rdv`, `/confirmer`, `/api/public/*`) : court-circuité (aucune auth) via `proxy.ts`.
  - `/reset-password` et `/setup-account` : court-circuités (préserve `?code=` PKCE / `?token=`).
  - Non authentifié → redirection `/login` (ou 401 sur `/api/`), sauf chemins exemptés.
  - **Gate CGU** : tout utilisateur authentifié sans consentement `user_consents` (version courante **`v1.0`**) est redirigé vers `/cgu-required` (ou 403 `cgu_required` sur API).
  - **Admin** → forcé vers `/admin` (intercepte `/`, `/login`, `/dashboard*`, `/dactylo*`).
  - Non-admin : 1 fetch `portal_clients` → (a) si org `is_active=false` → `/account-suspended` (ou 403) ; (b) routing `client_type` : `dactylo` confiné à `/dactylo`, les autres expulsés de `/dactylo` vers `/dashboard`.

### Invitation → acceptation (séquence où `odoo_template_prefix` est synchronisé)

1. **Admin crée l'invitation** — `POST /api/admin/invite` :
   - Garde `isAdmin` + rate-limit. Résout l'org par `organization_id` (ou legacy par `odoo_partner_id`). `client_type` ∈ {social, agency, dactylo}.
   - Insère dans `invitations` (`token` UUID auto, `expires_at` = +7j). Email Resend avec `${NEXT_PUBLIC_SITE_URL}/setup-account?token=...`.
   - Détecte un éventuel compte précédemment soft-deleted (warning UI).
2. **Validation du lien** — `GET /api/auth/validate-token?token=` : vérifie non utilisé/non expiré, renvoie `email` + `organization_name`.
3. **Acceptation / création de compte** — `POST /api/auth/setup-account` :
   - Re-valide le token (non used, non expiré). Charge l'**org** (`SELECT *` → inclut `odoo_partner_id`, `odoo_agency_id`, `odoo_template_prefix`, `client_type`, `logo_url`, `product_config`).
   - Crée (ou réactive) l'utilisateur Supabase Auth (refus si email déjà lié à un compte actif).
   - **Upsert `portal_clients`** (onConflict `user_id`) en **copiant les champs de l'org** :
     `odoo_partner_id`, `odoo_agency_id`, `client_type`, `nom_societe`/`nom_bailleur` = `org.name`, `email_bailleur` = email invitation, **`odoo_template_prefix = org.odoo_template_prefix`**, `organization_id`, `logo_url`, `product_config`, `first_name`/`last_name`.
     → **C'est le point précis de synchronisation de `odoo_template_prefix`** (depuis `organizations` vers `portal_clients`, `setup-account/route.ts:237`).
   - Marque l'invitation `used_at`, puis `signInWithPassword` (auto-login).
4. **Connexion ultérieure** : `/login` (Supabase Auth) ; `/auth/callback` pour l'échange de code ; `/reset-password` (PKCE côté client).

> La cohérence « org → portal_clients » dépend donc d'une **copie au moment du setup** : modifier `odoo_template_prefix` sur l'org **après** setup ne re-synchronise pas automatiquement les `portal_clients` déjà créés (à vérifier côté process de réplication).

---

## TÂCHE 8 — DÉPLOIEMENT

### `vercel.json` (crons)
```json
{ "crons": [
  { "path": "/api/cron/check-rdv-notifications", "schedule": "*/10 * * * *" },
  { "path": "/api/public/rdv/cron",              "schedule": "0 * * * *"   },
  { "path": "/api/public/rdv/validation-cron",   "schedule": "*/15 * * * *" }
]}
```
- 3 crons Vercel, protégés par `CRON_SECRET` (header `Authorization: Bearer …`). Les crons publics tolèrent un bypass `?test=1` (et `?dry=1`) **uniquement hors production** (`VERCEL_ENV !== "production"`).
- ⇒ La cible de déploiement est **Vercel** (utilisation de `VERCEL_ENV`, crons Vercel, `proxyClientMaxBodySize`). Aucun `Dockerfile`, aucune CI (`.github/workflows`) dans le repo.

### `next.config.ts`
```ts
const nextConfig = { experimental: { proxyClientMaxBodySize: "25mb" } };
```
- Aligné avec `submit-rdv` (`TOTAL_DOCUMENTS_BUDGET = 25 MB`). Pas de `images.domains` configuré (les logos sont en `<img>` externes vers `axis-experts.be`).

### Runtime des routes
- `submit-rdv` : `maxDuration = 30`. `cron/check-rdv-notifications` : `maxDuration = 300`. Routes publiques RDV : `runtime = "nodejs"`, `maxDuration` 60. Beaucoup de handlers `dynamic = "force-dynamic"`.

### Autres
- `tsconfig.json` / `eslint.config.mjs` / `postcss.config.mjs` / `vitest.config.ts` : configs standard (cf. Tâche 1).
- **Aucun** `vercel env`, `.env.local`, ni secret committé.

---

## SYNTHÈSE — CHECKLIST DE « DÉ-AXISATION » POUR LA RÉPLICATION

> (récapitulatif des points couplés à transformer en configuration pour le nouveau tenant — sans action dans ce run)

1. **Env infra (par tenant)** : `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ODOO_URL/DB/USER/API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `CRON_SECRET`, **`NEXT_PUBLIC_SITE_URL`** et **`ADMIN_EMAILS`** (⚠️ ces 2 dernières à AJOUTER à `.env.example`).
2. **Branding hardcodé** : logo/favicon `axis-experts.be`, titre/description (`layout.tsx`), expéditeur & reply-to (`email.ts`), `info@axis-experts.be`, `n.rommiee@axis-experts.be` (fallback admin), tél `02 880 90 90`, couleur `#F5B800`, liens `www.axis-experts.be`, blocklist `axis-experts.test` → à externaliser en config.
3. **Odoo** : lien `axisexperts.odoo.com` (submit-rdv), table `CLIENT_TEMPLATES` (IDs 143–181), prefix par défaut `"AXIS"`, statuts `x_studio_suivi_expert`, tags `ELE/ELS`, **tous les champs `x_studio_*`** (schéma Studio propre à Axis), partner IDs seedés (88413/75694/77104/77091/61143).
4. **Supabase** : recréer le schéma réel (les migrations repo sont partielles + 3 tables en drift : `portal_submissions`, `rdv_notifications_sent`, `request_log`), le bucket `rdv-documents`, les seeds (`custom_fields` Everecity, `product_catalog` SB), supprimer la ref `woaxmqckupcgwsjbnlep` du commentaire migration.
5. **Maps** : restriction pays `be` (`useAddressAutocomplete.ts`) à paramétrer si autre pays.
6. **Déploiement** : crons Vercel + `CRON_SECRET` + dépendance `VERCEL_ENV` (à adapter si hébergeur différent).

---

*Fin de l'audit — document généré en lecture statique uniquement. Aucun fichier existant n'a été modifié, aucune connexion externe n'a été établie.*
