# Audit pré-lancement axis-experts-rdv — 2026-05-20

> Scan effectué sur la branche `claude/pre-launch-audit-qHKPt` (HEAD `be4a3e3`).
> Aucune modification de code n'a été effectuée.
> Stack : Next.js **16.2.2** (App Router) + Supabase (psbcebctdkxuqnoxgwrs) + Odoo XML-RPC + Resend + Google Maps JS.

## Résumé exécutif

- **4 P0 bloquants / 9 P1 / 8 P2**
- **Verdict : NO-GO en l'état**. Trois éléments rendent le lancement risqué :
  1. Next.js 16.2.2 cumule **5 CVE non patchés** dont une **bypass middleware HIGH** (CVE-2026-44575). Toute l'auth pages-HTML du portail repose sur `src/proxy.ts` — exactement le mécanisme contourné par cette CVE.
  2. **Régression fonctionnelle agences immobilières** : un client `client_type = 'agency'` ne peut plus accéder aux pièces jointes ni à la messagerie de ses propres commandes (ownership check sur `partner_id` qui ne matche plus depuis le swap `orderPartnerId = bailleurPartnerId`).
  3. **Abuse Resend possible** : tout utilisateur authentifié peut déclencher l'envoi d'un email transactionnel depuis `noreply@axis-experts.be` vers une adresse arbitraire via `bailleurEmail` (POST `/api/submit-rdv`).
- **Top 3 risques** :
  - Bypass d'auth middleware (Next 16.2.2) → fuite de payloads RSC sur routes protégées.
  - Service-role key exfiltration via mauvaise séparation : 23 routes utilisent `createAdminClient()` ; toute faille dans une seule d'entre elles donne accès complet à la DB (Supabase RLS bypass total).
  - PII (emails, téléphones, noms de locataires/bailleurs) déversée massivement dans les logs Vercel (~50 `console.log` PII-sensitive dans `submit-rdv`).

---

## P0 — Bloquants lancement

### P0-01 — Next.js 16.2.2 : bypass auth middleware (CVE-2026-44575)

- **Catégorie** : Sécurité
- **Fichier(s)** : `package.json:24`, `src/proxy.ts:1-25`, `src/lib/supabase/middleware.ts:36-55`
- **Description** : Next.js 16.0.0–16.2.4 contient une faille HIGH (GHSA-267c-6grr-h53f, CVSS 7.5) qui permet de contourner les vérifications middleware via des URLs `.rsc` / segment-prefetch. Ce repo utilise `src/proxy.ts` (= middleware Next 16) comme **seule barrière d'auth pour les pages HTML** (admin redirect, redirection login, blocage organisations suspendues, routing dactylo). Quatre autres CVE Next.js non patchées sont également présentes : DoS RSC (CVE-2026-23869), cache poisoning (CVE-2026-44576), pages-router i18n bypass (CVE-2026-44573 — non applicable ici), CVE-2026-23870.
- **Impact** : Un attaquant peut récupérer les payloads RSC de routes protégées (`/admin`, `/admin/organizations/[id]`, `/dashboard`, `/brouillons`, `/dactylo`) sans cookie de session. Même si les API `/api/*` restent protégées par `supabase.auth.getUser()`, les RSC d'un layout serveur peuvent inclure des composants serveur, des `unstable_cache`, ou des intercept routes qui exposent du HTML. Sur `/admin/*` le layout est client donc l'exposition est faible, mais sur `/account-suspended` et `/setup-account` du contenu pourrait fuiter (faible). Le risque combiné des 5 CVE (notamment le cache poisoning) reste **lancement-bloquant**.
- **Correction proposée** : `pnpm up next@^16.2.5` (ou plus récent). Vérifier que `next build` passe puis re-tester le flow login → dashboard → demande RDV. Les CVE patches ne touchent pas les API publiques utilisées dans le repo.
- **Effort estimé** : 0.5 h (bump + smoke test).

### P0-02 — Agences : impossible d'accéder aux pièces jointes et à la messagerie de leurs propres commandes

- **Catégorie** : Bug
- **Fichier(s)** :
  - `src/app/api/odoo/attachments/route.ts:55-66`
  - `src/app/api/odoo/attachments/download/route.ts:77-86`
  - `src/app/api/odoo/messages/route.ts:45-52, 72, 243-245`
  - vs `src/app/api/submit-rdv/route.ts:500` (cause racine du swap)
- **Description** : Depuis l'introduction du `client_type = 'agency'`, `submit-rdv` positionne `sale.order.partner_id = bailleurPartnerId` (propriétaire réel) au lieu de l'agent. Or les trois routes ci-dessus vérifient encore l'ownership avec `[["partner_id", "=", clientRow.odoo_partner_id]]`. Pour un utilisateur agence, `clientRow.odoo_partner_id` est l'**agent**, donc `partner_id` Odoo (= owner) ne matche jamais. L'utilisateur agence voit la commande dans `/dashboard` (filtre `x_studio_agence_partenaire IN agentIds` dans `/api/odoo/orders`) mais reçoit `404 "Commande non trouvée"` dès qu'il clique sur les détails (PDFs, messagerie, envoi de message).
- **Impact** : Toute la valeur du module agence (consulter rapports, échanger via chatter Odoo, télécharger PV) est **inaccessible**. Production-bloquant pour les clients agence.
- **Correction proposée** : Aligner les 3 routes sur la même logique que `/api/odoo/orders` :
  ```ts
  // pseudo-code, à intégrer dans verifyOrderOwnership()
  if (clientRow.client_type === 'agency') {
    const agentIds = [partnerId, ...agentsOfAgency(clientRow.odoo_agency_id)];
    return search_count('sale.order', [['id','=',orderId], ['x_studio_agence_partenaire','in',agentIds]]) > 0;
  }
  return search_count('sale.order', [['id','=',orderId], ['partner_id','=',partnerId]]) > 0;
  ```
  Factoriser dans un helper `lib/odoo/ownership.ts` consommé par les 3 routes.
- **Effort estimé** : 2 h (helper + adaptation + test manuel d'un compte agence).

### P0-03 — Abuse Resend : envoi d'emails arbitraires authentifié depuis noreply@axis-experts.be

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/api/submit-rdv/route.ts:54-59, 895-915`, `src/lib/email.ts:5,19-44`
- **Description** : Tout utilisateur authentifié peut POST `/api/submit-rdv` avec un `bailleurEmail` quelconque. Côté serveur, la seule validation est une regex laxe `^[^\s@]+@[^\s@]+\.[^\s@]+$`. À l'étape 12, l'API envoie un email via Resend avec `from: "Axis Experts <noreply@axis-experts.be>"` vers ce destinataire — contenu en partie contrôlé par l'attaquant (mission label, adresse, locataire, dates échappés par `escapeHtml` mais visibles dans `subject`). Aucun rate-limit. La création d'un sale.order Odoo est un freinage léger mais non bloquant (l'attaquant peut industrialiser à plusieurs RDV/minute).
- **Impact** :
  - **Hijack de domaine Resend** : envoi de phishing/spam crédible depuis `noreply@axis-experts.be` qui passera SPF/DKIM (le domaine est légitime). Risque de blacklistage du domaine d'envoi → mort des emails transactionnels en pleine campagne.
  - Création parasite de `res.partner` Odoo (poubellisation de la base).
- **Correction proposée** :
  1. Restreindre la cible : si `bailleurEmail` est fourni, n'envoyer que si cet email appartient à `portal_clients.email_bailleur` connu OU si le compte client a explicitement déclaré ce mail dans `organizations.contact_email` / champ admin.
  2. Rate-limit `/api/submit-rdv` (ex : 10 req/h/user via Upstash Redis ou table `request_log`).
  3. Logger `user.id + recipient` à chaque envoi pour traçabilité.
- **Effort estimé** : 4 h.

### P0-04 — Documents `submit-rdv` : pas de limite de taille / quantité → DoS RAM + Storage

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/api/submit-rdv/route.ts:90-104, 813-860`, `next.config.ts:4`
- **Description** : Le body de `POST /api/submit-rdv` est plafonné à **200 Mo** (`proxyClientMaxBodySize: "200mb"` dans `next.config.ts:4`). Le handler accepte `documents: Array<{ name, customName?, base64 }>` sans :
  - cap sur le **nombre** d'attachments (`for (const doc of documents)` itère sans borne) ;
  - cap sur la **taille** par attachment (base64 → `Buffer.from()` peut allouer ~150 Mo en RAM) ;
  - validation du **MIME réel** (`mimeMap` se contente de l'extension) ;
  - upload vers Storage en `upsert: true` avec `storagePath = ${user.id}/${fileName}` → un même user peut overwriter ses propres fichiers, mais aussi remplir son répertoire jusqu'à saturation.
  Comparer avec `/api/dactylo/upload-batch` (`src/components/dactylo/constants.ts`) qui plafonne explicitement à 20 Mo/fichier, 10 fichiers/ligne, 50 lignes max, et vérifie le magic byte `ZIP_MAGIC`.
- **Impact** : Un utilisateur authentifié peut envoyer 200 Mo en boucle → exhaustion mémoire Lambda Vercel (timeout 30s avant impact massif mais consommation de quotas), explosion du quota Supabase Storage. À l'échelle d'un client mal intentionné ou compromis, **DoS sur l'application en pré-launch**.
- **Correction proposée** : Aligner sur `/api/dactylo/upload-batch` :
  - `MAX_DOCUMENTS = 15`, `MAX_DOCUMENT_BYTES = 10 * 1024 * 1024` (base64 ≈ 14 MB), refuser si `Buffer.byteLength(doc.base64, 'base64') > MAX_DOCUMENT_BYTES`.
  - Validation MIME via magic bytes (PDF `%PDF`, JPEG `\xFF\xD8\xFF`, PNG `\x89PNG`, ZIP `PK\x03\x04` pour docx/xlsx).
  - Soit baisser `proxyClientMaxBodySize` à `25mb`, soit basculer documents sur upload direct Supabase Storage côté client (signed URL).
- **Effort estimé** : 4 h.

---

## P1 — Important, à corriger avant ou juste après lancement

### P1-01 — Comparaison non timing-safe du CRON_SECRET

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/api/cron/check-rdv-notifications/route.ts:86-89`
- **Description** : `authHeader.slice(7) !== expected` est une comparaison `!==` standard, vulnérable au timing attack distant (faible mais réel).
- **Impact** : En théorie un attaquant pourrait deviner le secret octet par octet. En pratique le secret est un random long, donc risque faible.
- **Correction proposée** : `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))` après contrôle d'égalité de longueur.
- **Effort estimé** : 15 min.

### P1-02 — Admin email fallback hardcodé `n.rommiee@axis-experts.be`

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/lib/admin.ts:3`, `src/app/admin/layout.tsx:10`
- **Description** : Si `ADMIN_EMAILS` n'est pas définie en prod, **seul** `n.rommiee@axis-experts.be` est admin. Si `NEXT_PUBLIC_ADMIN_EMAIL` n'est pas définie, le client UI utilise aussi ce fallback. Deux problèmes :
  1. Un déploiement avec env mal configurée verrouille tout sauf un seul compte (continuité d'activité).
  2. La valeur en clair dans le bundle JS client (`NEXT_PUBLIC_*`) expose l'email de l'admin principal — utile pour un attaquant ciblant un phishing.
- **Correction proposée** : Retirer le fallback hardcodé. Faire crasher au boot si `ADMIN_EMAILS` est manquant. Côté client, ne plus exposer la liste : déléguer la décision à `/api/auth/me` qui renvoie un flag `is_admin`.
- **Effort estimé** : 1 h.

### P1-03 — PATCH `/api/admin/organizations/[id]` écrase silencieusement `client_type='dactylo'` en `social`

- **Catégorie** : Bug
- **Fichier(s)** : `src/app/api/admin/organizations/[id]/route.ts:121-122`, `src/app/api/admin/organizations/route.ts:112-113`
- **Description** : Le code force `body.client_type === "agency" ? "agency" : "social"`. Toute édition d'une organisation Prodactylo (créée par la migration `20260421120000_add_dactylo_client_type.sql`) la mute en `social` dès que l'admin clique « Enregistrer ». Le CHECK constraint Postgres accepte `dactylo` mais l'API ne le retient pas.
- **Impact** : Casse silencieuse de l'organisation Prodactylo après n'importe quelle édition admin (le routing dactylo en middleware repose sur `portal_clients.client_type` — qui est copié depuis `organizations.client_type` à `setup-account/route.ts:140`, mais aussi sur la propagation manuelle). Le module dactylo se désactive en production.
- **Correction proposée** : `const VALID = ["social", "agency", "dactylo"] as const; updates.client_type = VALID.includes(body.client_type) ? body.client_type : current.client_type;`
- **Effort estimé** : 30 min.

### P1-04 — `rdv-custom-values` POST : pollution cross-user intra-organisation

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/api/rdv-custom-values/route.ts:23-85`
- **Description** : Le POST valide que `clientRow.organization_id` existe mais accepte n'importe quel `order_ref` envoyé par le client. Un utilisateur peut donc upserter des valeurs custom (via la clause `onConflict: organization_id,custom_field_id,order_ref`) sur **les commandes d'autres utilisateurs de la même organisation**. Le `custom_field_id` n'est pas non plus vérifié comme appartenant aux `organization_custom_fields` actives de l'org (un id de champ d'une autre org peut être injecté ; il restera invisible en GET car filtré par `organization_id` à la lecture, mais pollue la table).
- **Impact** : Intégrité données (modification par un collègue sans audit), surface d'abus modérée.
- **Correction proposée** :
  1. Vérifier que `order_ref` provient d'un `portal_submissions` de la même org (ou plus simple : champ `created_by` sur `rdv_custom_values` + RLS).
  2. Joindre `custom_field_id` à `organization_custom_fields` actives lors de l'INSERT.
- **Effort estimé** : 1.5 h.

### P1-05 — Garde-fou admin layout côté client uniquement

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/admin/layout.tsx:8-52`, `src/lib/supabase/middleware.ts:60-72`
- **Description** : Le layout admin est un *Client Component* qui redirige vers `/dashboard` si l'email n'est pas dans `ADMIN_EMAILS_PUBLIC`. La protection serveur n'existe **pas** au niveau page : seul le middleware redirige les utilisateurs *admin* de `/dashboard` vers `/admin` (jamais l'inverse). Conséquence : un utilisateur non-admin peut récupérer le HTML / RSC du shell admin (boutons, structure). Toutes les données sensibles sont chargées via `/api/admin/*` qui sont, eux, correctement gardés par `isAdmin(user.email)` côté serveur — donc impact = leak de structure UI uniquement.
- **Impact** : Faible (cosmétique + reconnaissance), aggravé si combiné à P0-01.
- **Correction proposée** : Convertir `src/app/admin/layout.tsx` en Server Component qui appelle `createClient()` + `isAdmin()`, et `notFound()` ou redirect serveur si non admin. Garder le composant client uniquement pour le bouton « Déconnexion ».
- **Effort estimé** : 2 h.

### P1-06 — PII massivement loggée dans `submit-rdv` et `cron`

- **Catégorie** : Sécurité (RGPD)
- **Fichier(s)** :
  - `src/app/api/submit-rdv/route.ts` (53 `console.log/warn/error`, dont L386, L393, L401, L410, L417, L527, L612, L614, L636 — noms, emails, IDs partenaires, payload complet `JSON.stringify(orderValues)`)
  - `src/app/api/cron/check-rdv-notifications/route.ts:275, 304-340` (emails destinataires)
- **Description** : Les logs Vercel sont consultables par toute personne disposant du projet Vercel (collaborateurs, intégrations). RGPD : les noms+emails+téléphones de locataires/bailleurs (catégorie données personnelles) y sont rejetés en clair, conservés ≥30 jours sur Vercel.
- **Impact** : Risque de fuite si un compte Vercel est compromis ou si un log forwarder externe (Datadog, Logflare) est configuré sans contrat DPA approprié. Manquement RGPD potentiel (minimisation, principe de proportionnalité).
- **Correction proposée** :
  1. Supprimer les `console.log` qui dumpent emails/noms/téléphones complets. Garder uniquement `order_id`, `step`, `status`, `duration_ms`.
  2. Si tracing nécessaire : hasher (sha256 partial) les PII avant log.
- **Effort estimé** : 2 h.

### P1-07 — `dactylo/orders` listing sans scoping par organisation

- **Catégorie** : Bug (potentiellement Sécurité)
- **Fichier(s)** : `src/lib/odoo/dactylo.ts:109-128`, `src/app/api/dactylo/orders/route.ts:48`
- **Description** : `listOrdersInDactyloStatus()` retourne **toutes** les commandes Odoo en statut "Dactylo", sans aucun filtre par `portal_clients.organization_id` du user qui requête. Le commentaire L100-108 mentionne « across all client organizations ». C'est le comportement attendu pour Prodactylo (sous-traitant unique), mais si plusieurs comptes `dactylo` sont créés à l'avenir, chacun verra le pool complet. Aujourd'hui, **un seul utilisateur dactylo** = OK. À documenter explicitement.
- **Impact** : Aujourd'hui aucun. Demain, scaling = leak transverse client.
- **Correction proposée** : Ajouter un commentaire `// SECURITY: any client_type=dactylo user sees ALL queues. Today Prodactylo is the only one.` + créer un suivi de dette.
- **Effort estimé** : 15 min documentation + ~3 h le jour où un 2e dactylo apparaît.

### P1-08 — Aucun rate-limit sur endpoints publics ou semi-publics

- **Catégorie** : Sécurité
- **Fichier(s)** : `src/app/api/auth/setup-account/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/validate-token/route.ts`, `src/app/api/submit-rdv/route.ts`, `src/app/login/page.tsx`
- **Description** : Aucune dépendance `@upstash/ratelimit`, `next-rate-limit`, ou équivalent dans `package.json`. `grep -rIn "rateLimit\|throttle\|rate.limit" src/` → 0 résultat. Conséquences :
  - **/api/auth/validate-token** : enumeration d'invitations par UUID (faible — UUID v4) mais brute-force possible.
  - **/api/auth/setup-account** + **/register** : création de comptes en boucle si un token de test fuite.
  - **Login Supabase** : Supabase Auth a son propre throttling mais peut être affiné côté app.
  - **/api/submit-rdv** : voir P0-03 et P0-04.
- **Impact** : Plus exploitable post-incident qu'aujourd'hui — mais à mettre avant lancement public.
- **Correction proposée** : Upstash Redis (free tier) + middleware `rateLimit({ identifier: ip || userId, limit: 60, window: '1m' })` appliqué via `src/proxy.ts` sur `/api/auth/*` et `/api/submit-rdv`.
- **Effort estimé** : 4 h (intégration + déploiement Upstash).

### P1-09 — Storage Supabase : `upsert: true` + path à partir du nom client

- **Catégorie** : Sécurité (mineure) + Bug
- **Fichier(s)** : `src/app/api/submit-rdv/route.ts:829-832`
- **Description** : `storagePath = ${user!.id}/${fileName}` avec `upsert: true`. Si deux RDV soumis par le même user partagent un fichier nommé `etat_des_lieux.pdf`, le second écrase le premier. La RLS storage limite déjà à `(storage.foldername(name))[1] = auth.uid()::text` — donc impact cross-user impossible — mais perte de données intra-user possible.
- **Impact** : Perte silencieuse de documents historiques.
- **Correction proposée** : Préfixer le path par `orderId` ou un UUID : `${user.id}/${orderId}/${fileName}`.
- **Effort estimé** : 30 min.

---

## P2 — À traiter post-lancement

### P2-01 — `@types/xmlrpc` + dépendance `xmlrpc@1.3.2` ancienne

- **Catégorie** : Dette
- **Fichier(s)** : `package.json:30`, `src/lib/odoo.ts:1`
- **Description** : `xmlrpc` 1.3.2 (publié 2017). Pas de CVE référencé dans `npm audit`, mais maintenance morte. Le commentaire `src/lib/odoo/dactylo.ts:232-236` indique déjà une inquiétude sur l'encodage UTF-8 (`"A vérifier par expert"`).
- **Correction proposée** : À moyen terme, remplacer par un client HTTP direct + serialisation maison, ou migrer vers JSON-RPC Odoo si disponible.

### P2-02 — `window.google: any` (TypeScript)

- **Catégorie** : Dette
- **Fichier(s)** : `src/lib/google-maps-loader.ts:5`, `src/app/demande/page.tsx:34`
- **Description** : Cast `any` pour le namespace Google Maps. `@googlemaps/js-api-loader` n'est plus utilisé (bootstrap inline).
- **Correction proposée** : Installer `@types/google.maps` (dev-only) ou retirer la déclaration globale et typer via le namespace officiel.

### P2-03 — Migration legacy `useAddressAutocomplete`

- **Catégorie** : Dette
- **Fichier(s)** : `src/lib/useAddressAutocomplete.ts:11`
- **Description** : TODO existant : « migrer vers `google.maps.places.PlaceAutocompleteElement` (Autocomplete est legacy / déprécié) ». Google déprécie progressivement `Autocomplete` (sans date EOL à ce jour).
- **Correction proposée** : Ticket dédié, sans urgence court terme.

### P2-04 — `process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()` ailleurs sans trim

- **Catégorie** : Dette
- **Fichier(s)** : `src/lib/supabase/client.ts:5-6` (trim), vs `src/lib/supabase/server.ts:8-9`, `src/lib/supabase/middleware.ts:10-11`, `src/lib/supabase/admin.ts:6-7` (pas de trim)
- **Description** : Incohérence — si l'env var a un espace trailing, le client browser fonctionne mais le serveur échoue ou vice-versa. Issue déjà rencontrée probablement (sinon pas de `.trim()` côté client).
- **Correction proposée** : Centraliser dans un module `lib/env.ts` qui valide et trim une fois.

### P2-05 — Tests unitaires : couverture critique manquante

- **Catégorie** : Qualité
- **Fichier(s)** : Tests présents :
  - `src/lib/utils.test.ts`
  - `src/lib/admin-users.test.ts`
  - `src/lib/parseRdvDate.test.ts`
  - `src/lib/validation/rdvDateSchema.test.ts`
  - `src/components/ui/date-range-picker.test.tsx`
- **Description** : Aucun test sur les routes API critiques (`submit-rdv`, `setup-account`, `cron`, `dactylo/upload-batch`). Pas de test E2E.
- **Correction proposée** : Ajouter au minimum des tests d'intégration sur le flow `submit-rdv` (mocked Odoo + Supabase).

### P2-06 — Logs `console.log` extensifs en prod

- **Catégorie** : Dette
- **Description** : ~169 `console.*` dans `src/app/api/`. Au-delà du P1-06 sur la PII, tous ces logs polluent les logs Vercel et consomment du quota.
- **Correction proposée** : Adopter `pino`/`@vercel/logger` avec niveaux `info`/`debug`/`error` et `LOG_LEVEL=info` en prod.

### P2-07 — README.md générique Create-Next-App

- **Catégorie** : Dette docs
- **Fichier(s)** : `README.md`
- **Description** : README non personnalisé, aucune section opération/déploiement.
- **Correction proposée** : Documenter env vars, flux d'invitation, runbook cron.

### P2-08 — Logos et `.gitkeep` dans `public/logos/`

- **Catégorie** : Dette
- **Fichier(s)** : `public/logos/cpas_ocmw.jpg`, `public/cpas_ocmw.jpg` (doublon), `public/logo_evercity.jpg`
- **Description** : Logos clients commités dans le repo (CPAS, Everecity). Pas un risque mais pollution. Doublon `cpas_ocmw.jpg` à la racine `/public/` et `/public/logos/`.
- **Correction proposée** : Soit migrer vers Supabase Storage `org-logos`, soit nettoyer le doublon.

---

## Annexes

### A. Tables Supabase & RLS

| Table | RLS activé | Policies | Risque |
| --- | --- | --- | --- |
| `portal_clients` | ✅ | SELECT/UPDATE auth.uid()=user_id | OK |
| `rdv_drafts` | ✅ | Org-scoped CRUD (membres de l'org) | OK |
| `portal_message_reads` | ✅ | FOR ALL auth.uid()=user_id | OK |
| `invitations` | ✅ | Aucune policy → service_role uniquement | OK |
| `organizations` | ✅ | SELECT membres uniquement | OK |
| `custom_fields` | ✅ | SELECT authenticated | OK (catalogue global non sensible) |
| `organization_custom_fields` | ✅ | SELECT scoped org | OK |
| `rdv_custom_values` | ✅ | SELECT/INSERT/UPDATE scoped org | Voir P1-04 (pollution intra-org possible) |
| `product_catalog` | ✅ | SELECT authenticated, mutate service-role | OK |
| `portal_submissions` | ⚠️ **Migration absente du repo** | — | Vérifier manuellement dans le dashboard Supabase qu'elle a RLS et que seul service_role écrit/lit |
| `rdv_notifications_sent` | ⚠️ **Migration absente du repo** | — | Idem — table créée hors migrations git |
| `invitations_legacy` | ?? | héritée | À droper si possible (`invitations_legacy_doc.sql`) |

> **À vérifier hors repo** : présence de RLS sur `portal_submissions` et `rdv_notifications_sent` (référencées dans `submit-rdv:1062` et `cron:96`). Ces deux tables n'ont **pas** de migration trackée dans `supabase/migrations/`.

### B. Edge Functions

Aucune Supabase Edge Function dans `supabase/functions/` (le dossier n'existe pas). Toutes les opérations « privilégiées » passent par des Route Handlers Next.js utilisant `createAdminClient()` (service-role).

### C. Routes /api

| Route | Méthode | Auth | Validation | Risque |
| --- | --- | --- | --- | --- |
| `/api/admin/users` | GET | admin | — | OK |
| `/api/admin/users/[id]/block` | POST | admin + self-check | — | OK |
| `/api/admin/users/[id]/unblock` | POST | admin | — | OK |
| `/api/admin/users/[id]/soft-delete` | POST | admin + self-check | — | OK |
| `/api/admin/stats` | GET | admin | — | OK |
| `/api/admin/stats/portal-orders` | GET | admin | — | OK |
| `/api/admin/stats/missions-by-org` | GET | admin | — | OK |
| `/api/admin/organizations` | GET/POST | admin | manuel | P1-03 (POST aussi affecté) |
| `/api/admin/organizations/[id]` | GET/PATCH | admin | manuel | **P1-03** |
| `/api/admin/organizations/[id]/stats` | GET | admin | — | OK |
| `/api/admin/organizations/[id]/articles` | GET | admin | — | OK |
| `/api/admin/organizations/[id]/notifications` | GET/PATCH | admin | manuel | OK |
| `/api/admin/organizations/[id]/notifications/test` | POST | admin | manuel | OK (envoi limité à recipients résolus) |
| `/api/admin/organizations/[id]/custom-fields` | * | admin | manuel | OK |
| `/api/admin/invitations` | GET | admin | — | OK |
| `/api/admin/invitations/[id]` | DELETE | admin | — | OK |
| `/api/admin/invite` | POST | admin | manuel + regex email | OK (escape HTML dans email) |
| `/api/admin/custom-fields` | GET/POST/PATCH/DELETE | admin | regex `^[a-z0-9_]+$` | OK |
| `/api/admin/custom-fields/activations` | * | admin | — | OK |
| `/api/auth/validate-token` | GET | public | trim | **P1-08** (pas de rate-limit) |
| `/api/auth/setup-account` | POST | public (token) | longueur 8+ password, 50 chars name | **P1-08** |
| `/api/auth/register` | POST | public (code) | regex email, length pwd | **P1-08** legacy ; à vérifier que le flow code/email n'est plus utilisé |
| `/api/auth/me` | GET | user | — | OK |
| `/api/submit-rdv` | POST | user | Zod sur dates uniquement, manuel pour le reste | **P0-03**, **P0-04**, **P1-06** |
| `/api/profile` | GET/PATCH | user | longueur max 50 | OK (utilise RLS) |
| `/api/custom-fields` | GET | user | — | OK |
| `/api/rdv-custom-values` | POST/GET | user | manuel | **P1-04** |
| `/api/drafts` | GET/POST | user | manuel | OK (limit 250 drafts) |
| `/api/drafts/[id]` | GET/DELETE | user | scoped via RLS | OK |
| `/api/messages/read` | POST | user | manuel | OK |
| `/api/messages/unread-check` | GET | user | — | OK |
| `/api/odoo/orders` | GET | user | manuel (offset/limit cap) | OK |
| `/api/odoo/products` | GET | user | — | (non audité en détail) |
| `/api/odoo/tags` | GET | user | — | (non audité en détail) |
| `/api/odoo/messages` | GET/POST | user | longueur 2000, 3 fichiers × ~10 Mo | **P0-02** pour agences |
| `/api/odoo/attachments` | GET | user | manuel | **P0-02** pour agences |
| `/api/odoo/attachments/download` | GET | user | manuel | **P0-02** pour agences |
| `/api/agency/price-catalog` | GET | user | — | (non audité en détail) |
| `/api/dactylo/orders` | GET | user `client_type=dactylo` | — | OK (P1-07 scoping) |
| `/api/dactylo/upload-batch` | POST | user `client_type=dactylo` | magic byte, 20 Mo×10×50 | OK — modèle à reproduire pour P0-04 |
| `/api/cron/check-rdv-notifications` | GET | `Bearer CRON_SECRET` | — | **P1-01** timing-safe + **P1-06** logs |

### D. Secrets & variables d'env

| Var | Exposition | Risque |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client (bundle) | OK — URL publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client (bundle) | OK — clé anon, gated par RLS |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | client (bundle) | À restreindre côté GCP (referrer + APIs : Maps JS + Places only). **À vérifier hors repo**. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | client (bundle) | **P1-02** — leak structurel de l'email admin |
| `NEXT_PUBLIC_SITE_URL` | client (bundle) | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur uniquement | utilisée dans `src/lib/supabase/admin.ts` + `src/lib/supabase/middleware.ts:98` — OK |
| `ADMIN_EMAILS` | serveur uniquement | OK (P1-02 = absence du fallback) |
| `CRON_SECRET` | serveur uniquement | P1-01 timing-safe |
| `RESEND_API_KEY` | serveur uniquement | OK — voir P0-03 pour abuse |
| `ODOO_URL` / `ODOO_DB` / `ODOO_USER` / `ODOO_API_KEY` | serveur uniquement | OK |

Aucun secret hardcodé détecté (`grep "sk_\|sb_\|Bearer "` ne ressort que la comparaison légitime du CRON_SECRET). `.env*` correctement gitignoré (`.gitignore:25-26`). `.env.example` ne contient aucun secret.

**À vérifier hors repo** :
- Restrictions de la clé Google Maps dans GCP Console (project AutoState, partagé avec Copilio — **dette technique à isoler** : il faut un projet GCP dédié à Axis Experts pour éviter qu'un incident côté Copilio ne dégrade Axis).
- Configuration SPF/DKIM/DMARC du domaine `axis-experts.be` côté Resend (vérification que `noreply@axis-experts.be` est bien autorisé et que DMARC est `quarantine` ou `reject`).
- Présence de RLS sur `portal_submissions` et `rdv_notifications_sent` (cf. annexe A).

### E. Dépendances vulnérables (npm audit)

| Sévérité | Nb | Détail |
| --- | --- | --- |
| Critical | 0 | — |
| **High** | **8** | dont **CVE-2026-44575 (middleware bypass Next.js 16.0.0–16.2.4)**, CVE-2026-23869 (DoS RSC), CVE-2026-23870, CVE-2026-44573 (Pages Router i18n bypass — N/A ici car App Router uniquement) → **P0-01** |
| Moderate | 7 | postcss <8.5.10 XSS via `</style>` (CVE-2026-41305), brace-expansion (CVE-2026-45149), `ws` <8.20.1 (CVE-2026-45736), cache poisoning RSC (CVE-2026-44576) |
| Low | 2 | — |

Toutes les CVE high concernent `next@16.2.2` → résolues par `next@>=16.2.5`. `postcss` est tiré par next ; même upgrade requise. `ws` vient de `@supabase/realtime-js` (impact minimal car not exposed).

### F. TODO/FIXME inventaire

| Fichier | Ligne | Contenu |
| --- | --- | --- |
| `src/lib/useAddressAutocomplete.ts` | 11 | « TODO: migrer vers `google.maps.places.PlaceAutocompleteElement` (Autocomplete est legacy / déprécié). » |

Aucun autre `TODO/FIXME/HACK/XXX` dans `src/`. (`grep -rIn "TODO\|FIXME\|HACK\|XXX" src/` → 1 résultat unique.)

---

## Synthèse rapide pour décision

| Item | Effort total | Bloquant ? |
| --- | --- | --- |
| P0-01 Next.js upgrade | 0.5 h | ✅ |
| P0-02 Agency ownership check | 2 h | ✅ (selon volume agences) |
| P0-03 Resend abuse hardening | 4 h | ✅ |
| P0-04 Documents size cap | 4 h | ✅ |
| P1 total | ~17 h | recommandé avant lancement |
| P2 total | ~20 h | post-launch acceptable |

**Décision recommandée** : Repousser le lancement de 1 à 2 jours ouvrés pour corriger les 4 P0 (≈10h dev + tests). Les P1 peuvent être priorisés en semaine 1 post-launch sauf P1-03 (dactylo) et P1-06 (PII logs) qui méritent d'être bouclés avant ouverture publique.
