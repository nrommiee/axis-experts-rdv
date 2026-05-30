# Audit — Unification de la logique « après‑demande » RDV

> **Périmètre** : audit en LECTURE SEULE du dépôt `axis-experts-rdv` (en production).
> Aucun autre fichier n'a été modifié. Aucune valeur de secret n'est citée — uniquement
> des **noms** de variables d'environnement.
>
> **Objectif** : unifier la logique « proposition de date → validation par chaque partie
> → RDV confirmé → copie agenda Outlook de l'expert → notifications réglables » entre :
> - **(A/B existant)** le portail privé authentifié (agences / organisations) — en prod ;
> - **(B cible)** une nouvelle page **publique** de prise de RDV — à concevoir.

---

## 0. Pile technique & points de jonction

| Brique | Emplacement | Rôle |
|---|---|---|
| Client Odoo (XML‑RPC) | `src/lib/odoo.ts` | `odooExecute` / `odooCreate` / `odooSearch`, auth par compte API unique (`uidCache`) |
| Création devis portail | `src/app/api/submit-rdv/route.ts` | Crée le `sale.order` + partenaires + lignes + emails |
| Moteur notifications RDV | `src/app/api/cron/check-rdv-notifications/route.ts` | CRON qui détecte la date posée dans Odoo et notifie |
| Planning CRON | `vercel.json` | `*/10 * * * *` → `/api/cron/check-rdv-notifications` |
| Envoi email | `src/lib/email.ts` | Wrapper Resend (`sendEmail`) |
| Template email RDV | `src/lib/email-templates/rdv-notification.ts` | « Rendez‑vous planifié / mis à jour » |
| Résolution destinataires | `src/lib/notification-recipients.ts` | `creator_only` / `all_org_users` / `custom_list` |
| Parsing date RDV | `src/lib/parseRdvDate.ts` | Parse le CHAR `x_studio_date_prochain_rendez_vous_1` |
| Lecture devis (dashboard) | `src/app/api/odoo/orders/route.ts` | Listing client |
| Flux Dactylo | `src/lib/odoo/dactylo.ts` | Seul endroit qui **lit** `x_studio_expert_externe_` |
| Données portail | Supabase (`portal_clients`, `organizations`, `portal_submissions`, `rdv_notifications_sent`, `rdv_custom_values`) | Auth + config + dédup |

Variables d'environnement utilisées (noms uniquement) : `ODOO_URL`, `ODOO_DB`,
`ODOO_USER`, `ODOO_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## 1. Création de devis côté portail

**Fichier unique : `src/app/api/submit-rdv/route.ts` (`POST`).**
Authentification Supabase obligatoire (`supabase.auth.getUser()`), rate‑limit
(`checkRateLimit`, 10/60 min), validation (`validateBody`, schéma `rdvDateRangeSchema`).

### Séquence
1. **Step 1** — charge la ligne Supabase `portal_clients` du user →
   `odoo_partner_id`, `odoo_template_prefix`, `client_type`, `organization_id`.
2. **Step 1b** — clients `agency` : résout produit/​suppléments depuis
   `agencyPriceSelection` via Supabase `product_catalog` → `product.template`.
3. **Step 2** — résout `sale_order_template_id` (via `getTemplateId`) **ou** lignes produit.
4. **Step 3** — crée TOUJOURS un `res.partner` adresse (`type: "delivery"`, `parent_id` = client).
5. **Step 4** — partenaire **bailleur** : agence → recherche/crée le propriétaire réel
   (par email puis nom) ; autres clients → réutilise `clientRow.odoo_partner_id`.
6. **Step 5 / 5b** — partenaire **locataire** et **représentant** (recherche email→nom, sinon création).
7. **Step 6** — résout `tag_ids` (ELE = entrée / ELS = sortie) sur `sale.order.tag` puis `crm.tag`.
8. **Step 8** — crée le `sale.order` (voir champs ci‑dessous), puis **Step 8b** écrit
   `x_studio_suivi_expert = "En cours"`.
9. **Step 9/10** — lignes (section, produits/template, notes), **Step 10b** force les
   parties/adresse après lignes, **Step 10c** notes chatter (`message_post`).
10. **Step 11** — pièces jointes : `ir.attachment` (Odoo) + Supabase Storage (`rdv-documents`).
11. **Step 12 / 12b** — emails (cf. §3).
12. **Step 13/14** — récupère `name` du devis, insère dans Supabase `portal_submissions`
    (`odoo_order_id`, `odoo_order_name`, `user_id`, `organization_id`), `logAction("rdv.create")`.

### Champs Odoo écrits sur `sale.order` (Step 8)
```
partner_id                       (agence → propriétaire ; sinon partner du client)
partner_shipping_id              (= partenaire adresse créé)
x_studio_adresse_de_mission      (= partenaire adresse)
x_studio_type_de_bien_1
x_studio_type_de_client          ("Agent immobilier" | "Bailleur")
x_studio_agence_partenaire       (agence uniquement = partner du client)
x_studio_partie_1_bailleurs_     (bailleur / propriétaire)
x_studio_partie_2_locataires_    (locataire)
x_studio_portail_client = true   ← MARQUEUR DE CANAL (clé de jointure du CRON)
sale_order_template_id           (branche template)
tag_ids                          (ELE/ELS)
x_studio_conseil_intervenant_2_  (représentant, si présent)
x_studio_suivi_expert = "En cours" (Step 8b)
```

### Champs `x_studio_*` custom écrits — récapitulatif
`x_studio_adresse_de_mission`, `x_studio_type_de_bien_1`, `x_studio_type_de_client`,
`x_studio_agence_partenaire`, `x_studio_partie_1_bailleurs_`,
`x_studio_partie_2_locataires_`, `x_studio_portail_client`,
`x_studio_conseil_intervenant_2_`, `x_studio_suivi_expert`.

> ⚠️ **Le portail N'ÉCRIT PAS** `x_studio_date_prochain_rendez_vous_1` ni
> `x_studio_expert_externe_`. La « date souhaitée » (`dateDebut`/`dateFin`) part
> uniquement en **ligne de note** (`Date souhaitée : …`) et dans l'email — pas dans
> le champ date Odoo.

---

## 2. Logique RDV existante côté portail

### Y a‑t‑il une date de RDV ?
- **Source de vérité = Odoo**, champ **CHAR libre** `x_studio_date_prochain_rendez_vous_1`
  (format `DD/MM/YYYY de (HH:MM à HH:MM) (Europe/Brussels)`), **saisi manuellement par
  l'expert dans Odoo**. Parsé défensivement par `src/lib/parseRdvDate.ts`.
- Le portail ne fait que **collecter une plage souhaitée** (`dateDebut`/`dateFin`,
  `rdvDateRangeSchema`) → note + email. **Aucune écriture** dans le champ date.

### Y a‑t‑il une proposition / confirmation / validation par partie ?
- **NON.** Il n'existe **aucun** flux « proposition → validation par chaque partie via
  lien signé ». Le seul mécanisme de token (`/api/auth/validate-token`) sert
  **uniquement** à l'activation de compte (invitations), pas au RDV.
- Le « cycle de vie » est porté par `x_studio_suivi_expert` (statut Odoo), affiché au
  dashboard via `STATUS_MAP` (`src/app/dashboard/page.tsx`) : `En cours`, `Dactylo`,
  `A vérifier par expert`, `A facturer`, `Clôturé expert`, `Annulé`, … — il s'agit d'un
  suivi de production, **pas** d'une validation contradictoire des parties.

### Confirmation « date programmée » — mécanisme réel
`src/app/api/cron/check-rdv-notifications/route.ts` (CRON 10 min) :
1. Auth `Bearer CRON_SECRET`.
2. `search_read` Odoo : `x_studio_portail_client = true` **ET**
   `x_studio_date_prochain_rendez_vous_1 != false` **ET** `state not in [cancel, done]`
   **ET** `write_date >= now-90j` (limite 500).
3. Dédup via Supabase `rdv_notifications_sent` (par `odoo_order_id` + `rdv_date_string`).
   - **Bootstrap** (table vide au 1er run) : enregistre sans envoyer.
   - Sinon : `initial` (1ère fois) vs `updated` (la date a changé) ; `skipped_same` sinon.
4. Résout l'organisation (par `partner_id` ou `x_studio_agence_partenaire`) puis les
   destinataires, applique `notifications_enabled` / `notify_on_create` / `notify_on_update`.
5. Envoie l'email « Rendez‑vous planifié / mis à jour » et upsert la trace.

> **C'est ici, et seulement ici, que naît la « confirmation quand une date est
> programmée ».** Elle est déclenchée par la saisie de la date **dans Odoo par l'expert**,
> détectée par polling — pas par le portail au moment de la demande.

---

## 3. Notifications existantes

**Lib** : Resend via `src/lib/email.ts` → `sendEmail`. `FROM = noreply@axis-experts.be`,
`replyTo` par défaut `info@axis-experts.be`, blocklist de domaines en production.

| # | Déclencheur | Émetteur | Destinataire(s) | Nature |
|---|---|---|---|---|
| a | **Création** demande (synchrone) — `submit-rdv` Step 12 | HTML inline dans la route | bailleur (si `bailleurEmail` et `notifyBailleur !== false`) | **Accusé de réception** : « nous vous recontacterons pour confirmer la date ». ⚠️ **PAS** une confirmation de RDV. |
| b | **Création** demande (synchrone) — `submit-rdv` Step 12b | HTML inline dans la route | `info@axis-experts.be` | Notification **interne** complète + lien Odoo |
| c | **Date programmée dans Odoo** (CRON 10 min) | `src/lib/email-templates/rdv-notification.ts` (`buildRdvNotificationEmail`) | destinataires de l'organisation | « **Rendez‑vous planifié / mis à jour** » → c'est **la** confirmation de date |

### Un email de confirmation est‑il déjà envoyé quand une date est programmée ?
**OUI** — mais via le **CRON (c)**, lecture de `x_studio_date_prochain_rendez_vous_1`,
adressé aux **utilisateurs de l'organisation** (pas spécifiquement au propriétaire/bailleur).
L'email (a) au moment de la demande ne fait qu'**annoncer** qu'une confirmation suivra.

### Réglages (par organisation, Supabase `organizations`)
Colonnes (migration `20260521120000_regularize_notifications_and_product_catalog.sql`) :
`notifications_enabled`, `notification_recipients_mode`
(`creator_only` | `all_org_users` | `custom_list`), `notification_custom_emails`,
`notify_on_create`, `notify_on_update`.
- UI admin : `src/app/api/admin/organizations/[id]/notifications/route.ts` (+ `/test`),
  composant `NotificationsTab.tsx`.
- Résolution : `src/lib/notification-recipients.ts` (`resolveNotificationRecipients`).
  `creator_only` s'appuie sur Supabase `portal_submissions.user_id` ; `all_org_users`
  liste les `portal_clients` non supprimés/bloqués de l'org.

---

## 4. Champ expert & utilisateurs

### `x_studio_expert_externe_` (many2one `res.partner` sur `sale.order`)
- **Lu uniquement** dans `src/lib/odoo/dactylo.ts` (listing « Dactylo », champ
  `expert_name` via `many2oneName`). Affiché côté équipe interne.
- **Jamais écrit** par le portail. Aucune affectation d'expert depuis le portail.

### Accès aux utilisateurs Odoo (`res.users`)
- **AUCUN.** Le portail n'interroge ni n'écrit `res.users`. Recherche `grep` : 0 occurrence.
- La connexion Odoo se fait via **un compte API unique** (`ODOO_USER` / `ODOO_API_KEY`,
  `uidCache`). Les « utilisateurs » du portail sont des comptes **Supabase Auth**
  (`portal_clients`), sans correspondance avec des users Odoo.

> Conséquence pour Outlook : il n'existe **aucune** brique reliant un devis à un
> **utilisateur Odoo / boîte Outlook** d'expert. Le seul lien expert est le **partenaire**
> `x_studio_expert_externe_` (res.partner, en lecture seule). Il faudra un email/identité
> d'expert pour cibler un agenda.

### Recherche Outlook / Microsoft Graph / agenda
- **AUCUNE intégration** Outlook / Microsoft Graph / calendar dans le dépôt (`grep` : 0).
  Tout le volet « copie agenda Outlook de l'expert » est **à construire de zéro**.

---

## 5. Points de divergence (B existant ↔ flux public cible)

| Aspect | Portail existant (B) | Flux public cible |
|---|---|---|
| Identité | Authentifié Supabase, lié `portal_clients` + `organization_id` | **Anonyme** : ni `portal_clients`, ni `organization_id` |
| Date RDV | « Date souhaitée » (plage) → note + email ; date réelle saisie **manuellement** dans Odoo par l'expert | **Proposition** explicite + **validation par chaque partie** |
| Validation contradictoire | **Inexistante** | Cœur du besoin (liens signés par partie) |
| Lien signé | N'existe pas (token = setup compte uniquement) | À créer (table token + routes/pages publiques) |
| Outlook | **Inexistant** | À créer (Graph + identité/email expert) |
| Destinataires notif | Clés sur `organization` (Supabase) | Pas d'org → fallback emails portés par le devis (bailleur/locataire) + interne |
| Marqueur canal Odoo | `x_studio_portail_client = true` | Marqueur **distinct** requis pour le filtre CRON |
| `creator_only` | S'appuie sur `portal_submissions.user_id` | Pas de user → inapplicable tel quel |

### Ce qui est MUTUALISABLE (même brique pour les 2 canaux)
- **`sale.order` Odoo comme objet pivot** + schéma `x_studio_*` commun
  (`partie_1_bailleurs_`, `partie_2_locataires_`, `adresse_de_mission`, `type_de_bien_1`).
- **`x_studio_date_prochain_rendez_vous_1` comme signal unique de « RDV confirmé »** +
  `src/lib/parseRdvDate.ts`.
- **Le moteur CRON de notification** (`check-rdv-notifications`) + dédup
  `rdv_notifications_sent` + **template** `rdv-notification.ts` : déjà piloté par l'**order**,
  donc extensible aux deux canaux.
- **`src/lib/email.ts`** (Resend) et le **pattern** `resolveNotificationRecipients`.
- **`src/lib/odoo.ts`** (`odooExecute/Create/Search`) et la résolution **tags ELE/ELS**.

### Ce qui doit rester SPÉCIFIQUE à chaque canal
- **Portail** : formulaire authentifié, simulateur agence, `portal_clients`/`organizations`,
  upload documents, champs custom (`rdv_custom_values`).
- **Public** : flux token/lien signé + UI de validation par partie, synchro Outlook,
  création de partenaires **anonymes** (sans portal_client/org), résolution destinataires
  sans organisation.

---

## 6. Recommandation d'architecture

### Principe directeur
**Le point commun est le `sale.order` Odoo, et le seuil de déclenchement commun est la
saisie de `x_studio_date_prochain_rendez_vous_1`.** Le portail confirme déjà via ce
champ + CRON. Il faut donc :
1. faire **converger les deux canaux vers ce même champ** (le flux public l'écrit quand
   toutes les parties ont validé) ;
2. **brancher l'unique moteur « confirmation + notifications + Outlook » sur ce champ**,
   sans toucher la création de devis portail.

### Le « seam » propre
> Quand la **validation par toutes les parties** est complète (flux public), on **écrit**
> `x_studio_date_prochain_rendez_vous_1`. Cette écriture est exactement le signal que le
> moteur existant surveille déjà → notifications + Outlook se déclenchent **sans dupliquer
> la logique**. Aucune modification de `submit-rdv` n'est requise.

### Fichiers à CRÉER
- **Page/API publiques** :
  `src/app/rdv/page.tsx` (ou `/prendre-rendez-vous`) et
  `src/app/api/public/submit-rdv/route.ts` — crée un `sale.order` réutilisant le même
  schéma `x_studio_*`, avec un **marqueur de canal distinct** (nouveau booléen
  `x_studio_*` dédié **ou** un tag « PUBLIC » — à ne **pas** réutiliser `x_studio_portail_client`).
- **Validation par partie (liens signés)** :
  migration Supabase `rdv_validation_tokens` (token, odoo_order_id, party, status, expiry),
  `src/app/api/rdv-validation/[token]/route.ts` (GET état + POST validation),
  page publique de validation. À la dernière validation → **écrit le champ date Odoo**.
- **Outlook** : `src/lib/outlook.ts` (client Microsoft Graph) + nouvelles variables d'env
  (noms à définir, ex. `MS_TENANT_ID` / `MS_CLIENT_ID` / `MS_CLIENT_SECRET`), appelé par
  le moteur partagé ; **no‑op si non configuré** (pour ne pas impacter le portail).
- **Moteur partagé** : extraire la logique de `check-rdv-notifications/route.ts` vers un
  module réutilisable `src/lib/rdv-engine.ts` (détection date → notifications → Outlook),
  puis l'invoquer depuis le CRON. Généraliser :
  - le **filtre order** pour inclure le canal public (en plus de `x_studio_portail_client`) ;
  - la **résolution destinataires** avec fallback « sans organisation » (emails du
    bailleur/locataire portés par l'order + interne `info@`) ;
  - l'ajout de l'**étape Outlook** ciblant l'expert via `x_studio_expert_externe_`
    (nécessite un email/identité d'expert — à câbler).

### Fichiers à NE PAS TOUCHER (prod)
- `src/app/api/submit-rdv/route.ts` (création devis portail).
- `src/app/demande/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/brouillons/…`,
  `src/app/profil/…`, flux Dactylo (`src/lib/odoo/dactylo.ts`, `src/app/api/dactylo/…`).
- `src/lib/odoo.ts` (le **consommer**, ne pas changer ses signatures).
- Config notifications existante (colonnes `organizations`, routes admin notifications,
  `NotificationsTab.tsx`) : **étendre** par de nouveaux chemins, ne pas casser l'existant.
- Le **filtre `x_studio_portail_client = true`** du CRON : doit continuer de fonctionner
  pour les ordres portail (l'élargissement se fait en **ajout**, jamais en remplacement).

### Stratégie de non‑régression
- Canal public = **source supplémentaire** alimentant les **mêmes champs**, pas une
  réécriture de `submit-rdv`.
- Étape Outlook **désactivée par défaut** (no‑op sans env) → déploiement portail inchangé.
- Refactor du moteur = **extraction sans changement de comportement** ; le CRON garde son
  contrat (`CRON_SECRET`, `vercel.json`).

---

## Conclusion

### ✅ MUTUALISABLE
- `sale.order` Odoo comme **objet pivot** + schéma `x_studio_*` (parties, adresse, type de bien).
- `x_studio_date_prochain_rendez_vous_1` comme **signal unique de RDV confirmé** + `parseRdvDate.ts`.
- **Moteur CRON** `check-rdv-notifications` + dédup `rdv_notifications_sent` (à extraire en `rdv-engine.ts`).
- **Template** `src/lib/email-templates/rdv-notification.ts` (« planifié / mis à jour »).
- **Envoi email** `src/lib/email.ts` (Resend) + pattern `resolveNotificationRecipients`.
- Client Odoo `src/lib/odoo.ts` (`odooExecute/Create/Search`) + résolution tags ELE/ELS.
- Réglages on/off & destinataires (`notifications_enabled`, `notify_on_create/update`, modes) — **à étendre**, pas à dupliquer.

### ⛔ À NE PAS TOUCHER
- `src/app/api/submit-rdv/route.ts` (devis portail en prod).
- `src/app/demande/page.tsx`, `dashboard`, `brouillons`, `profil`, flux **Dactylo**.
- `src/lib/odoo.ts` (signatures) — consommer uniquement.
- Filtre `x_studio_portail_client = true` du CRON (élargir en **ajout** seulement).
- Routes/UI admin notifications existantes + colonnes `organizations` (étendre, ne pas casser).
- `vercel.json` / contrat `CRON_SECRET` (préserver).

### Points durs identifiés (à concevoir, inexistants aujourd'hui)
1. **Validation par partie via lien signé** : aucune brique (le seul token = setup compte).
2. **Synchro Outlook** : aucune intégration Microsoft Graph ; et **aucun lien devis → user
   Odoo / boîte Outlook** d'expert (seul `x_studio_expert_externe_`, un `res.partner` lu en
   lecture seule, est disponible — il faudra en dériver une identité/email d'expert).
3. **Canal public sans organisation** : `creator_only` et la résolution de destinataires
   actuelle reposent sur `portal_submissions`/`organizations` → fallback à prévoir.
