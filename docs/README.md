# Documentation — Page publique de prise de RDV (Axis Experts)

> Module **`/prendre-rdv`** : page web **publique (sans login)** de demande de
> rendez-vous pour les états des lieux immobiliers belges d'Axis Experts. Elle
> crée un **devis Odoo** et est **unifiée** avec le portail privé existant tout
> en restant **strictement isolée** de lui.
>
> En production : **`rdv.axis-experts.be`** (Vercel). Le site vitrine
> (`axis-experts.be`) est un WordPress séparé.

---

## Sommaire

| Fichier | Contenu |
|---|---|
| [`README.md`](./README.md) | Vue d'ensemble, parcours client A→Z, schéma du flux (ce document). |
| [`01-architecture.md`](./01-architecture.md) | Composants, les 6 routes API publiques, les 3 tables Supabase, le bucket Storage, l'isolation du portail (`proxy.ts`). |
| [`02-cycle-de-vie.md`](./02-cycle-de-vie.md) | Les statuts Odoo, qui déclenche quoi, la cartographie complète des champs Odoo. |
| [`03-operations.md`](./03-operations.md) | Guide métier pas-à-pas : proposer une date, validation des parties, confirmer sans email, **ajouter un expert**, gérer l'événement Outlook. |
| [`04-automatismes-crons.md`](./04-automatismes-crons.md) | Les crons, fréquences, rôles, anti-boucle, dry-run, bypass preview, sécurité `CRON_SECRET`. |
| [`05-configuration.md`](./05-configuration.md) | Variables d'environnement (noms), configuration Microsoft Azure, migrations SQL. |
| [`06-depannage.md`](./06-depannage.md) | Pièges rencontrés : symptôme → cause → solution. |

> ℹ️ Cette documentation décrit **le moteur de prise de RDV public** fusionné
> dans `main` (PR #29) ainsi que le **module Outlook** (branche
> `claude/outlook-sync`, en cours de finalisation, **pas encore mergé** — les
> sections concernées sont signalées).

---

## Pile technique

| Domaine | Choix |
|---|---|
| Framework | **Next.js 16** (App Router), **React 19**, **TypeScript** |
| Style | **Tailwind v4**, jaune de marque **`#F5B800`** |
| Gestionnaire de paquets | **pnpm** |
| Base de données | **Supabase** (tables Postgres + Storage + clé `service_role`) |
| ERP / devis | **Odoo** (production) via **XML-RPC** |
| Emails | **Resend** (domaine d'envoi `axis-experts.be`) |
| Agenda expert *(module Outlook)* | **Microsoft Graph** (Outlook, app-only / client credentials) |
| Hébergement | **Vercel** (`rdv.axis-experts.be`) |

---

## Objectif métier

Permettre à un **propriétaire / bailleur, un locataire ou une agence** de
demander un état des lieux **sans créer de compte**, en obtenant un **prix
indicatif en direct** (calculé sur la grille tarifaire Odoo), puis de
matérialiser cette demande sous forme de **devis Odoo (brouillon)** prêt à être
traité par un expert.

Le module est **public et anonyme** mais **partage la base de données et l'ERP**
du portail privé. Il en est néanmoins **isolé** : aucune route publique ne touche
les données du portail, et inversement (voir [`01-architecture.md`](./01-architecture.md)).

---

## Parcours client de A à Z

### 1. Formulaire `/prendre-rdv`

Page publique. Le visiteur choisit **qui il est** (propriétaire, locataire,
agence — et personne physique ou société), la **mission** (état des lieux
d'**entrée** = `ELLE`, ou de **sortie** = `ELLS`), le **type de bien**
(appartement, maison, studio, kot) et le **nombre de chambres**, puis d'éventuels
**suppléments** (meublé, jardin, sanitaire supplémentaire, garage ; la **cave est
offerte**).

- Les **prix sont récupérés en direct depuis Odoo** via `GET /api/public/prices`
  (articles dont le code commence par `AXIS_`).
- Le **prix TVAC par partie** est calculé localement avec la règle unique
  `round(HTVA × 1,21 ÷ 2)` ; le **total mission = somme des deux parties**
  (bailleur + locataire). Voir [`01-architecture.md`](./01-architecture.md#calcul-de-prix).
- L'**adresse est saisie librement** (rue, n°, boîte, code postal, ville). La
  carte / autocomplétion a été **retirée volontairement**.
- Le client peut joindre des **pièces** (PDF / Word / Excel).
- Le **consentement RGPD** est obligatoire.

### 2. Soumission `POST /api/public/rdv` (multipart)

À l'envoi :

1. **Rate-limit** par IP, **validation Zod** stricte du payload, **validation des
   fichiers** (extension + taille + *magic bytes*).
2. Insertion dans la table **`public_rdv_requests`** :
   `status = 'pending'`, **token** unique, `expires_at = now() + 72 h`,
   `reminders_sent = 0`, `form_data` (JSON), `email`.
3. **Upload des pièces jointes** (PDF / Word / Excel, **10 Mo / fichier**, **max
   10**) dans le bucket privé **`rdv-documents`**, sous le préfixe
   `public/<id>/`, avec validation des *magic bytes*. Un échec d'upload **n'efface
   jamais** la demande (drapeau `upload_failed`).
4. **Email de confirmation** (Resend, double opt-in) avec un lien
   `/confirmer/<token>`.

> ⚠️ **Aucun devis Odoo n'est créé à cette étape.** La demande n'est qu'un
> *tampon* en attente.

### 3. Page `/prendre-rdv/merci`

Écran « demande **envoyée** » (≠ confirmée). Invite le client à cliquer sur le
lien reçu par email.

### 4. Confirmation **au clic** sur `/confirmer/[token]`

Le client clique sur le lien de l'email. La confirmation se fait **au clic
(POST)**, jamais au chargement de la page — protection contre les **scanners de
mail** qui préouvrent les liens. Le lien est à **usage unique** :

- Passage **atomique** `pending → confirmed` (`UPDATE ... WHERE status='pending'
  AND expires_at > now()`).
- **À cet instant seulement**, le **devis Odoo** (`sale.order` **brouillon**) est
  créé :
  - **dédoublonnage du contact** (`res.partner`) ;
  - parties renseignées dans `x_studio_partie_1_bailleurs_` /
    `x_studio_partie_2_locataires_` ;
  - **pièces jointes** rattachées en `ir.attachment` (trombone) ;
  - statut métier `x_studio_suivi_expert = "Demande reçue"`.

### 5. Si la demande n'est **pas** confirmée : rappels automatiques

Le cron **`/api/public/rdv/cron`** (horaire) relance le client :

- **+24 h** → 1ᵉʳ rappel,
- **+48 h** → 2ᵉ (dernier) rappel,
- **+72 h** (`expires_at` atteint) → `status = 'expired'`.

### 6. L'expert **propose une date** dans Odoo

L'expert renseigne `x_studio_date_prochain_rendez_vous_1` (champ texte parsé) et
passe le statut à **« RDV proposé »**. Le cron
**`/api/public/rdv/validation-cron`** envoie alors **à chaque partie devant
valider** un **lien de validation** `/confirmer/partie/<token>`.

### 7. Chaque partie **valide sa présence** (au clic)

Via `/confirmer/partie/[token]`, chaque partie coche **sa** case dans Odoo
(`x_studio_partie_N_*_confirm` + `_confirm_le_1` = datetime). **Alternative :
l'expert coche manuellement** la case dans Odoo (cas d'une partie sans email).
**La case Odoo fait foi.**

### 8. Bascule automatique vers **« RDV confirmé »**

Quand **toutes les parties requises** ont leur case cochée, le cron de validation :

- bascule `x_studio_suivi_expert` → **« RDV confirmé »**,
- **notifie les parties** par email (toutes celles ayant un email, sauf « Ne plus
  notifier »),
- envoie **1 copie** à **`info@axis-experts.be`**.

> **Parties requises** = rôle **« Doit valider »** *ou* **rôle vide** (défaut
> public). Les rôles **« Informé seulement »**, **« Ne plus notifier »** et les
> parties absentes **ne comptent pas** dans la condition de bascule.
>
> **Anti-boucle** : le statut **« RDV confirmé »** lui-même sort le devis du
> périmètre du cron → une seule bascule, une seule notification.

---

## Schéma du flux

```
        ┌─────────────────────────────────────────────────────────────────┐
        │                    CLIENT (navigateur, sans login)                │
        └─────────────────────────────────────────────────────────────────┘
                                        │
                  (1) remplit /prendre-rdv  ── prix live ──►  GET /api/public/prices ──► Odoo
                                        │
                  (2) POST /api/public/rdv (multipart)
                                        ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │  public_rdv_requests : status=pending, token, expires_at=+72h     │
        │  Storage rdv-documents/public/<id>/  (pièces jointes validées)    │
        │  Email de confirmation (Resend)  ─────────────────────────────────┼──► client
        └─────────────────────────────────────────────────────────────────┘
                                        │
                  (3) /prendre-rdv/merci
                                        │
        ── PAS de clic ───────────────┐ │ ┌─── clic (4) /confirmer/[token] ──────────────┐
                                      ▼ │ ▼                                               │
        cron /api/public/rdv/cron       │   UPDATE atomique pending → confirmed           │
        +24h → rappel 1                 │   ──► création devis Odoo (sale.order brouillon)│
        +48h → rappel 2                 │       statut "Demande reçue", parties, pièces   │
        +72h → expired                  │                                                 │
                                        │                                                 ▼
                                        │           ┌──────────── ODOO (sale.order) ──────────────┐
                                        │           │  (6) Expert propose une date + "RDV proposé"  │
                                        │           └───────────────────────────────────────────────┘
                                        │                                  │
                                        │      cron /api/public/rdv/validation-cron (toutes les 15 min)
                                        │                                  │
                          ┌─────────────┴──────────── PASSE A ─────────────┘
                          ▼                                   envoie lien /confirmer/partie/<token>
        (7) chaque partie clique son lien ──► coche x_studio_partie_N_confirm dans Odoo
            (ou l'expert coche manuellement — la case Odoo fait foi)
                          │
                          ▼  cron validation — PASSE B : toutes les parties REQUISES cochées ?
        ┌─────────────────────────────────────────────────────────────────┐
        │  (8) bascule "RDV confirmé"  + email aux parties + copie info@    │
        └─────────────────────────────────────────────────────────────────┘

   [module Outlook, non mergé] miroir de ce cycle dans l'agenda Outlook de l'expert
   (Demande reçue → événement repère ; RDV proposé → vrai créneau ; RDV confirmé → titre ✓)
```

---

## Principes transverses

- **Isolation du portail privé** : `proxy.ts` exempte `/prendre-rdv`,
  `/confirmer` et `/api/public/` du middleware d'authentification. Les crons
  publics partent **toujours** de `public_rdv_requests`, jamais du portail.
- **Tout est server-only côté données** : les tables publiques sont en **RLS
  `service_role` uniquement** (deny-by-default), exactement comme `audit_log`.
- **Résilience** : un échec Odoo, email ou upload **ne casse jamais** la
  confirmation client ; il est loggué et rattrapable.
- **Sécurité des liens** : tokens opaques, jamais réexposés ni loggués, actions
  **au clic** (anti-scanner), updates **atomiques** (anti-double-traitement).
</content>
</invoke>
