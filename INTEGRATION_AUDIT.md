# INTEGRATION_AUDIT — rdv.axis-experts

> Audit d'**intégration** uniquement. Aucun fichier existant n'a été modifié, rien n'a été
> installé ni exécuté. Objectif : cartographier ce qui est déjà câblé pour y greffer une
> nouvelle fonctionnalité « demande de RDV → devis Odoo, tampon Supabase, emails Resend ».
>
> ⚠️ **Aucune valeur de secret n'apparaît dans ce document — uniquement les NOMS de variables.**
>
> 🔑 **Constat majeur :** un pipeline « formulaire RDV → création de devis (`sale.order`) Odoo →
> tampon Supabase → emails Resend » **existe déjà et fonctionne** (page `/demande` +
> route `POST /api/submit-rdv`). La nouvelle feature consiste donc surtout à **réutiliser /
> étendre** l'existant, pas à le recréer.

---

## 1. Stack

| Élément | Valeur |
|---|---|
| Framework | **Next.js `^16.2.5`** (App Router) |
| React | `19.2.4` / `react-dom 19.2.4` |
| Gestionnaire de paquets | **pnpm** (présence de `pnpm-lock.yaml`, pas de `package-lock`/`yarn.lock`) |
| Langage | TypeScript `^5`, `strict: true`, alias `@/*` → `./src/*` |
| Structure | **`src/`** + **App Router** (`src/app`) |
| Tests | **Vitest `^4`** + Testing Library + jsdom (`vitest.config.ts`) |
| Lint | ESLint 9 (`eslint.config.mjs`, flat config, `eslint-config-next`) |

### Styling — confirmé
- **Tailwind CSS v4** : `@tailwindcss/postcss` dans `postcss.config.mjs`, `tailwindcss ^4` en devDep,
  et `src/app/globals.css` commence par `@import "tailwindcss";` avec un bloc `@theme inline { … }`
  (thème basé sur une couleur primaire jaune `#F5B800`). **Pas de `tailwind.config.js`** → config CSS-first v4.
- **shadcn/ui « manuel »** : composants dans `src/components/ui/*` (button, dialog, popover, calendar,
  checkbox, badge, alert-dialog, tooltip, label, sonner…), construits sur **Radix UI** +
  `class-variance-authority` + helper **`cn()`** (`src/lib/utils.ts`, via `clsx` + `tailwind-merge`).
  ⚠️ **Pas de `components.json`** → la CLI shadcn n'est pas branchée ; les composants sont copiés/maintenus à la main.
- Autres libs UI : `lucide-react` (icônes), `sonner` (toasts, wrappé par `src/lib/toast.ts`),
  `react-day-picker` + `date-fns`/`date-fns-tz`, `recharts`, `react-markdown`,
  `@googlemaps/js-api-loader` (autocomplete d'adresses).

---

## 2. ODOO

**Oui — client Odoo complet déjà en place.**

- **Client central : `src/lib/odoo.ts`**
  - Transport **XML-RPC** via la lib **`xmlrpc`** (`createSecureClient`, port 443, chemins
    `/xmlrpc/2/common` et `/xmlrpc/2/object`).
  - **Auth** : `authenticate()` appelle `common.authenticate(db, user, apiKey, {})`, **cache le `uid`**
    en mémoire, avec **retry automatique** si erreur d'auth (`access denied` / `session expired`).
  - Helpers exportés : **`odooExecute(model, method, args, kwargs)`**, **`odooCreate(model, values)`**,
    **`odooSearch(model, domain, fields, limit)`**.
  - **Mapping métier** : `CLIENT_TEMPLATES` (préfixes `CPASBXL`, `AXIS` → IDs de
    `sale.order.template` par type de bien et entrée/sortie) + `getTemplateId()`.
- **Helpers Odoo additionnels** : `src/lib/odoo/dactylo.ts`, `src/lib/odoo/ownership.ts`.
- **Routes API qui parlent à Odoo** (`src/app/api/odoo/*`) :
  `orders/`, `products/`, `tags/`, `messages/`, `attachments/`, `attachments/download/`.
  Également `api/agency/price-catalog/`, `api/dactylo/orders/`, et surtout **`api/submit-rdv/`**.
- **Création de devis déjà implémentée** dans `POST /api/submit-rdv` : crée `res.partner`
  (adresse, bailleur, locataire, représentant), `sale.order` (avec `sale_order_template_id`
  ou lignes produit), `sale.order.line`, `ir.attachment`, et poste des notes dans le chatter.

**Variables d'env Odoo (noms uniquement)** : `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY`
— toutes **serveur uniquement**.

---

## 3. SUPABASE

**Oui — installé, configuré et largement utilisé.**

- Dépendances : **`@supabase/ssr ^0.10`** + **`@supabase/supabase-js ^2.102`**.
- **Clients** (`src/lib/supabase/`) :
  - `client.ts` → `createBrowserClient` (anon, navigateur).
  - `server.ts` → `createServerClient` (anon, cookies via `next/headers`) pour Server Components / routes.
  - `admin.ts` → `createAdminClient()` **service-role**, **bypass RLS, serveur uniquement**.
  - `middleware.ts` → rafraîchissement de session + logique de gate (voir §7).
- **Schéma / migrations** : dossier `supabase/` (fichiers `.sql` à exécuter manuellement, cf.
  `docs/MIGRATIONS_TO_RUN.md`). Tables détectées :
  - **`portal_clients`** *(clé de voûte)* : lie `auth.users.id` ↔ Odoo
    (`odoo_partner_id`, `odoo_template_prefix`, `product_config` JSONB, `client_type`,
    `odoo_agency_id`, `organization_id`, …), RLS « chaque user voit sa ligne ».
  - **`rdv_drafts`** : brouillons du formulaire (`form_data`, `selected_product`,
    `selected_options`, `current_step`, `document_paths`), RLS par `user_id`.
  - **`rdv_custom_values`**, `custom_fields`, `organization_custom_fields` (champs personnalisés par orga).
  - `organizations`, `invitations`, `portal_submissions`, `portal_message_reads`,
    `product_catalog`, `user_consents` (RGPD/CGU), `audit_log`.
- **Storage** : bucket **`rdv-documents`** (upload des pièces jointes, chemin `${user.id}/${orderId}/${fileName}`).

**Variables d'env Supabase (noms uniquement)** :
`NEXT_PUBLIC_SUPABASE_URL` *(publique)*, `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(publique)*,
`SUPABASE_SERVICE_ROLE_KEY` *(**serveur uniquement — ne jamais exposer**)*.

---

## 4. RESEND

**Oui — SDK présent et utilisé.**

- Dépendance : **`resend ^6.10`**.
- Wrapper : **`src/lib/email.ts`** → `getResendClient()` (singleton paresseux) + **`sendEmail()`**
  (validation des destinataires, **blocklist de domaines en production**, tags, logs hashés via
  `src/lib/safe-log.ts`).
  - Expéditeur : `Axis Experts <noreply@axis-experts.be>` ; reply-to par défaut `info@axis-experts.be`.
- **Templates email** : `src/lib/email-templates/rdv-notification.ts`.
- **Emails déjà envoyés** :
  - `POST /api/submit-rdv` (Step 12 / 12b) : email au bailleur + **email interne** à `info@axis-experts.be`
    (avec récap mission, tarification HTVA/TVA/TVAC, lien vers le devis Odoo).
  - `GET /api/cron/check-rdv-notifications` (notifications RDV planifiées).
  - `POST /api/admin/organizations/[id]/notifications/test` + `api/admin/invite` (invitations).

**Variable d'env Resend (nom uniquement)** : `RESEND_API_KEY` — **serveur uniquement**.

---

## 5. VARIABLES D'ENVIRONNEMENT

Toutes les valeurs sont masquées. Liste issue de `grep process.env.*` dans `src/` + `.env.example`.

### Publiques (`NEXT_PUBLIC_*`) — exposées au navigateur
| Nom | Rôle | Dans `.env.example` ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon Supabase | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocomplete adresses (BE) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | URL de base du site | ❌ (utilisé dans le code) |

### Serveur uniquement — jamais exposées
| Nom | Rôle | Dans `.env.example` ? |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role (bypass RLS) | ✅ |
| `ODOO_URL` | URL instance Odoo | ✅ |
| `ODOO_DB` | Base Odoo | ✅ |
| `ODOO_USER` | Compte API Odoo | ✅ |
| `ODOO_API_KEY` | Clé API Odoo | ✅ |
| `RESEND_API_KEY` | Clé API Resend | ✅ |
| `CRON_SECRET` | Bearer pour `/api/cron/*` | ✅ |
| `ADMIN_EMAILS` | Liste d'emails admin (gate `isAdmin`) | ❌ (utilisé dans le code) |
| `NODE_ENV` | Fourni par la plateforme | n/a |

> ⚠️ **À documenter** : `NEXT_PUBLIC_SITE_URL` et `ADMIN_EMAILS` sont **lus dans le code mais absents
> de `.env.example`**. À ajouter à l'inventaire d'env Vercel pour la nouvelle feature si besoin.

---

## 6. ROUTES (App Router) — où greffer proprement

### Pages existantes (`src/app/*/page.tsx`)
`/` (login/landing), `/login`, `/dashboard`, **`/demande`** (formulaire RDV multi-étapes),
`/brouillons`, **`/confirmation`** (écran de succès, redirige vers `/dashboard` après 5 s),
`/profil`, `/dactylo`, `/setup-account`, `/reset-password`, `/cgu-required`,
`/account-suspended`, `/admin/*`. Boundaries : `error.tsx`, `global-error.tsx`, `not-found.tsx`,
`layout.tsx`.

### Route handlers (`src/app/api/.../route.ts`)
Auth (`api/auth/*`), Odoo (`api/odoo/*`), **`api/submit-rdv`**, `api/drafts`, `api/custom-fields`,
`api/rdv-custom-values`, `api/agency/price-catalog`, `api/dactylo/*`, `api/cron/*`,
`api/admin/*`, `api/health`, `api/messages/*`, `api/profile`, `api/cgu/accept`.

> **Server Actions** : non utilisées pour ce flux — tout passe par des **route handlers** + `fetch`
> côté client (ex. `/demande` appelle `/api/odoo/products`, `/api/submit-rdv`, `/api/drafts`,
> `/api/rdv-custom-values`). Conserver ce pattern pour rester cohérent.

### Où ajouter la feature « demande de RDV » (sans rien casser)

| Besoin demandé | Existe déjà ? | Recommandation d'emplacement |
|---|---|---|
| **Page formulaire `/demande`** | ✅ `src/app/demande/page.tsx` | **Réutiliser/étendre** la page existante. Pour une variante isolée, créer `src/app/demande/<variante>/page.tsx`. |
| **Route API « prix Odoo »** | ⚠️ partiel | Lecture produits = `GET /api/odoo/products` ; tarif agence = `GET /api/agency/price-catalog`. Pour un calcul de prix dédié, ajouter **`src/app/api/odoo/price/route.ts`** (réutilise `odooExecute`/`odooSearch`). |
| **Route API « soumission »** | ✅ `POST /api/submit-rdv` | **Réutiliser** ; sinon nouvelle route sœur `src/app/api/<feature>/route.ts`. |
| **Route API « confirmation »** | ❌ | Ajouter **`src/app/api/confirmer/[token]/route.ts`** (GET valider / POST confirmer). |
| **Page de confirmation `/confirmer/[token]`** | ❌ (il existe `/confirmation` sans token) | Créer **`src/app/confirmer/[token]/page.tsx`** (route dynamique). Distincte de l'écran `/confirmation` actuel. |

> Le flux **token** (`/confirmer/[token]`) **n'existe pas encore**. Un pattern de token réutilisable
> est déjà présent ailleurs : invitations (`api/auth/validate-token`, `setup-account?token=…`,
> token auto-généré en base) → s'en inspirer pour générer/valider un token de confirmation RDV
> (table Supabase dédiée + lien dans l'email Resend).

---

## 7. AUTH / MIDDLEWARE

- **Auth = Supabase Auth** (sessions par cookies, `@supabase/ssr`). Pas d'autre fournisseur.
- ⚠️ **Next.js 16 — point d'intégration critique** : le middleware s'appelle **`src/proxy.ts`** et
  exporte une fonction **`proxy(request)`** (et non `middleware()` dans `middleware.ts`). C'est une
  rupture par rapport aux versions antérieures (cf. `AGENTS.md`). Toute route nouvelle est
  **filtrée par ce `proxy` + son `config.matcher`**.
  - `matcher` actuel : tout sauf `_next/static`, `_next/image`, `favicon.ico`, et fichiers images.
- Logique déléguée à **`src/lib/supabase/middleware.ts` → `updateSession()`** :
  - Rafraîchit la session ; **redirige les non-authentifiés vers `/login`** (ou `401` pour `/api/*`),
    avec exceptions (`/`, `/login`, `/setup-account`, `/auth/callback`, `/api/auth/validate-token`,
    `/api/auth/setup-account`, `/api/cron/*`, `/api/health`).
  - **Gate CGU** (`user_consents`, version `v1.0`) → redirige vers `/cgu-required` (ou `403 cgu_required`).
  - **Routing admin** (`isAdmin(email)` via `ADMIN_EMAILS`, `src/lib/admin.ts`) → admins forcés vers `/admin`.
  - **Suspension d'organisation** (`organizations.is_active`) → `/account-suspended` / `403`.
  - **Routing `dactylo`** selon `portal_clients.client_type`.
- **Rate-limiting** applicatif : `src/lib/rate-limit.ts` (`checkRateLimit`), déjà appliqué dans
  `submit-rdv` (10/h) et `auth/validate-token`.
- **Audit** : `src/lib/audit/log-action.ts` (`logAction`) écrit dans `audit_log`.

> 👉 Pour la nouvelle feature : une **page `/confirmer/[token]` accessible sans login** (le locataire
> n'a pas de compte) devra être **explicitement exemptée** dans `proxy.ts` **et** dans `updateSession()`
> (comme l'est `/setup-account`), faute de quoi le visiteur sera redirigé vers `/login`.

---

## 8. DÉPLOIEMENT

- **Vercel.** `vercel.json` minimal : déclare **un cron** →
  `path: /api/cron/check-rdv-notifications`, `schedule: */10 * * * *` (toutes les 10 min).
  Le handler cron est protégé par `CRON_SECRET` (`Authorization: Bearer …`).
- `next.config.ts` : `experimental.proxyClientMaxBodySize = "25mb"` — **plafond d'upload** aligné avec
  `TOTAL_DOCUMENTS_BUDGET` (25 MB) dans `submit-rdv`. À garder en tête pour tout nouvel upload.
- **Variables d'env** : injectées via le **dashboard Vercel** (Project → Settings → Environment
  Variables), par environnement (Production / Preview / Development). `.env.example` sert de référence
  des noms ; aucune valeur n'est committée (`.gitignore` couvre `.env*`).

---

## CONCLUSION

### ✅ DÉJÀ EN PLACE (réutilisable tel quel)
- **Stack** Next.js 16 App Router + React 19 + TypeScript strict + pnpm ; alias `@/*`.
- **Styling** Tailwind v4 (config CSS-first, thème `#F5B800`) + composants shadcn/Radix maison + `cn()` + sonner/lucide.
- **Client Odoo** XML-RPC complet (`src/lib/odoo.ts` : `odooExecute`/`odooCreate`/`odooSearch`, auth+cache+retry, `CLIENT_TEMPLATES`).
- **Création de devis Odoo** de bout en bout (`POST /api/submit-rdv` : partners, `sale.order`, lignes, pièces jointes, chatter).
- **Clients Supabase** (browser/server/admin/middleware) + tables clés (`portal_clients`, `rdv_drafts`, `product_catalog`, `audit_log`…) + **Storage `rdv-documents`**.
- **Emails Resend** via `sendEmail()` (expéditeur, reply-to, blocklist prod, tags) + templates RDV + email interne.
- **Page `/demande`** (formulaire multi-étapes avec brouillons) + **écran `/confirmation`**.
- **Auth/middleware** (`proxy.ts` + `updateSession`), **rate-limit**, **audit log**, **gate CGU**, **routing admin/dactylo/orga**.
- **Déploiement Vercel** + cron de notifications + plafond d'upload configuré.
- **Inventaire d'env** complet et nommé (Supabase, Odoo, Resend, Cron, Google Maps).

### ➕ À AJOUTER pour la feature RDV (selon le périmètre exact visé)
- **Flux de confirmation par token** (inexistant) :
  - Page **`src/app/confirmer/[token]/page.tsx`** (route dynamique, **publique**).
  - Route(s) **`src/app/api/confirmer/[token]/route.ts`** (valider GET / confirmer POST).
  - **Table Supabase** pour les tokens de confirmation RDV (génération + expiration + statut),
    sur le modèle des `invitations`.
  - **Exemptions middleware** : ajouter `/confirmer` (et son API) dans `src/proxy.ts` **et**
    `src/lib/supabase/middleware.ts` pour autoriser l'accès sans session.
  - **Email Resend** de confirmation contenant le lien `…/confirmer/<token>` (étendre `submit-rdv`
    ou les templates `email-templates/`).
- **Route « prix Odoo » dédiée** si un calcul de tarif distinct est requis
  (`src/app/api/odoo/price/route.ts`), au-delà de `/api/odoo/products` et `/api/agency/price-catalog`.
- **Documenter 2 variables d'env déjà utilisées mais absentes de `.env.example`** :
  `NEXT_PUBLIC_SITE_URL` (publique) et `ADMIN_EMAILS` (serveur) — utiles pour générer des liens
  absolus de confirmation et gérer les droits.
- **Migration(s) SQL** correspondantes à ajouter dans `supabase/` + à référencer dans
  `docs/MIGRATIONS_TO_RUN.md` (exécution manuelle, comme l'existant).
- **Tests Vitest** pour la nouvelle logique (le repo teste déjà `parseRdvDate`, `rdvDateSchema`, etc.).

> ℹ️ Recommandation : avant toute implémentation, lire les guides versionnés dans
> `node_modules/next/dist/docs/` (consigne `AGENTS.md` : « This is NOT the Next.js you know ») —
> notamment pour `proxy.ts`/middleware et les routes dynamiques, dont les conventions diffèrent des
> versions antérieures.
