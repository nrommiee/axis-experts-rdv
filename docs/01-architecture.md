# 01 — Architecture

Ce document décrit les **composants** du module public de prise de RDV : les
routes API, les tables Supabase, le bucket de stockage, les bibliothèques
internes, et le mécanisme d'**isolation** vis-à-vis du portail privé.

---

## Vue d'ensemble des composants

```
src/
├── proxy.ts                          ← isolation : exempte les chemins publics du middleware auth
├── app/
│   ├── prendre-rdv/
│   │   ├── page.tsx                  ← formulaire public (client component, prix live)
│   │   └── merci/page.tsx            ← écran "demande envoyée"
│   ├── confirmer/
│   │   ├── [token]/                  ← confirmation de la demande (au clic)
│   │   │   ├── page.tsx              (serveur, lecture service_role)
│   │   │   └── ConfirmClient.tsx     (client, POST au clic)
│   │   └── partie/[token]/           ← validation de présence d'UNE partie (au clic)
│   │       ├── page.tsx
│   │       └── ValidateClient.tsx
│   └── api/public/
│       ├── prices/route.ts           ← grille tarifaire (lecture Odoo)
│       └── rdv/
│           ├── route.ts              ← soumission (POST multipart)
│           ├── confirm/route.ts      ← confirmation (POST, crée le devis Odoo)
│           ├── validate/route.ts     ← validation d'une partie (POST)
│           ├── cron/route.ts         ← cron rappels + expiration (GET)
│           └── validation-cron/route.ts ← cron liens de validation + bascule "RDV confirmé" (GET)
└── lib/
    ├── public-rdv/
    │   ├── schema.ts                 ← validation Zod du payload
    │   ├── pricing.ts                ← calcul TVAC + références produit Odoo (pur)
    │   ├── uploads.ts                ← garde-fous fichiers + upload Storage
    │   ├── odoo-order.ts             ← création du devis Odoo (sale.order brouillon)
    │   ├── validation.ts             ← constantes/champs Odoo des parties + rôles
    │   └── recap.ts                  ← récapitulatif lisible de la demande
    ├── parseRdvDate.ts               ← parseur défensif du champ date Odoo (CHAR)
    ├── mime-validation.ts            ← validation des magic bytes
    ├── email.ts                      ← envoi Resend (ne throw jamais)
    ├── email-templates/public-rdv-*  ← gabarits d'emails publics
    ├── rate-limit.ts                 ← limitation par IP (server-only)
    └── odoo.ts                       ← client XML-RPC Odoo (odooSearch/odooCreate/odooExecute)
```

---

## Les 6 routes API publiques

Toutes sont sous `/api/public/`, **exemptées du middleware d'authentification**
(voir [Isolation](#isolation-du-portail-privé)), en `runtime = "nodejs"`,
`dynamic = "force-dynamic"`, et protégées par **rate-limit IP** (ou par
`CRON_SECRET` pour les crons).

### 1. `GET /api/public/prices`

**Rôle** : renvoie la **grille tarifaire** (référence → prix **HTVA**) depuis
Odoo. Source de vérité unique des prix.

- Lit `product.template` dont `default_code` commence par `AXIS_` (`=like
  "AXIS_%"`) et qui sont actifs ; ne renvoie que `{ default_code: { name,
  htva } }`.
- Rate-limit **30 req / 5 min / IP** (anti-scraping).
- **Cache HTTP 1 h** (`Cache-Control: public, max-age=3600`) pour soulager Odoo.

### 2. `POST /api/public/rdv`

**Rôle** : enregistre une demande **`pending`**, stocke les pièces jointes,
envoie l'email de confirmation. **Ne crée aucun devis Odoo.**

- Transport **`multipart/form-data`** : champ `payload` (JSON, **max 50 ko**) +
  0..N champs `files`.
- Étapes : rate-limit (**5 req / 10 min / IP**) → parse multipart → **validation
  Zod** du payload → **validation fichiers** (extension, taille, *magic bytes*) →
  `INSERT public_rdv_requests` (`pending`, token, `expires_at = +72 h`) → upload
  Storage → email de confirmation.
- **Résilience** : un échec d'upload pose `upload_failed = true` mais **conserve**
  la demande ; un échec d'email renvoie tout de même `201` (loggué).
- Réponse : `{ ok: true }` (le **token n'est jamais renvoyé**).

### 3. `POST /api/public/rdv/confirm`

**Rôle** : confirme la demande (lien à **usage unique**) et **crée le devis
Odoo**.

- Rate-limit **30 req / 10 min / IP** (anti brute-force de token).
- **Update atomique** : `UPDATE ... SET status='confirmed' WHERE token=? AND
  status='pending' AND expires_at > now()`. Les clics concurrents/répétés mettent
  à jour **0 ligne** → pas de double traitement.
- Si une ligne est mise à jour → appel **`createOdooOrderForRequest()`**
  (non bloquant : un échec Odoo laisse la demande `confirmed` avec
  `odoo_order_id = null`, rejouable).
- Sinon, relit la ligne pour classer le résultat : `already` / `expired` /
  `invalid`.

### 4. `POST /api/public/rdv/validate`

**Rôle** : valide la **présence d'une partie** (clic du lien de validation).
Coche **sa** case Odoo. **Ne bascule pas** vers « RDV confirmé ».

- Rate-limit **30 req / 10 min / IP**.
- **Update atomique** sur `public_rdv_party_validations` (`pending → confirmed`).
- Au succès : `sale.order.write` de `x_studio_partie_N_*_confirm = true` +
  `x_studio_partie_N_*_confirm_le_1 = <datetime UTC>`.
- Statuts retournés : `confirmed` / `already` / `invalid`.

### 5. `GET /api/public/rdv/cron`

**Rôle** : **rappels + expiration** des demandes publiques non confirmées.

- **Sécurité** : `Bearer CRON_SECRET` (+ bypass preview `?test=1`, dry-run
  `?dry=1` — voir [`04-automatismes-crons.md`](./04-automatismes-crons.md)).
- Paliers : `+24 h` → rappel 1 (`reminders_sent 0→1`) ; `+48 h` → rappel 2
  (`1→2`) ; `expires_at` atteint → `status='expired'`.
- **Updates conditionnels avant envoi** (anti double-envoi), expiration en
  dernier, idempotent.

### 6. `GET /api/public/rdv/validation-cron`

**Rôle** : guetteur des devis publics « RDV proposé ». **Deux passes** :

- **Passe A** : « RDV proposé » + `proposition_envoye = false` → crée/envoie les
  **liens de validation** aux parties (ou email « informé » pour les rôles
  « Informé seulement »), puis pose `proposition_envoye = true` (anti-renvoi).
- **Passe B** : « RDV proposé » → si **toutes les parties requises** ont coché
  leur case Odoo → bascule **« RDV confirmé »** + notif parties + 1 email
  `info@axis-experts.be`.
- **Sécurité** identique au cron de rappels (`CRON_SECRET`, `?test=1`, `?dry=1`).
- **Anti-boucle** = le statut « RDV confirmé » lui-même (sort du périmètre).

> Détail des fréquences, de l'anti-boucle et du dry-run :
> [`04-automatismes-crons.md`](./04-automatismes-crons.md).

---

## Les 3 tables Supabase

Toutes les tables sont en **RLS activée, `service_role` uniquement** (aucune
policy `anon`/`authenticated`) : accès **exclusivement côté serveur**. Calquées
sur `public.audit_log`. **Aucune FK vers `auth.users`** ni vers le portail privé.

> Les migrations sont **exécutées manuellement** dans le SQL Editor Supabase
> (voir [`05-configuration.md`](./05-configuration.md#migrations-sql)).

### `public_rdv_requests` — la demande

Tampon des demandes en attente de confirmation.

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `uuid` PK | Identifiant ; sert de préfixe Storage `public/<id>/`. |
| `token` | `uuid` unique | Jeton du lien de confirmation email. |
| `status` | `text` | `pending` → `confirmed` \| `expired` \| `cancelled` (CHECK). |
| `form_data` | `jsonb` | Charge utile du formulaire (validée serveur). |
| `email`, `phone` | `text` | Coordonnées dénormalisées (envoi / suivi). |
| `expires_at` | `timestamptz` | Posé par le code = `now() + 72 h` (pas de DEFAULT SQL). |
| `confirmed_at` | `timestamptz` | Horodatage de la confirmation. |
| `reminders_sent` | `smallint` | Paliers de rappel franchis : `0`, `1`, `2`. |
| `odoo_order_id` | `bigint` | Renseigné **après** confirmation (devis créé) ; sert d'anti-doublon. |
| `documents` | `jsonb` | Liste `[{ path, name, size, mime }]` des pièces stockées. |
| `upload_failed` | `boolean` | `true` si ≥ 1 fichier n'a pas pu être stocké. |
| `created_at`, `updated_at` | `timestamptz` | Horodatage. |

Index : `token` (unique), `(status, expires_at)` (balayage cron).

### `public_rdv_party_validations` — un token par partie

Route chaque lien de validation vers **une** partie d'un `sale.order`. **La
source de vérité de la confirmation reste Odoo** ; cette table garantit l'usage
unique et l'anti-doublon d'envoi.

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `uuid` PK | Identifiant. |
| `odoo_order_id` | `bigint` | Devis Odoo concerné. |
| `party` | `text` | `p1` (bailleur) \| `p2` (locataire) (CHECK). |
| `token` | `uuid` unique | Jeton du lien de validation (par partie). |
| `role` | `text` | Rôle figé à l'envoi (`Doit valider` / `Informé seulement`). |
| `status` | `text` | `pending` → `confirmed` (CHECK). |
| `rdv_date_string` | `text` | Snapshot de la date (rendu figé, indépendant d'Odoo). |
| `email` | `text` | Email de la partie. |
| `confirmed_at`, `created_at` | `timestamptz` | Horodatage. |

Contrainte **`UNIQUE (odoo_order_id, party)`** → **upsert idempotent**. Index :
`token` (unique), `odoo_order_id`.

### `outlook_calendar_sync` — lien devis ↔ événement Outlook *(module Outlook, non mergé)*

Lie un devis Odoo à un événement de l'agenda Outlook de l'expert.

| Colonne | Rôle |
|---|---|
| `odoo_order_id` (unique) | Devis Odoo. |
| `graph_event_id` | Identifiant de l'événement Microsoft Graph. |
| `expert_email` | Boîte / agenda cible (= email de l'expert). |
| `last_synced_status` | Dernier statut métier répercuté. |
| `last_event_start` | Dernier créneau posé. |
| `sync_state` | `active` \| `manually_deleted` \| `error`. |
| `last_error` | Dernier message d'erreur de synchro. |

> Le `sync_state = manually_deleted` matérialise le **respect de la suppression
> manuelle** par l'expert (un `404` Graph → pas de recréation). Détails :
> [`03-operations.md`](./03-operations.md#gérer-lévénement-outlook).

---

## Bucket Storage `rdv-documents`

- Bucket **privé**. Les pièces jointes publiques sont stockées sous le préfixe
  **`public/<requestId>/<uuid>.<ext>`**.
- Le **nom d'origine du fichier n'entre jamais dans le chemin** (il est assaini
  et conservé uniquement en **métadonnée** `documents[].name`).
- Garde-fous (`src/lib/public-rdv/uploads.ts`) :
  - **Types autorisés uniquement** : `pdf`, `doc`, `docx`, `xls`, `xlsx` ;
  - **10 Mo / fichier**, **max 10 fichiers**, garde-fou **30 Mo** par requête ;
  - **Validation des *magic bytes*** (le contenu réel doit correspondre à
    l'extension) en plus de l'allowlist d'extension.
- Upload via `service_role`, `upsert: false`. Un échec isolé est loggué
  (`upload_failed = true`) sans interrompre les autres.

---

## Calcul de prix

`src/lib/public-rdv/pricing.ts` (fonctions **pures**, sans I/O) :

- **HTVA** : récupéré depuis Odoo (`list_price`), **jamais** depuis le client.
- **TVAC par partie** : `tvacPerParty(htva) = round(htva × 1,21 ÷ 2)`. Règle
  **identique** pour un bien et pour un supplément.
- **Total mission** = somme des deux parties (bailleur + locataire).
- **Référence du bien** : `bienRef(mission, tcode, chambres)` → `AXIS_<mission>_<taille>`
  où `taille` = `A0` (studio), `K` (kot), sinon `<code type><nb chambres>`
  (ex. `AXIS_ELLE_A1`, `AXIS_ELLS_M3`).
- **Référence d'un supplément** : `optionRef(key)` → `AXIS_OPT_<KEY>`
  (ex. `AXIS_OPT_JARDIN`). La **cave est offerte** : pas de ligne.

---

## Isolation du portail privé

`src/proxy.ts` court-circuite le middleware Supabase (auth + gate CGU) pour les
préfixes publics **uniquement** :

```ts
if (
  request.nextUrl.pathname.startsWith("/prendre-rdv") ||
  request.nextUrl.pathname.startsWith("/confirmer") ||
  request.nextUrl.pathname.startsWith("/api/public/")
) {
  return NextResponse.next();
}
```

Cette logique est **purement additive** : aucun chemin privé ne matche ces
préfixes, donc le comportement des routes privées est **inchangé**.

Garanties d'isolation :

1. **Routes publiques** : pas d'authentification, pas de gate CGU.
2. **Données** : les tables publiques sont en RLS `service_role` only, sans aucun
   lien (FK) vers le portail (`auth.users`, `portal_clients`, `organizations`).
3. **Crons** : les crons publics partent **toujours** de `public_rdv_requests` ;
   le cron du **portail** (`/api/cron/check-rdv-notifications`) **n'est pas
   modifié** et reste indépendant.
</content>
