# AUDIT AGENCE — axis-experts-rdv
## Expérience « organisation agence » — audit pur (lecture seule)

**Date :** 2026-06-30
**Périmètre :** constat de l'état actuel du flux « agence immobilière ». Aucune
modification de code. Chaque constat est prouvé par `fichier:ligne`. Les points
non prouvables par le code seul sont marqués `⚠️ NON VÉRIFIÉ` (nécessitent un
runtime Odoo/Supabase live).

---

## 1. Résumé exécutif

- **Mécanisme de bascule agence = `client_type === "agency"`.** C'est une colonne
  texte présente **en double** : sur `organizations.client_type`
  (`supabase/migrations/organizations.sql:14`) **et** sur
  `portal_clients.client_type` (`supabase/migration.sql:73-74`). Le **front lit
  toujours `portal_clients.client_type`** (dashboard, demande), le **back lit
  `portal_clients` ou `organizations` selon la route**. **Il n'existe AUCUN point
  central de bascule** : la condition `clientType === "agency"` est **dupliquée**
  dans ~6 fichiers et ~15+ emplacements. C'est le principal point d'attention.
- **Flags annexes agence :** `require_tenant_name` (locataire obligatoire/optionnel,
  règle centralisée dans `src/lib/tenant-name.ts`), `odoo_agency_id`, et la
  résolution live de l'agence depuis Odoo via l'email (`src/lib/odoo/resolve-agency.ts`).
- **Bloc D (Accès refusé) — verdict :** le message provient d'un **403 API** émis
  par le **même garde `isAdmin(user.email)`** (allowlist d'emails) que celui qui
  protège l'onglet « Général ». **Ce n'est ni du RLS** (les routes utilisent le
  client service-role qui bypass le RLS) **ni spécifique aux agences** (aucune
  route ne teste `client_type`). Les DEUX features sont **déjà entièrement
  implémentées** derrière le refus. La cause exacte du caractère *sélectif*
  (seulement 2 onglets) est `⚠️ NON VÉRIFIÉ` — voir §3.
- **Verdict global :** la quasi-totalité des items A/B sont des **masquages
  conditionnels simples** à brancher sur `clientType === "agency"`. Les items C
  sont **partiellement implémentés** (préférences notifications existantes mais
  admin-only, et 2 events sur 3). Le point sensible réel est **B7** (le montant
  d'honoraires transite côté serveur même si on masque l'affichage).

---

## 2. Mécanisme de différenciation agence (question transversale — PRIORITÉ 1)

### 2.1 Le critère : `client_type`

| Emplacement | Preuve |
|---|---|
| Colonne `organizations.client_type` (`'social' \| 'agency'`, défaut `'social'`) | `supabase/migrations/organizations.sql:14` |
| Élargie à `('social','agency','dactylo')` | `supabase/migrations/20260421120000_add_dactylo_client_type.sql:66-67` |
| Colonne **dupliquée** `portal_clients.client_type` (défaut `'social'`) | `supabase/migration.sql:73-74` |
| Type Odoo dérivé à la création de commande | `src/app/api/submit-rdv/route.ts:670` (`"Agent immobilier"` vs `"Bailleur"`) |

> **Constat clé : il n'y a pas de helper unique `isAgency()`.** La distinction est
> faite par comparaison littérale `client_type === "agency"` répétée partout. Un
> futur chantier devra se greffer sur chacun de ces points (liste ci-dessous).

### 2.2 Où la bascule est lue (carte de duplication)

**Front (lecture de `portal_clients.client_type`) :**
- `src/app/dashboard/page.tsx:219` (select) → `:226` (`setClientType`) → utilisé `:594`
- `src/app/demande/page.tsx:179` (select) → `:186` (`setClientType`) → utilisé `:498, 512, 617, 923, 1124, 1128, 1880`

**Back / API (lecture selon la route) :**
- `src/app/api/submit-rdv/route.ts:268, 433, 638, 646, 670, 671, 915`
- `src/app/api/odoo/orders/route.ts:28, 44, 50` (listing filtré par agence)
- `src/app/api/odoo/messages/route.ts:32, 59`
- `src/app/api/odoo/attachments/download/route.ts:32`
- `src/app/api/agency/extract-bail/route.ts:44-47`
- `src/lib/odoo/ownership.ts:42` (vérification d'appartenance d'une commande)

**Admin (lecture de `organizations.client_type`) :**
- `src/app/admin/organizations/page.tsx:339-344`, `[id]/page.tsx:459-464, 658-677`, `users/page.tsx:260-265`

### 2.3 Résolution « live » de l'agence depuis Odoo

Pour les clients `agency`, l'agence n'est **pas** prise depuis `odoo_partner_id`
mais **résolue en direct depuis Odoo via l'email de l'agent connecté** :
- `src/lib/odoo/resolve-agency.ts:90-124` — recherche `res.partner` où
  `email =ilike <user.email>` ET `x_studio_agent_partenaire = true`, puis remonte
  au `parent_id` (la société agence).
- Le lien sur la commande passe par **`x_studio_agence_partenaire`** (et un champ
  tampon caché `x_studio_many2one_field_4ea_1jrimutbv`), **PAS par `parent_id`** :
  `src/lib/odoo/ownership.ts:49-60`, `src/app/api/submit-rdv/route.ts:646-676`.

### 2.4 Flags produit/agence observés dans l'admin

| Élément admin | Champ DB | Preuve |
|---|---|---|
| Tag « Agence » / « Social » | `client_type` | `src/app/admin/organizations/[id]/page.tsx:459-464` |
| Tag « Actif » / « Suspendu » | `is_active` | `:466-474` ; migration `organizations.sql:20` |
| Tag « Locataire obligatoire/optionnel » + bouton bascule | `require_tenant_name` | `:475-485` (tag), `:507-518` (bouton), `:252-279` (handler PATCH) |
| `Odoo Partner ID` | `odoo_partner_id` | `:598-613` ; migration `organizations.sql:11` |
| `Odoo Agency ID` | `odoo_agency_id` | `:614-632` ; migration `organizations.sql:12` |
| `Prefix template` (ex. AXIS) | `odoo_template_prefix` | `:633-648` ; migration `organizations.sql:13` |

> **Note `Odoo Partner ID` = `Odoo Agency ID` (ex. 62205) :** observée dans l'admin,
> ces deux valeurs sont **saisies manuellement** par l'admin (formulaire ci-dessus).
> `odoo_agency_id` n'est **jamais écrit programmatiquement** ailleurs (cf. §5, C2).

### 2.5 Le flag `require_tenant_name`

- **Règle unique de lecture** : `src/lib/tenant-name.ts:10-14` →
  `isTenantNameRequired(value) = value !== false` (NULL/true ⇒ **obligatoire**,
  `false` ⇒ optionnel). C'est le **seul** point centralisé de tout l'audit.
- Présent sur `organizations` **et** `portal_clients` avec write-through admin :
  `src/app/api/admin/organizations/[id]/route.ts:160-161, 186-194`.
- Lu côté front : `src/app/demande/page.tsx:187`, `dashboard/page.tsx:228` ;
  côté back : `src/app/api/submit-rdv/route.ts:242`.
- **`⚠️ NON VÉRIFIÉ` :** aucune **migration versionnée** n'ajoute la colonne
  `require_tenant_name` (grep `require_tenant` sur `supabase/` = 0 résultat). La
  colonne existe en prod mais hors-repo (même cas que les colonnes notifications
  avant la régularisation TD-NEW-64).

**FAISABILITÉ (centraliser la bascule) : moyen.** Introduire un helper `isAgency()`
+ un hook unique côté front réduirait la duplication, mais ce n'est pas requis pour
les masquages A/B (qui peuvent réutiliser `clientType` déjà chargé localement).
**DÉCISION PRODUIT REQUISE : oui** — accepter de continuer avec la condition
dupliquée, ou demander une centralisation préalable.

---

## 3. BLOC D — Bug admin « Accès refusé » (conditionne le Bloc C)

### 3.1 Chaîne complète

**D1 — Onglet Notifications**
- Composant : `src/app/admin/organizations/[id]/NotificationsTab.tsx` — fetch
  `GET /api/admin/organizations/{id}/notifications` (`:238-241`), affichage de
  l'erreur `:461-467`.
- Route : `src/app/api/admin/organizations/[id]/notifications/route.ts` — garde
  `requireAdmin()` `:19-37`, refus **`"Accès refusé"` (403)** `:30-32`.

**D2 — Onglet Champs personnalisés**
- Composant : `src/app/admin/organizations/[id]/CustomFieldsTab.tsx` — fetch
  `GET /api/admin/organizations/{id}/custom-fields` (`:54-57`), affichage erreur `:153-159`.
- Route : `src/app/api/admin/organizations/[id]/custom-fields/route.ts` — refus
  **`"Acces refuse"` (403)** `:28-29` (GET) et `:95-96` (PATCH). *(NB : libellé sans
  accents, divergent de D1.)*

**Onglet Général (référence qui « fonctionne ») :**
- Route `src/app/api/admin/organizations/[id]/route.ts:21-22` → **même garde
  `isAdmin(user.email)`**, même refus `"Acces refuse"` (403).

### 3.2 Nature du contrôle : API, pas RLS, pas agence

- **Critère unique : allowlist d'emails.** `src/lib/admin.ts:18-21` —
  `isAdmin(email) = getAdminEmails().includes(email.toLowerCase())`. Liste =
  `process.env.ADMIN_EMAILS` (CSV) **sinon fallback codé en dur**
  `"n.rommiee@axis-experts.be"` (`src/lib/admin.ts:3, 7-16`).
- **Ce n'est PAS du RLS** : après le garde, les routes utilisent
  `createAdminClient()` (service-role) qui **bypass le RLS**
  (`notifications/route.ts:48`, `custom-fields/route.ts:32`).
- **Ce n'est PAS spécifique aux agences** : aucune des 3 routes ne lit
  `client_type`. Le refus est donc, par construction, **identique pour toute org**.
- **Aucun garde côté page/layout** : `src/app/admin/layout.tsx` ne fait **aucune
  redirection** (il lit juste l'email `:30`), et le middleware **n'interdit pas**
  l'accès `/admin/*` aux non-admins — la branche non-admin **exclut** `/admin`
  (`src/lib/supabase/middleware.ts:139`). Donc tout utilisateur authentifié atteint
  la page ; **chaque onglet appelle ensuite indépendamment sa route admin**.

### 3.3 Le paradoxe et la cause exacte

> Les 3 routes (Général, Notifications, Champs perso) partagent **le même garde
> `isAdmin`**. Logiquement : si « Général » se charge, `isAdmin` passe, et les deux
> autres **devraient** passer aussi. Le fait que **seuls 2 onglets** échouent n'est
> donc **pas explicable par `isAdmin` seul** et exige une vérification runtime.

**Deux hypothèses, mutuellement exclusives — `⚠️ NON VÉRIFIÉ` :**

1. **Le refus est bien un 403 `isAdmin`** → alors « Général » échoue **aussi** et
   l'observation « seuls 2 onglets » est imprécise. Cause probable : l'email
   connecté n'est pas dans l'allowlist. **Indice concret** : le contexte de session
   indique `n.rommiee@gmail.com`, alors que le fallback admin est
   `n.rommiee@axis-experts.be` (`src/lib/admin.ts:3`). Si `ADMIN_EMAILS` n'est pas
   défini (ou n'inclut pas l'adresse gmail) dans l'environnement testé, **toutes**
   les routes admin renvoient 403.
2. **« Général » fonctionne réellement** (donc `isAdmin` passe) → alors les 2 onglets
   n'échouent **pas** sur `isAdmin` mais sur leurs **requêtes data**, et le texte
   affiché serait une **erreur DB** (≈ « access denied » paraphrasé), pas le littéral
   « Accès refusé ». Causes candidates : tables `custom_fields` /
   `organization_custom_fields` absentes en prod (→ `custom-fields/route.ts:42` renvoie
   `fieldsErr.message` 500) ou colonnes notifications absentes. *Atténuation :* la
   route notifications a un fallback `notify_on_*` (`notifications/route.ts:60-71`) et
   renverrait plutôt « Organisation introuvable » (404) que « Accès refusé ».

**Checks runtime décisifs :** (a) onglet réseau du navigateur → statut HTTP + corps
JSON exact de chaque onglet, y compris Général ; (b) valeur de `ADMIN_EMAILS` en prod
vs email connecté ; (c) existence en base des tables `custom_fields`,
`organization_custom_fields` et des 5 colonnes notifications ; (d) confirmer que le
bug n'apparaît PAS sur une org `social` (sinon : non-spécifique aux agences, confirmé
par le code).

### 3.4 Les features sont-elles déjà implémentées derrière le refus ? OUI

- **Notifications (D1) — UI + schéma complets.** `NotificationsTab.tsx` contient :
  activation (`:483-497`), `notify_on_create` (`:503-517`), `notify_on_update`
  (`:519-534`), choix des destinataires `creator_only/all_org_users/custom_list`
  (`:540-619`), email de test (`:622-643`). Colonnes DB :
  `supabase/migrations/20260521120000_regularize_notifications_and_product_catalog.sql:55-68`.
  **Manque** la 3ᵉ préférence « réception du rapport » (cf. C4).
- **Champs personnalisés (D2) — UI + schéma complets.** Table + activation par org
  dans `supabase/migrations/0010_custom_fields.sql` ; UI complète
  (`CustomFieldsTab.tsx:163-411`).

> **Conséquence produit :** le vrai sujet de D est **débloquer l'accès** (corriger le
> garde / l'allowlist / le schéma), **pas créer** ces features.

**ÉTAT ACTUEL :** features prêtes, refus à l'entrée. · **OÙ BRANCHER :**
`src/lib/admin.ts:18-21` + `ADMIN_EMAILS` (cause #1) **ou** vérifier le schéma DB
(cause #2). · **FAISABILITÉ :** simple (si allowlist) / moyen (si schéma manquant).
· **DÉCISION PRODUIT REQUISE :** oui — définir qui est admin (modèle d'allowlist vs
rôle DB) et si les agences doivent éditer ces préférences elles-mêmes (cf. C4).

---

## 4. BLOC A — Portail / liste des demandes (vue agence)

Fichier principal : `src/app/dashboard/page.tsx`. Un précédent existant à réutiliser :
`clientType === "agency"` est **déjà** utilisé `:594` (bouton « Simuler les honoraires »).

### A1 — Colonne « Messages » (à masquer)
- **ÉTAT ACTUEL :** rendue sans condition. En-tête `dashboard/page.tsx:735` ; cellule
  (bouton ouvrant le `MessageDrawer`) `:800-826`. Aucune condition de type d'org.
- **OÙ BRANCHER :** entourer `:735` et `:800-826` de `clientType !== "agency"`.
- **FAISABILITÉ :** simple. · **DÉCISION PRODUIT :** non.

### A2 — Filtre « Non lus » (à retirer du défaut agence)
- **ÉTAT ACTUEL :** jeu de filtres défini `dashboard/page.tsx:122-128` (inclut
  `non_lus`) ; logique `:478-479` ; rendu `:611-623`. Aucune condition de type d'org.
- **OÙ BRANCHER :** filtrer le tableau d'options pour exclure `non_lus` si
  `clientType === "agency"` (`:122-128` ou dans le `.map` `:611`).
- **FAISABILITÉ :** simple. · **DÉCISION PRODUIT :** non.

### A3 — Colonnes parties : ajouter « Propriétaire » (en plus de « Locataire »)
- **ÉTAT ACTUEL :** seule la colonne « Locataire » existe. En-tête
  `dashboard/page.tsx:731` ; cellule `:767-769` ; donnée alimentée par
  `src/app/api/odoo/orders/route.ts:175-176` depuis `x_studio_partie_2_locataires_`.
- **Donnée propriétaire :** **NON sélectionnée** dans le listing aujourd'hui
  (`orders/route.ts:87-92` ne liste pas le champ propriétaire), **MAIS le champ Odoo
  existe** : `x_studio_partie_1_bailleurs_` (confirmé par
  `src/app/api/public/rdv/validation-cron/route.ts:47, 127-128`). Il faudrait
  l'ajouter au `fields` du `search_read` puis l'exposer en colonne.
- **OÙ BRANCHER :** `orders/route.ts:91` (ajout du champ au select) + extraction type
  `:175-176` ; colonne conditionnelle `dashboard/page.tsx:731` et `:767-769`.
- **FAISABILITÉ :** moyen (back + front). · **DÉCISION PRODUIT :** oui (libellé exact
  « Propriétaire » vs « Bailleur », ordre des colonnes).

### A4 — Boutons d'en-tête « Demande rapide » + « Mes brouillons » (à masquer)
- **ÉTAT ACTUEL :** carte d'actions `dashboard/page.tsx:565-604`. « Mes brouillons »
  `:576-580`, « Demande rapide » `:581-587`, « Créer une demande » `:588-593` (à
  garder), « Simuler les honoraires » `:594-602` (déjà conditionné agence).
- **OÙ BRANCHER :** entourer `:576-580` et `:581-587` de `clientType !== "agency"`.
- **FAISABILITÉ :** simple. · **DÉCISION PRODUIT :** non (sauf cohérence « Simuler les
  honoraires » à trancher avec B7).

---

## 5. BLOC B — Formulaire de création (vue agence, 5 étapes)

Fichier : `src/app/demande/page.tsx`. Plusieurs conditions agence existent déjà
(`:923, 1124, 1128, 1880`).

### B1 — Étape « Type de mission » (constat UX uniquement)
- **ÉTAT ACTUEL :** liste rendue `demande/page.tsx:963-978` (map de `mainProducts` en
  `ProductChip`). Produits chargés via `GET /api/odoo/products` (`:304-314`) — donc
  **catalogue Odoo**, pas config org. Filtrage par motif de code mission + exclusions
  `HIDDEN_OPTIONS` (`:77`) + tri (`:350-385`). Affichage en flex-wrap, **non groupé**.
- **Nombre d'items :** `⚠️ NON VÉRIFIÉ` (dépend du catalogue Odoo runtime).
- **Leviers possibles (sans redesign) :** regroupement par catégorie, recherche,
  accordéons. · **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT :** oui (UX cible).

### B2 — « Importer le bail (PDF) » (à masquer dans un 1er temps)
- **ÉTAT ACTUEL :** `<BailImport>` rendu **uniquement si agence** déjà
  (`demande/page.tsx:1124-1126`). Composant `src/components/BailImport.tsx:23-143`,
  route IA `src/app/api/agency/extract-bail/route.ts`.
- **Effets de bord d'un masquage :** **aucun bloquant** — le seul handler partagé est
  `handleBailExtracted` (`demande/page.tsx:418-443`), non-bloquant, le formulaire reste
  remplissable à la main.
- **OÙ BRANCHER :** `demande/page.tsx:1124`. · **FAISABILITÉ :** simple. · **DÉCISION
  PRODUIT :** non.

### B3 — Bloc « Propriétaire du bien »
- **ÉTAT ACTUEL :** bloc éditable agence `demande/page.tsx:1128-1185`. Champs :
  `bailleurSociete` (optionnel), `bailleurPrenom` *(requis)*, `bailleurNom` *(requis)*,
  `bailleurEmail` (optionnel, validé si rempli), `bailleurTelephone` (optionnel),
  `referenceAgence` (optionnel), case `notifyBailleur` (`:1176-1179`, défaut activé).
- **Validation :** client `demande/page.tsx:510-515` (prénom+nom requis, email validé si
  présent) ; serveur `src/app/api/submit-rdv/route.ts:75, 77-78`.
- **FAISABILITÉ :** n/a (constat). · **DÉCISION PRODUIT :** non.

### B4 — Bloc « Locataire » (cible : société possible + min prénom/nom/email)
- **ÉTAT ACTUEL :** bloc `demande/page.tsx:1281-1314`. Champs : `locatairePrenom`,
  `locataireNom`, `locataireEmail`, `locataireTelephone`. **Pas de champ « Société »
  côté locataire** (uniquement côté propriétaire : `bailleurSociete`).
- **Validation pilotée par `require_tenant_name`** : client `demande/page.tsx:516-517`
  (nom+prénom requis seulement si `requireTenant`), serveur
  `src/app/api/submit-rdv/route.ts:241-259` ; si vide, **aucun `res.partner` locataire
  créé** (`:556`) et champ Odoo omis (`:679-681`). Règle centrale :
  `src/lib/tenant-name.ts:10-14`.
- **Écart à la cible :** ajouter `locataireSociete` (parallèle à `bailleurSociete`) ;
  garder min = prénom+nom+email. Le flag `require_tenant_name=false` permet déjà
  d'assouplir le nom.
- **OÙ BRANCHER :** champ ~`demande/page.tsx:1288` + schéma submit-rdv (création partner
  locataire `:504-557`). · **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT :** oui
  (société locataire mappée vers quel champ Odoo ? email obligatoire ou non ?).

### B5 — « Numéro de bon de commande (PO) » (à masquer pour agences)
- **ÉTAT ACTUEL :** rendu pour tous, optionnel, `demande/page.tsx:1593-1604` ; injecté
  en note Odoo serveur `src/app/api/submit-rdv/route.ts:792-799` (`"NC"` si absent).
- **OÙ BRANCHER :** entourer `:1593` de `clientType !== "agency"` (et éventuellement ne
  pas pousser la note PO si agence, `submit-rdv:792`). · **FAISABILITÉ :** simple. ·
  **DÉCISION PRODUIT :** non.

### B6 — « Notes libres » + « N° compteurs eau/gaz/élec » (doivent rester optionnels)
- **ÉTAT ACTUEL :** **déjà optionnels.** Notes `demande/page.tsx:1606-1616` ; compteurs
  `:1619-1655`. Aucune validation `canNext`. Envoyés en messages Odoo non-bloquants
  `src/app/api/submit-rdv/route.ts:969-1011`.
- **FAISABILITÉ :** n/a (rien à faire). · **DÉCISION PRODUIT :** non.

### B7 — Récapitulatif → bloc « Tarification » (à masquer pour agences) — POINT SENSIBLE
- **ÉTAT ACTUEL :** bloc rendu si `selectedProduct` (pour tous), calcul **client-side**
  (sous-total + TVA 21% + total) `demande/page.tsx:1825-1845`. Pour agences, un
  `agencyPriceSelection` est calculé dans `PriceCalculatorModal`
  (`src/components/PriceCalculatorModal.tsx:163-180`) et **envoyé dans le payload**.
- **⚠️ Le montant transite côté serveur même si on masque l'affichage :** les
  `listPrice`/sélection prix sont envoyés au `submit-rdv`, qui crée des
  `sale.order.line` avec `price_unit` (`src/app/api/submit-rdv/route.ts:735-789`) puis
  relit `amount_untaxed/amount_tax/amount_total` depuis Odoo pour l'email interne
  (`:1182-1200`). De plus, le **listing** expose déjà `amount_total`
  (`src/app/api/odoo/orders/route.ts:89`). **Masquer le bloc UI ne suffit donc pas** si
  l'objectif est que l'agence ne voie aucun honoraire.
- **OÙ BRANCHER :** affichage `demande/page.tsx:1825` (condition `clientType !== "agency"`)
  **+** décision sur le payload/listing (`orders/route.ts:89`, `submit-rdv` lignes prix).
- **FAISABILITÉ :** moyen (UI simple ; « ne pas exposer le montant » = complexe). ·
  **DÉCISION PRODUIT :** oui — masquer l'affichage seul, ou aussi retirer le montant des
  réponses API ? Cohérence avec « Simuler les honoraires » (A4) à trancher.

---

## 6. BLOC C — Notifications, emails & préférences agence

### C1 — Email de confirmation à la soumission (cible : seule l'agence)
- **ÉTAT ACTUEL :** à la soumission, l'email de confirmation part vers le
  **propriétaire (bailleur)**, pas l'agence : `src/app/api/submit-rdv/route.ts:1115-1176`
  (destinataires construits depuis `bailleurEmail` si `notifyBailleur !== false`,
  `:1147-1149`). Un email **interne** part vers Axis `:1179-1299`. **L'agence n'est pas
  destinataire** à ce stade ; le message bailleur ne mentionne pas le contact
  locataire+propriétaire par Axis (`:1140`).
- **OÙ BRANCHER :** `submit-rdv:1149` (ajouter un envoi dédié agence ; email agence
  résolu via `resolveAgentAgency`/Odoo). Infra prête : `src/lib/email.ts`,
  `src/lib/email-templates/`.
- **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT :** oui (texte cible « Axis contactera
  locataire ET propriétaire » ; agence = unique destinataire ?).

### C2 — Notification date/heure du RDV à l'agence (cible : choix)
- **ÉTAT ACTUEL :** l'email RDV existe via cron
  `src/app/api/cron/check-rdv-notifications/route.ts` ; template
  `src/lib/email-templates/rdv-notification.ts` ; destinataires résolus par
  `src/lib/notification-recipients.ts:49-92` selon `notification_recipients_mode`.
- **Mais l'agence n'est destinataire que si `organizations.odoo_agency_id` est
  renseigné** (le cron matche l'org par `odoo_partner_id` OU `odoo_agency_id`). Or
  **`odoo_agency_id` n'est jamais écrit programmatiquement** (grep : 0 écriture ; seul
  l'admin peut le saisir manuellement via `[id]/page.tsx:614-632`). Sinon, seul le
  propriétaire/portail est notifié.
- **OÙ BRANCHER :** renseigner `odoo_agency_id` (admin ou à la création), et exposer le
  choix à l'agence (cf. C4). · **FAISABILITÉ :** moyen. · **DÉCISION PRODUIT :** oui
  (opt-in agence).

### C3 — Réception du rapport d'expertise par l'agence (cible : choix)
- **ÉTAT ACTUEL :** **inexistant.** Aucun template ni envoi de rapport final ; « envoi
  rapport » n'apparaît que dans le **texte descriptif produit** Odoo
  (`src/app/api/submit-rdv/route.ts:739-740`), pas comme fonctionnalité. Aucune colonne
  `notify_on_report`, aucun cron rapport.
- **OÙ BRANCHER :** nouveau template + cron + colonne (s'appuyer sur le modèle
  `rdv-notification.ts`), **après** définition côté Odoo d'un événement « rapport
  transmis ». · **FAISABILITÉ :** complexe (dépend d'Odoo). · **DÉCISION PRODUIT :**
  oui (feature à créer).

### C4 — Préférences de notification par agence
- **ÉTAT ACTUEL — existant :** colonnes sur `organizations` :
  `notifications_enabled`, `notification_recipients_mode`, `notification_custom_emails`,
  `notify_on_create`, `notify_on_update`
  (`supabase/migrations/20260521120000_regularize_notifications_and_product_catalog.sql:55-68`).
  UI complète mais **admin-only** (`NotificationsTab.tsx`, derrière le garde
  `requireAdmin` du Bloc D).
- **Couverture des 3 préférences cibles :**
  1. Confirmation de commande EDL → **existe** (`notify_on_create`).
  2. Confirmation date/heure RDV → **existe** (`notify_on_update`).
  3. Réception du rapport → **n'existe pas** (aucune colonne `notify_on_report`).
- **Édition par l'agence elle-même :** **non** — tout passe par les routes
  `/api/admin/...` gardées par `isAdmin` ; aucune route self-service portail.
- **OÙ BRANCHER :** ajouter `notify_on_report` (+ UI) ; pour le self-service agence,
  créer une route/écran portail ou assouplir le garde. · **FAISABILITÉ :** moyen
  (90% déjà fait pour les 2 premières). · **DÉCISION PRODUIT :** oui (admin-only vs
  self-service ; ajout du 3ᵉ toggle).

### C5 — Impact Odoo : agence = « intervenant n°1 »
- **ÉTAT ACTUEL :** à la création de commande (`src/app/api/submit-rdv/route.ts:630-708`),
  les rôles sont posés via des champs `x_studio_*` **sans rang explicite** :
  `partner_id` (propriétaire si agence, `:638`), `x_studio_agence_partenaire` (agent,
  `:672` + tampon `:646-676`), `x_studio_partie_1_bailleurs_` (`:677`),
  `x_studio_partie_2_locataires_` (`:679-681`), `x_studio_conseil_intervenant_2_`
  (représentant, `:691-693`). Le lien agence passe bien par
  `x_studio_agence_partenaire` (**pas `parent_id`**).
- **La notion d'« intervenant n°1 » n'existe pas** dans le code (aucun champ de rang).
  Les « partie_1/partie_2 » sont des libellés de rôle, pas un classement.
- **Conséquences (sans modif) :** faire de l'agence l'intervenant principal nécessiterait
  soit un nouveau champ de rang côté Odoo, soit une logique d'ordre côté portail ; le
  `write` post-création (`:897-920`) ne retouche pas `x_studio_agence_partenaire`.
- **FAISABILITÉ :** moyen (design Odoo requis, pas de modif portail évidente). ·
  **DÉCISION PRODUIT :** oui (définir « intervenant n°1 » côté Odoo d'abord).

---

## 7. Tableau récapitulatif

| ID | Bloc | Item | Type | Faisabilité | Fichier:ligne | Décision produit ? |
|----|------|------|------|-------------|---------------|--------------------|
| — | Transverse | Bascule agence `client_type` (dupliquée, pas de helper) | modifier | moyen | `organizations.sql:14` ; `migration.sql:73-74` | oui |
| D1 | D | Notifications « Accès refusé » | débloquer | simple/moyen | `notifications/route.ts:30-32` ; `admin.ts:18-21` | oui |
| D2 | D | Champs perso « Acces refuse » | débloquer | simple/moyen | `custom-fields/route.ts:28-29` | oui |
| A1 | A | Colonne « Messages » | masquer | simple | `dashboard/page.tsx:735, 800-826` | non |
| A2 | A | Filtre « Non lus » | masquer | simple | `dashboard/page.tsx:122-128, 611-623` | non |
| A3 | A | Colonne « Propriétaire » | ajouter | moyen | `orders/route.ts:91, 175` ; `dashboard:731, 767` | oui |
| A4 | A | « Demande rapide » + « Mes brouillons » | masquer | simple | `dashboard/page.tsx:576-587` | non |
| B1 | B | UX liste « Type de mission » | modifier | moyen | `demande/page.tsx:963-978` | oui |
| B2 | B | « Importer le bail » | masquer | simple | `demande/page.tsx:1124-1126` | non |
| B3 | B | Bloc « Propriétaire » | constat | — | `demande/page.tsx:1128-1185` | non |
| B4 | B | Locataire société + min prénom/nom/email | ajouter/modifier | moyen | `demande/page.tsx:1281-1314` ; `tenant-name.ts:10` | oui |
| B5 | B | Champ « PO » | masquer | simple | `demande/page.tsx:1593-1604` | non |
| B6 | B | Notes + compteurs (rester optionnels) | constat | — | `demande/page.tsx:1606-1655` | non |
| B7 | B | Bloc « Tarification » + montant payload | masquer | moyen/complexe | `demande/page.tsx:1825-1845` ; `submit-rdv:735-789, 1182-1200` ; `orders/route.ts:89` | oui |
| C1 | C | Email confirmation agence | ajouter | moyen | `submit-rdv:1115-1176, 1147-1149` | oui |
| C2 | C | Email RDV à l'agence | modifier/ajouter | moyen | `check-rdv-notifications/route.ts` ; `odoo_agency_id` jamais écrit | oui |
| C3 | C | Réception rapport | ajouter | complexe | inexistant | oui |
| C4 | C | Préférences agence (3ᵉ toggle + self-service) | ajouter/débloquer | moyen | migration `2026-05-21:55-68` ; `NotificationsTab.tsx` | oui |
| C5 | C | Intervenant n°1 Odoo | modifier | moyen | `submit-rdv:630-708` | oui |

---

## 8. Points sensibles / risques

1. **D — nature du refus (front vs RLS vs API) :** c'est **API** (403 `isAdmin`), **pas
   RLS** (service-role bypass), **pas agence-spécifique**. Le caractère *sélectif* (2
   onglets) est **incohérent avec un simple `isAdmin`** partagé → exige un runtime
   (statut HTTP réel + schéma DB + `ADMIN_EMAILS`). Indice fort :
   `n.rommiee@gmail.com` (session) ≠ `n.rommiee@axis-experts.be` (fallback `admin.ts:3`).
2. **B7 — honoraires dans le payload :** masquer l'UI ne masque pas le montant
   (`submit-rdv` crée les lignes de prix et relit `amount_total` ; le listing renvoie
   `amount_total`). Risque d'exposition si la cible est « zéro honoraire visible ».
3. **C5 — intervenant Odoo :** « intervenant n°1 » n'existe pas ; tout changement de rang
   touche le mapping Odoo (`x_studio_agence_partenaire`, parties 1/2), risque de
   régression sur l'ownership (`ownership.ts:42-61`).
4. **C2 — `odoo_agency_id` non peuplé :** la notification agence est silencieusement
   inopérante tant que la colonne n'est pas saisie manuellement par l'admin.
5. **Condition agence dupliquée :** ~15 emplacements de `client_type === "agency"` sans
   helper central → risque d'incohérence si un futur masquage en oublie un.
6. **Colonne `require_tenant_name` hors-migration :** existe en prod mais pas de migration
   versionnée (cf. §2.5) → risque sur une base fraîche.

---

## 9. Zones non vérifiables sans runtime (Odoo/Supabase live)

- **B1 :** nombre exact de produits du catalogue Odoo.
- **D :** statut HTTP/corps réel par onglet ; existence en prod des tables
  `custom_fields`/`organization_custom_fields` et des 5 colonnes notifications ; valeur
  de `ADMIN_EMAILS` ; email réellement connecté ; comportement sur une org `social`.
- **A3 :** confirmer que `x_studio_partie_1_bailleurs_` est toujours peuplé sur les
  commandes agence existantes.
- **C2/C5 :** présence/peuplement de `odoo_agency_id`, et sémantique réelle des champs
  intervenants côté Odoo.
- **§2.5 :** confirmer la présence de `require_tenant_name` en base.

**À fournir pour lever ces points :** accès lecture Supabase (schéma + quelques lignes
`organizations`/`portal_clients`), variables d'env (`ADMIN_EMAILS`), et un compte Odoo
de test pour inspecter les champs `x_studio_*` d'une commande agence.

---

## 10. Ordre de chantier suggéré (PR futures — description seule)

1. **Lot 0 — Débloquer D (prérequis C4).** D'abord *diagnostiquer* runtime (statut HTTP +
   schéma + `ADMIN_EMAILS`). Si allowlist : corriger l'env/`admin.ts`. Si schéma :
   appliquer les migrations. **Simple/sûr** une fois la cause connue.
2. **Lot 1 — Masquages A/B (faible risque).** A1, A2, A4, B2, B5 : pur affichage
   conditionnel sur `clientType !== "agency"`. Idéalement introduire un helper `isAgency`
   pour réduire la duplication (§2).
3. **Lot 2 — B7 affichage + politique montant.** Masquer le bloc Tarification, **puis**
   trancher si le montant doit aussi disparaître des payloads/listing (plus risqué).
4. **Lot 3 — A3 colonne Propriétaire.** Ajouter le champ Odoo au listing + colonne.
5. **Lot 4 — B4 locataire société.** Champ + mapping Odoo + validations.
6. **Lot 5 — C1/C2/C4.** Email de confirmation agence, opt-in RDV, peuplement
   `odoo_agency_id`, 3ᵉ toggle + (option) self-service agence.
7. **Lot 6 — C3/C5 (plus complexe, dépend d'Odoo).** Réception rapport + intervenant n°1.

---
*Fin de l'audit. Aucun fichier de code applicatif modifié.*
