# 02 — Cycle de vie & cartographie Odoo

Ce document décrit **les statuts** (côté Supabase et côté Odoo), **qui déclenche
quoi**, et la **cartographie complète des champs Odoo** utilisés par le module.

---

## Deux cycles de vie distincts

Le module manipule **deux** machines à états :

1. **La demande** (`public_rdv_requests.status`) — avant l'existence du devis.
2. **Le devis Odoo** (`sale.order.x_studio_suivi_expert`) — après confirmation.

### Cycle 1 — la demande (Supabase)

```
                       POST /api/public/rdv
                              │
                              ▼
                          [pending]
                          token, expires_at = +72h, reminders_sent = 0
            ┌───────────────┼─────────────────────────────┐
            │               │                             │
   clic /confirmer    cron +24h/+48h                cron expires_at
   (atomique)         (rappels, reminders_sent      atteint
            │          0→1→2, statut inchangé)              │
            ▼                                               ▼
       [confirmed] ──► création devis Odoo            [expired]
       confirmed_at, odoo_order_id

   ([cancelled] : prévu par le CHECK, non émis par le moteur actuel)
```

| Statut | Émis par | Signification |
|---|---|---|
| `pending` | `POST /api/public/rdv` | Demande enregistrée, en attente de confirmation. |
| `confirmed` | `POST /api/public/rdv/confirm` (atomique) | Client a confirmé → devis Odoo créé. |
| `expired` | `GET /api/public/rdv/cron` | 72 h écoulées sans confirmation. |
| `cancelled` | *(réservé, non émis actuellement)* | Prévu par le CHECK SQL. |

### Cycle 2 — le devis Odoo (`x_studio_suivi_expert`)

```
   [Demande reçue]  ← posé à la création du devis (confirmation client)
        │
        │  (expert renseigne une date + change le statut, manuellement dans Odoo)
        ▼
   [RDV proposé]    ← le cron validation prend le relais
        │              Passe A : envoie les liens de validation aux parties
        │              Passe B : attend les cases cochées
        │
        │  (toutes les parties REQUISES ont coché leur case Odoo)
        ▼
   [RDV confirmé]   ← bascule auto par le cron + emails (parties + info@)
                      = état terminal du périmètre public (anti-boucle)
```

> `x_studio_suivi_expert` est une **sélection** comportant aussi d'autres statuts
> métier internes (« À confirmer (web) », etc.). Le module public n'agit que sur
> les valeurs ci-dessus ; tout autre statut sort de son périmètre.

---

## Qui déclenche quoi

| Déclencheur | Acteur | Effet |
|---|---|---|
| Soumission du formulaire | **Client** | `public_rdv_requests` → `pending`, upload pièces, email de confirmation. |
| Clic sur le lien de confirmation | **Client** | `pending → confirmed` (atomique) + **création devis Odoo** (`Demande reçue`). |
| Demande non confirmée | **Cron `cron`** (horaire) | Rappels +24 h / +48 h, expiration +72 h. |
| Saisie d'une date + passage « RDV proposé » | **Expert (dans Odoo)** | Rend le devis éligible au cron de validation. |
| Devis « RDV proposé », liens non envoyés | **Cron `validation-cron`** (/15 min) | Envoie un lien de validation à chaque partie « doit valider ». |
| Clic sur le lien de validation | **Partie** | Coche **sa** case Odoo `x_studio_partie_N_*_confirm`. |
| Coche manuelle de la case | **Expert (dans Odoo)** | Équivalent au clic — **la case Odoo fait foi**. |
| Toutes les parties requises cochées | **Cron `validation-cron`** | Bascule **« RDV confirmé »** + emails parties + copie `info@`. |

---

## Cartographie Odoo (champs réels)

> Convention Odoo des sélections : **la valeur technique stockée = le libellé**
> (accents inclus). Les constantes correspondantes sont figées dans
> `src/lib/public-rdv/validation.ts`.

### `sale.order` (le devis)

| Champ | Type | Rôle |
|---|---|---|
| `x_studio_suivi_expert` | sélection | Statut métier : `À confirmer (web)`, `Demande reçue`, `RDV proposé`, `RDV confirmé`, + autres statuts métier. |
| `x_studio_date_prochain_rendez_vous_1` | **CHAR** (texte libre) | Date/heure du RDV, **parsée** par `parseRdvDate` (voir plus bas). |
| `x_studio_partie_1_bailleurs_` | many2one → `res.partner` | Contact **partie 1 (bailleur)**. |
| `x_studio_partie_2_locataires_` | many2one → `res.partner` | Contact **partie 2 (locataire)**. |
| `x_studio_partie_1_bailleurs_confirm` | booléen | Case « partie 1 a confirmé ». |
| `x_studio_partie_2_locataires_confirm` | booléen | Case « partie 2 a confirmé ». |
| `x_studio_partie_1_bailleurs_confirm_le_1` | datetime | Horodatage de confirmation de la partie 1. |
| `x_studio_partie_2_locataires_confirm_le_1` | datetime | Horodatage de confirmation de la partie 2. |
| `x_studio_proposition_envoye` | booléen | Anti-renvoi : `true` une fois les liens de validation envoyés. |
| `x_studio_portail_client` | booléen | Marque le devis comme issu du portail/web. |
| `x_studio_expert_externe_` | many2one → `res.partner` | Expert affecté ; **son email = agenda Outlook cible** *(module Outlook)*. |
| `x_studio_adresse_de_mission` | many2one → `res.partner` | Adresse de mission (contact de type `delivery`). |
| `x_studio_type_de_client` | sélection | `Agent immobilier` (agence) ou `Bailleur` (sinon). |

Mapping `validation.ts` (`PARTY_FIELDS`) :

```ts
p1 → { link: x_studio_partie_1_bailleurs_,
       confirm: x_studio_partie_1_bailleurs_confirm,
       confirmAt: x_studio_partie_1_bailleurs_confirm_le_1 }
p2 → { link: x_studio_partie_2_locataires_,
       confirm: x_studio_partie_2_locataires_confirm,
       confirmAt: x_studio_partie_2_locataires_confirm_le_1 }
```

### `res.partner` (contact)

| Champ | Type | Rôle |
|---|---|---|
| `x_studio_rle_notification_rdv` | sélection | Rôle de la partie : `Doit valider` / `Informé seulement` / `Ne plus notifier`. |

**Rôle effectif** (`effectiveRole`) :

| Valeur du champ | Rôle effectif | Comporte |
|---|---|---|
| `Doit valider` **ou vide / inconnu** | `valide` | **Requise** pour la bascule ; reçoit un lien de validation. |
| `Informé seulement` | `informe` | **Non requise** ; reçoit un email d'information (sans lien). |
| `Ne plus notifier` | `rien` | **Non requise** ; **aucun email**. |

> ⚠️ **Le défaut public est « doit valider »** : une partie sans rôle renseigné
> est considérée comme **devant valider**. C'est volontaire (sécurité métier :
> on n'oublie pas une partie).

---

## Parsing de la date Odoo (`parseRdvDate`)

`x_studio_date_prochain_rendez_vous_1` est un **champ texte libre**. Le parseur
(`src/lib/parseRdvDate.ts`) est **défensif**, en 2 passes :

- **Date obligatoire** en tête, format `DD/MM/YYYY` (sinon `{ date: null, time:
  null }` → le devis est ignoré par le cron de validation).
- **Heure optionnelle** : première occurrence `(HH:MM[:SS]? à ...` → `HH:MM`.

Formats acceptés :

```
"DD/MM/YYYY de (HH:MM:SS à HH:MM:SS) (Europe/Brussels)"   (nominal)
"DD/MM/YYYY de (HH:MM à HH:MM) ..."                       (sans secondes)
"DD/MM/YYYY"                                              (date seule)
```

Le libellé affiché dans les emails est `"<date> à <heure>"` si l'heure est
présente, sinon `"<date>"`.

---

## Condition de bascule « RDV confirmé » (détail)

Dans la **Passe B** du cron de validation, pour un devis « RDV proposé » :

1. On liste les **parties présentes** (lien `x_studio_partie_N_*` non vide).
2. On lit le **rôle** de chacune (`res.partner.x_studio_rle_notification_rdv`).
3. **Parties requises** = présentes dont le rôle effectif est `valide` (« Doit
   valider » **ou** vide). Les `informe` et `rien` ne sont **pas** requises.
4. Si **toutes** les parties requises ont leur case `*_confirm = true` →
   **bascule** « RDV confirmé ».

> Cas limite : si **aucune** partie présente n'a le rôle `valide`, la condition
> « toutes les requises sont cochées » est trivialement vraie → bascule directe.

Au moment de la bascule :

- statut → `RDV confirmé` (**écrit avant** les emails : c'est le verrou
  anti-boucle) ;
- **email** à chaque partie présente avec email, sauf rôle `rien` (« Ne plus
  notifier ») ;
- **1 seul** email interne à `info@axis-experts.be`.
</content>
