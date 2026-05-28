# AUDIT — Pivot dashboard : `client_id` → agence partenaire (module RDV agences)

> Audit en lecture seule. Aucune modification de code, de schéma ou de données n'a
> été effectuée. Toutes les affirmations sont sourcées (`fichier:ligne`).
> Date : 2026-05-28.

---

## 0. TL;DR (réponses tranchées)

1. **Il n'existe aucune colonne `client_id`.** Les « RDV » ne sont pas stockés dans
   Supabase : ce sont des `sale.order` Odoo. Le « filtre par client » du dashboard est
   en réalité un filtre Odoo `partner_id = odoo_partner_id`. La notion de `client_id`
   du brief est une *formulation conceptuelle*, pas une colonne réelle.

2. **Le pivot agence est DÉJÀ implémenté** (pas à concevoir, à consolider). Pour
   `client_type = 'agency'`, le code remplace déjà le filtre `partner_id` par
   `x_studio_agence_partenaire IN [liste des agents de la société]`, la liste étant
   résolue depuis `odoo_agency_id`. Voir `src/app/api/odoo/orders/route.ts:48-78`.

3. **Clé de pivot stable confirmée = `odoo_agency_id` (la SOCIÉTÉ).**
   `odoo_partner_id` d'un client agence = **l'agent (individu)** ;
   `odoo_agency_id` = **la société parente**. Preuves en §2.

4. **Nom technique du flag « Agent partenaire » = `x_studio_agent_partenaire`**
   (booléen porté par l'INDIVIDU/res.partner). Le champ de liaison sur la commande est
   `x_studio_agence_partenaire` (many2one → **l'agent**, malgré son nom). Preuves §1bis.

5. **Le rôle location vs gestion n'est porté par AUCUN champ lu par l'app aujourd'hui.**
   Les onglets « Assignation de partenaire », « Marché Immo », « Gestion Axis » ne sont
   référencés nulle part dans le repo. À trancher via inspection Odoo (requêtes §1bis).

---

## 1. Modèle de données actuel

### 1.1 Architecture générale

- **Les RDV vivent dans Odoo**, modèle `sale.order` (devis/commandes). Il n'y a pas de
  table `appointments` / `rendez_vous` dans Supabase. La « date de RDV » est le champ
  Odoo `x_studio_date_prochain_rendez_vous_1` (`src/app/api/odoo/orders/route.ts:97`).
- **Supabase ne stocke que** : le mapping utilisateur↔Odoo (`portal_clients`), le
  référentiel sociétés (`organizations`), des brouillons, des accusés de lecture
  messagerie, un suivi de soumissions et des notifications envoyées.
- L'accès aux données Odoo se fait **côté serveur** avec des identifiants de service
  (`src/lib/odoo.ts:3-6`, `ODOO_API_KEY`). Le filtrage par client/agence est donc fait
  **en code applicatif**, pas par RLS Postgres.

### 1.2 Table `portal_clients` (`supabase/migration.sql`)

Lie un utilisateur Supabase Auth à son partenaire Odoo.

| Colonne | Type | Notes / source |
|---|---|---|
| `id` | uuid PK | `migration.sql:3` |
| `user_id` | uuid NOT NULL → `auth.users(id)` ON DELETE CASCADE, `UNIQUE` | `:4`, `:15` |
| `odoo_partner_id` | INTEGER **NOT NULL** | `:5` — pour une agence = **l'agent** |
| `odoo_template_prefix` | TEXT NOT NULL | `:6` (`'CPASBXL'`, `'AXIS'`…) |
| `nom_societe`, `nom_bailleur`, `email_bailleur`, `telephone_bailleur` | TEXT | `:7-10` |
| `product_config` | JSONB | `:11` |
| `logo_url` | TEXT | `:12` |
| `created_at`, `updated_at` | TIMESTAMPTZ | `:13-14` |
| `odoo_contact_partner_id` | INTEGER (nullable) | `:61-62` — personne physique de contact (social) |
| `client_type` | TEXT DEFAULT `'social'` | `:73-74` — `'social' | 'agency' | 'dactylo'` |
| `odoo_agency_id` | INTEGER (nullable) | `:81-82` — **société agence parente** |
| `organization_id` | UUID → `organizations(id)` | `organizations.sql:39` |
| `first_name`, `last_name` | TEXT | migration `20260417102921_split_client_name.sql` (lu en `api/odoo/messages/route.ts:32`) |
| `blocked_at`, `blocked_by`, `deleted_at`, `deleted_by` | — | migration `20260416120000_user_soft_delete_and_blocking.sql` (lu en `api/admin/users/route.ts:27`) |

**Index** : `idx_portal_clients_user_id` (`migration.sql:32`),
`idx_portal_clients_organization_id` (`organizations.sql:42`).
**RLS** : l'utilisateur ne voit/édite que sa ligne (`auth.uid() = user_id`,
`migration.sql:21-29`).
**Trigger** : `portal_clients_updated_at` (`migration.sql:43`).

> Note : `client_type` et `odoo_agency_id` sont documentés directement dans le fichier
> (`migration.sql:64-82`) comme servant au module agences — filtrage par
> `x_studio_agence_partenaire IN agentIds` au lieu de `partner_id`.

### 1.3 Table `organizations` (`supabase/migrations/organizations.sql`)

Référentiel des sociétés clientes (1 société = 1..N `portal_clients`).

| Colonne | Type | Source |
|---|---|---|
| `id` | uuid PK | `organizations.sql:9` |
| `name` | TEXT NOT NULL | `:10` |
| `odoo_partner_id` | INTEGER **NOT NULL** | `:11` |
| `odoo_agency_id` | INTEGER (nullable) | `:12` |
| `odoo_template_prefix` | TEXT NOT NULL DEFAULT `'AXIS'` | `:13` |
| `client_type` | TEXT NOT NULL DEFAULT `'social'` CHECK ∈ (`social`,`agency`) | `:14` |
| `logo_url`, `product_config`, `contact_name/email/phone`, `is_active` | — | `:15-20` |
| `created_at`, `updated_at` | TIMESTAMPTZ | `:21-22` |
| `notifications_enabled` | BOOLEAN NOT NULL DEFAULT false | `20260521120000_…:56` |
| `notification_recipients_mode` | TEXT DEFAULT `'all_org_users'` CHECK ∈ (`creator_only`,`all_org_users`,`custom_list`) | `:59`, `:79-82` |
| `notification_custom_emails` | JSONB DEFAULT `'[]'` | `:62` |
| `notify_on_create`, `notify_on_update` | BOOLEAN DEFAULT true | `:65-68` |

> ⚠️ La contrainte CHECK de `organizations.client_type` ne liste que
> (`social`,`agency`) (`organizations.sql:14`), alors que le code applicatif accepte
> aussi `'dactylo'` (`api/admin/invite/route.ts:123`,
> `api/admin/organizations/[id]/route.ts:110`). Incohérence à noter (un INSERT
> `dactylo` dans `organizations` échouerait).

**Index** : `idx_organizations_odoo_partner_id` (`organizations.sql:43`).
**RLS** : SELECT si `id IN (SELECT organization_id FROM portal_clients WHERE user_id = auth.uid())` (`organizations.sql:29-31`).

### 1.4 Autres tables RDV-adjacentes (Supabase)

| Table | Rôle | Clé de rattachement | Source |
|---|---|---|---|
| `rdv_drafts` | brouillons de demande | `user_id` + `organization_id` | `rdv_drafts.sql`, `20260416080847_rdv_drafts_organization.sql` |
| `portal_message_reads` | accusés lecture chatter | `user_id` + `odoo_order_id` | `messaging.sql:5-11` |
| `portal_submissions` | suivi des RDV créés via portail | `odoo_order_id` + `user_id` + `organization_id` | inséré en `submit-rdv/route.ts:1188-1194` (pas de DDL versionné dans le repo) |
| `rdv_notifications_sent` | dédup notifications RDV | `odoo_order_id` (UNIQUE) | utilisé en `cron/check-rdv-notifications/route.ts:217-225` (pas de DDL versionné) |
| `product_catalog` | mapping code→`odoo_default_code` | global, RLS read-all | `20260521120000_…:33-49` |

> Les DDL de `portal_submissions` et `rdv_notifications_sent` ne sont **pas** dans le
> repo (créés directement en prod). Pour récupérer leur schéma exact :
> `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name IN ('portal_submissions','rdv_notifications_sent');`

### 1.5 Chaîne RDV → « client » (définition exacte)

- **Clients sociaux** : `sale.order.partner_id = portal_clients.odoo_partner_id`
  (`api/odoo/orders/route.ts:77`).
- **Agences** : `sale.order.x_studio_agence_partenaire IN [agents de la société]`
  (`api/odoo/orders/route.ts:75`).

Il n'existe **aucune** colonne `client_id`. Recherche exhaustive : `grep -rn "client_id"`
sur `src/` et `supabase/` ⇒ **0 occurrence**.

### 1.6 Où vivent `odoo_partner_id` / `odoo_agency_id`

| Colonne | Tables | Nullable | Indexé |
|---|---|---|---|
| `odoo_partner_id` | `portal_clients` (`migration.sql:5`), `organizations` (`organizations.sql:11`) | NOT NULL dans les deux | `organizations` : oui (`:43`) ; `portal_clients` : non |
| `odoo_agency_id` | `portal_clients` (`migration.sql:81-82`), `organizations` (`organizations.sql:12`) | nullable dans les deux | non indexé |

---

## 1bis. Champ « Agent partenaire » et onglets custom Odoo

### Flag booléen « Agent partenaire »

- **Nom technique : `x_studio_agent_partenaire`** (booléen sur `res.partner`).
- Toujours interrogé avec `["parent_id", "=", <odoo_agency_id>]` ⇒ il est porté par
  **l'INDIVIDU (l'agent)**, pas par la société. Occurrences :
  - `src/app/api/odoo/orders/route.ts:66`
  - `src/lib/odoo/ownership.ts:33`
  - `src/app/api/admin/organizations/[id]/stats/route.ts:52`
  - `src/app/api/admin/stats/missions-by-org/route.ts:53`
  - `src/app/api/admin/stats/portal-orders/route.ts:106`

**Conclusion** : flag bien porté par l'individu → cohérent avec la fiche réelle
(Portenart & Co / DOSIMONT Anaïs).

### Champ de liaison sur la commande

- **`x_studio_agence_partenaire`** : many2one sur `sale.order`. **Malgré son nom, il
  stocke l'AGENT (individu)**, pas la société :
  - Écriture : `submit-rdv/route.ts:601` → `x_studio_agence_partenaire: ensureInt(clientRow.odoo_partner_id)` (= l'agent).
  - Filtrage : `orders/route.ts:75` → `["x_studio_agence_partenaire", "in", agentIds]`.
  - Lecture/mapping : `portal-orders/route.ts:134-137` (`order.x_studio_agence_partenaire[0]` → agent → org), `cron/…:249-250`.
- Autres champs `sale.order` écrits pour une agence (`submit-rdv/route.ts:594-606`) :
  `x_studio_type_de_client = "Agent immobilier"`, `x_studio_partie_1_bailleurs_`
  (propriétaire), `x_studio_partie_2_locataires_` (locataire), `x_studio_portail_client = true`.

### Onglets « Assignation de partenaire » / « Marché Immo » / « Gestion Axis »

- **Aucune référence dans le repo.** `grep` sur ces libellés et sur d'autres champs
  `x_studio_*` liés au rôle (location/gestion) ⇒ rien. Le seul champ partenaire custom
  exploité est `x_studio_agent_partenaire` (+ la liaison `x_studio_agence_partenaire`
  côté commande).
- **Donc le code ne lit/écrit aucun champ portant le rôle location vs gestion.** Cette
  distinction n'est aujourd'hui matérialisée nulle part (ni Odoo via l'app, ni Supabase).

> Pour lever le doute (lecture seule, à lancer via un script utilisant `odooExecute`) :
> ```
> # Champs custom de res.partner
> fields_get(['res.partner']) → filtrer les clés commençant par x_studio_ / x_
> # Champs custom de sale.order
> fields_get(['sale.order']) → idem
> # Inspecter une fiche agent réelle
> read('res.partner', [<id DOSIMONT>], []) # tous les champs
> ```

---

## 2. Sémantique Odoo (le point clé)

### Mapping confirmé

| Colonne Supabase (agence) | Référence Odoo | Preuve code |
|---|---|---|
| `odoo_partner_id` | **l'AGENT** (res.partner individu) | injecté dans `agentIds` (`orders/route.ts:71-72`) ET écrit dans `x_studio_agence_partenaire` (`submit-rdv/route.ts:601`) |
| `odoo_agency_id` | **la SOCIÉTÉ** (res.partner is_company) | utilisé comme `parent_id` pour lister les agents (`orders/route.ts:65`, `ownership.ts:32`) |

### Remontée individu → société

- Le code n'utilise **ni** `commercial_partner_id` **ni** une montée runtime
  individu→société. Il fait l'inverse : il **descend** de la société vers ses agents via
  `["parent_id", "=", odoo_agency_id]` (`orders/route.ts:65`, `ownership.ts:32`,
  `stats/route.ts:51`, `missions-by-org/route.ts:52`, `portal-orders/route.ts:105`).
- Le lien agent→société est donc **figé à la configuration** dans
  `portal_clients.odoo_agency_id` / `organizations.odoo_agency_id` (saisi à
  l'invitation / via l'admin), pas recalculé.

### Agrégation au niveau société (le point critique)

Depuis un agent identifié, on rassemble TOUS les RDV de la société ainsi
(`orders/route.ts:61-75`) :

```
agents   = res.partner where parent_id = odoo_agency_id AND x_studio_agent_partenaire = true
agentIds = uniq([ odoo_partner_id (agent connecté), ...agents.id ])
domain   = [ ["x_studio_agence_partenaire", "in", agentIds] ]
```

### Conclusion : clé de pivot = `odoo_agency_id`

- **L'ID société (`odoo_agency_id`) est la clé de pivot stable.** Justification : le flag
  et la liaison sont au niveau individu, mais une société compte plusieurs agents
  (location **ou** gestion) ; pivoter sur l'individu (`odoo_partner_id`) ne verrait que
  les RDV de cet agent et manquerait ceux des collègues.
- Le pivot runtime se matérialise par l'**ensemble `agentIds` dérivé de `odoo_agency_id`**
  (la société elle-même n'est qu'un point d'ancrage pour `parent_id`).

### Risques/edge-cases relevés sur le mapping

1. **Nom trompeur** : `x_studio_agence_partenaire` stocke un **agent**, pas une société.
   Toute évolution doit garder cette convention (`submit-rdv/route.ts:601`).
2. **La société elle-même n'est pas dans `agentIds`** (`orders/route.ts:71-72` :
   seulement l'agent connecté + enfants). Un `sale.order` dont
   `x_studio_agence_partenaire` pointerait sur la **société** (et non un agent) serait
   **invisible** au dashboard. Les commandes créées par l'app écrivent toujours un agent,
   donc OK pour le flux app ; à vérifier pour les commandes saisies directement dans Odoo.
3. **Limite `limit: 100`** sur la résolution des agents (`orders/route.ts:68`,
   `ownership.ts:36`) : une société de >100 agents tronquerait la liste.
4. **Agent sans société** (`odoo_agency_id` NULL) ⇒ `orders/route.ts:54-59` renvoie
   « Agence non configurée » (400). À couvrir lors de l'onboarding.

---

## 3. Comment le dashboard filtre aujourd'hui

### Data-fetching

- Page dashboard (client component) : `src/app/dashboard/page.tsx`. Elle lit
  `portal_clients` (`client_type`, `organization_id`, `:216`) puis appelle
  `GET /api/odoo/orders` (`:234`).
- Route de données : **`src/app/api/odoo/orders/route.ts`**. C'est LE point central du
  filtre :
  - social/défaut : `baseDomain = [["partner_id", "=", partnerId]]` (`:77`)
  - agency : `baseDomain = [["x_studio_agence_partenaire", "in", agentIds]]` (`:75`)

### Inventaire exhaustif des couplages « 1 dashboard = 1 partner_id »

> Tous ces points gèrent **déjà** la bifurcation agence. À traiter comme la liste de
> surface à maintenir cohérente lors de l'extension du module agence.

| # | Fichier:ligne | Rôle | Statut agence |
|---|---|---|---|
| 1 | `src/app/api/odoo/orders/route.ts:48-78` | Listing dashboard | ✅ pivot agence |
| 2 | `src/lib/odoo/ownership.ts:23-87` | Contrôle de propriété d'une commande | ✅ pivot agence |
| 3 | `src/app/api/odoo/attachments/route.ts:36-39` + `.../download/route.ts:32` | Pièces jointes (via ownership) | ✅ lit `client_type/agency_id` |
| 4 | `src/app/api/odoo/messages/route.ts:32-61` | Messagerie chatter | ✅ lit `client_type/agency_id` |
| 5 | `src/app/api/admin/organizations/[id]/stats/route.ts:44-63` | Stats admin par org | ✅ pivot agence |
| 6 | `src/app/api/admin/stats/missions-by-org/route.ts:46-63` | Stats admin globales | ✅ pivot agence |
| 7 | `src/app/api/admin/stats/portal-orders/route.ts:83-137` | Mapping commandes→org | ✅ pivot agence |
| 8 | `src/app/api/cron/check-rdv-notifications/route.ts:248-296` | Notifs RDV (order→org) | ✅ `partner_id` OU `agency_id` |
| 9 | `src/app/api/submit-rdv/route.ts:592-606` | Création RDV | ✅ écrit `x_studio_agence_partenaire` |
| 10 | `src/app/api/messages/unread-check/route.ts:21` | Badge non-lus | ⚠️ ne sélectionne que `odoo_partner_id` — **à vérifier** pour les agences |
| 11 | `src/app/api/odoo/tags/route.ts:20` | Tags | ⚠️ sélectionne `odoo_partner_id` seul (vérifier si c'est un filtre de propriété ou global) |
| 12 | `src/app/api/rdv-custom-values/route.ts` | Valeurs custom par commande | à vérifier (clé = order_ref, pas partner) |

**Point d'attention principal (#10, #11)** : ces deux routes ne lisent que
`odoo_partner_id` sans la branche agence. Si elles servent à déterminer la propriété de
commandes pour une agence, elles sont **incomplètes** (ne verraient que l'agent connecté,
pas la société). À auditer fonctionnellement.

### RLS et pivot

- **Les RLS Supabase ne portent pas la sécurité des RDV** (qui sont dans Odoo, filtrés en
  code serveur). Les policies reposent sur :
  - `portal_clients` : `auth.uid() = user_id` (`migration.sql:24,28`)
  - `organizations` : appartenance via `organization_id` (`organizations.sql:31`)
  - `rdv_drafts` : appartenance via `organization_id` (`20260416080847_…:38-76`)
  - `portal_message_reads` : `auth.uid() = user_id` (`messaging.sql:15`)
- **Aucune RLS ne repose sur `odoo_partner_id`/`odoo_agency_id`** ⇒ le pivot agence
  n'impose **aucune** modification de RLS. C'est un avantage : la bascule est purement
  applicative (côté requêtes Odoo).

---

## 4. Rattachement des anciens RDV à l'agence

### Ce que portent les RDV historiques

- Le rattachement à une agence se fait **exclusivement** via le champ Odoo
  `sale.order.x_studio_agence_partenaire` (= un agent). Il n'y a **pas** de
  `odoo_agency_id` sur la commande elle-même.
- Côté Supabase, `odoo_agency_id` n'est porté que par `portal_clients`/`organizations`
  (la config), jamais par une « ligne RDV » (qui n'existe pas en base).

### Stratégie de rattachement rétroactif (proposée — AUCUN SQL d'écriture)

Le rattachement se joue **dans Odoo**, pas dans Supabase :

1. Pour chaque société agence (`organizations.odoo_agency_id`), résoudre ses agents
   (`parent_id = odoo_agency_id AND x_studio_agent_partenaire = true`).
2. Lister les `sale.order` historiques susceptibles d'appartenir à l'agence — p.ex. par
   `partner_id` du bailleur connu, par adresse, ou par un champ métier — puis **écrire**
   `x_studio_agence_partenaire = <agent>`. (Écriture Odoo, hors périmètre de cet audit.)
3. Une fois ce champ posé, les anciens RDV remontent automatiquement dans le dashboard
   agence (même domaine `IN agentIds`).

**Requêtes de cadrage en lecture (pour quantifier l'effort) :**
```
# RDV agence déjà rattachés
search_count('sale.order', [["x_studio_agence_partenaire","in",agentIds]])
# RDV "agence" sans rattachement (à backfiller) — selon critère métier de propriété
search_count('sale.order', [["x_studio_type_de_client","=","Agent immobilier"],
                            ["x_studio_agence_partenaire","=",false]])
```

### Cas ambigus à arbitrer

- **RDV sans `x_studio_agence_partenaire`** : aucun lien automatique → backfill manuel ou
  par règle métier.
- **Location vs gestion** : non distinguable (aucun champ exploité, §1bis) → ne peut pas
  guider le rattachement tant que le champ n'est pas identifié.
- **Agence pas encore créée comme `organization`** : pas de `odoo_agency_id` côté
  Supabase → créer la fiche d'abord.
- **Agent sans société parente** (`parent_id` vide) : non résolu par `IN agentIds`.
- **`x_studio_agence_partenaire` pointant sur la société** (et non un agent) : invisible
  (cf. §2 risque 2).

---

## 5. Création de RDV côté agence (module à venir)

### Flux existant (logements sociaux)

- Route : `src/app/api/submit-rdv/route.ts`. Crée un `sale.order` avec
  `partner_id = portal_clients.odoo_partner_id` (`:592` branche non-agence),
  `x_studio_partie_1_bailleurs_ = clientRow.odoo_partner_id` (le bailleur EST le client),
  `x_studio_type_de_client = "Bailleur"` (`:599`).
- Suivi : insertion dans `portal_submissions` avec `organization_id` (`:1186-1194`).

### Flux agence (déjà codé, `submit-rdv/route.ts:239-606`)

Ce qu'un RDV agence DOIT écrire pour être visible au dashboard agence **et** cohérent
avec la v1 :

| Champ `sale.order` | Valeur | Pourquoi |
|---|---|---|
| `partner_id` | **le propriétaire réel** (bailleur résolu/créé) — pas l'agent | `:592,595` |
| `x_studio_agence_partenaire` | **`clientRow.odoo_partner_id` (l'agent connecté)** | `:601` — **condition de visibilité** dashboard agence |
| `x_studio_type_de_client` | `"Agent immobilier"` | `:599` |
| `x_studio_partie_1_bailleurs_` | propriétaire | `:603` |
| `x_studio_partie_2_locataires_` | locataire | `:604` |
| `x_studio_portail_client` | `true` | `:605` (filtre du cron notifications) |
| produit/options | issus de la simulation `agencyPriceSelection` | `:239-339` |

**Invariant de visibilité** : `x_studio_agence_partenaire` doit être un agent dont
`parent_id = organizations.odoo_agency_id` de l'agence (ou l'agent connecté lui-même),
sinon le RDV n'apparaîtra pas (domaine `IN agentIds`, §2).

**Cohérence v1** : la branche sociale reste intacte (`partner_id = odoo_partner_id`,
`type_de_client = "Bailleur"`). Aucune régression — la bifurcation est gardée par
`clientRow.client_type === "agency"`.

---

## 6. Points laissés ouverts (à trancher)

### 6.1 Niveau du rôle location vs gestion

- **Constat** : aucun champ exploité par l'app ne porte cette distinction (§1bis).
- **Options** :
  - (a) champ Odoo sur la **société** (un seul rôle par agence) — le plus simple ;
  - (b) champ sur l'**agent** (un agent peut être dédié location ou gestion) ;
  - (c) **par RDV** (champ sur `sale.order`) — le plus granulaire.
- **À faire** : inspecter les onglets « Marché Immo » / « Gestion Axis » via `fields_get`
  (requêtes §1bis) pour voir si un champ existe déjà, avant de décider d'en créer un.

### 6.2 Granularité du dashboard agence

- **Aujourd'hui** : société entière, tous agents confondus (`agentIds` = agent connecté +
  tous les enfants de `odoo_agency_id`, `orders/route.ts:71-75`).
- **Option « par agent »** : filtrer sur `x_studio_agence_partenaire = odoo_partner_id`
  (un seul agent). Impact :
  - **Schéma** : aucun changement nécessaire (l'info est déjà dans `odoo_partner_id`).
  - **RLS** : aucun impact (filtrage applicatif).
  - **Code** : ajouter un paramètre de scope (société vs agent) dans
    `orders/route.ts` et les routes stats/ownership.
- **Recommandation** : conserver le pivot **société** (`odoo_agency_id`) par défaut, et
  ajouter éventuellement un filtre **optionnel** par agent côté UI, sans changer la clé de
  pivot ni le schéma.

---

## 7. Synthèse des recommandations

1. **Clé de pivot dashboard agence = `odoo_agency_id`** (société). Déjà en place.
2. **Ne pas introduire de `client_id`** : la notion réelle est `partner_id` (Odoo) /
   `odoo_partner_id` / `odoo_agency_id` (Supabase config).
3. **Consolider les points #10/#11** (`messages/unread-check`, `odoo/tags`) qui ne gèrent
   pas la branche agence — à confirmer fonctionnellement.
4. **Identifier le champ location/gestion dans Odoo** (`fields_get`) avant toute décision
   de schéma ; aujourd'hui non porté.
5. **Backfill rétroactif = écrire `x_studio_agence_partenaire` dans Odoo** sur les anciens
   `sale.order`, pas de migration Supabase.
6. **Aligner la contrainte CHECK** `organizations.client_type` avec les valeurs réellement
   acceptées (`social`/`agency`/`dactylo`) — incohérence repérée (`organizations.sql:14`).
7. **Surveiller la limite `limit:100`** sur la résolution des agents pour les grosses
   agences.

---

*Fin de l'audit. Aucune écriture de code applicatif, de schéma ou de données n'a été
réalisée.*
