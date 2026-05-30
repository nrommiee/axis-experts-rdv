# 04 — Automatismes & crons

Ce document détaille les **tâches planifiées** du module public, leurs
**fréquences**, leurs **garde-fous anti-boucle**, et le système de **sécurité**
(`CRON_SECRET`, bypass preview, dry-run).

---

## Planification (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/check-rdv-notifications", "schedule": "*/10 * * * *" },
    { "path": "/api/public/rdv/cron",              "schedule": "0 * * * *"   },
    { "path": "/api/public/rdv/validation-cron",   "schedule": "*/15 * * * *" }
  ]
}
```

| Cron | Fréquence | Périmètre |
|---|---|---|
| `/api/cron/check-rdv-notifications` | toutes les **10 min** | **Portail privé** — hors module public, **non modifié**. |
| `/api/public/rdv/cron` | **horaire** (`0 * * * *`) | Rappels + expiration des demandes publiques. |
| `/api/public/rdv/validation-cron` | toutes les **15 min** | Liens de validation + bascule « RDV confirmé ». |

> Les deux crons publics partent **exclusivement** de `public_rdv_requests` : ils
> n'ont **aucun** accès au portail privé, et réciproquement.

---

## Cron des rappels — `/api/public/rdv/cron` (horaire)

But : relancer puis expirer les demandes **`pending`** non confirmées.

| Palier | Condition | Effet |
|---|---|---|
| **1** | `created_at ≤ now()−24 h`, `reminders_sent = 0`, non expiré | `reminders_sent → 1`, **email de rappel 1**. |
| **2** | `created_at ≤ now()−48 h`, `reminders_sent = 1`, non expiré | `reminders_sent → 2`, **email de rappel 2** (dernier). |
| **expiration** | `expires_at ≤ now()` | `status → expired` (groupé, **aucun email**). |

**Garde-fous** :

- **Update conditionnel AVANT envoi** : pour chaque candidat, l'incrément de
  `reminders_sent` se fait via `UPDATE ... WHERE reminders_sent = N` ; **seul** le
  run qui « gagne » la ligne envoie l'email → pas de double envoi même si deux
  exécutions se chevauchent.
- **Compteur non rollback** si l'email échoue (anti-boucle de renvoi) : on
  loggue `emailFailures` seulement.
- **Expiration en dernier** et idempotente.
- Une demande **sans email** voit son compteur avancer sans tentative d'envoi.

Réponse (JSON) : `{ ok, env, dryRun, scanned, reminded1, reminded2, expired,
emailFailures }`.

---

## Cron de validation — `/api/public/rdv/validation-cron` (/15 min)

Source : les devis Odoo dont l'`odoo_order_id` provient d'une demande
**`confirmed`** dans `public_rdv_requests`. Un seul `read` Odoo charge les champs
nécessaires. On ne retient que les devis **« RDV proposé »** avec une **date
parsable**.

### Passe A — envoi des liens de validation

Cible : « RDV proposé » **ET** `x_studio_proposition_envoye = false`.

Pour chaque partie présente (`p1`, `p2`), selon le **rôle effectif** du contact :

| Rôle effectif | Action |
|---|---|
| `valide` (« Doit valider » ou vide) | **Upsert** d'un token dans `public_rdv_party_validations` (idempotent sur `(order, party)`) + **email avec lien** `/confirmer/partie/<token>`. |
| `informe` (« Informé seulement ») | **Email d'information** (sans lien). |
| `rien` (« Ne plus notifier ») | **Rien**. |
| *(quel que soit le rôle)* sans email | **Rien** (`skippedNoEmail`). |

À la fin, si une action a eu lieu, pose **`x_studio_proposition_envoye = true`**
(anti-renvoi). **Décision** : on marque même si un envoi a échoué (anti-spam ;
rattrapage manuel possible en décochant le booléen).

### Passe B — bascule « RDV confirmé »

Cible : tous les devis « RDV proposé ». Si **toutes les parties requises**
(rôle effectif `valide`) ont leur case `*_confirm = true` :

1. **Écrit** `x_studio_suivi_expert = "RDV confirmé"` (**avant** toute notif).
2. **Notifie** chaque partie présente avec email (sauf rôle `rien`).
3. Envoie **1 seul** email à `info@axis-experts.be`.

Réponse (JSON) : `{ ok, env, dryRun, scanned, ordersEligible, sentValidations,
sentInfos, skippedNoEmail, ordersFlagged, confirmed, wouldConfirm, waiting,
confirmNotified, internalNotified, emailFailures }`.

---

## Anti-boucle

Chaque cron a un **verrou d'idempotence** distinct, qui garantit qu'une action
n'est exécutée **qu'une fois** même en cas de chevauchement d'exécutions :

| Cron | Verrou | Mécanisme |
|---|---|---|
| Rappels | `reminders_sent` | Update conditionnel `WHERE reminders_sent = N` avant l'envoi. |
| Validation — Passe A | `x_studio_proposition_envoye` | Passe à `true` une fois les liens envoyés ; la passe ne re-cible que `false`. |
| Validation — Passe A (token) | `UNIQUE (odoo_order_id, party)` | Upsert idempotent : un seul token par partie. |
| Validation — Passe B | **le statut lui-même** | « RDV confirmé » **sort** le devis du périmètre → une seule bascule + une seule notif. |
| Confirmation demande | `status` + `odoo_order_id` | `UPDATE ... WHERE status='pending'` atomique ; `odoo_order_id` empêche un 2ᵉ devis. |

---

## Sécurité des crons

### `CRON_SECRET` (obligatoire en production)

Les deux crons publics exigent un en-tête **`Authorization: Bearer
<CRON_SECRET>`**. Sans secret valide → **`401 Unauthorized`**. Vercel injecte
automatiquement cet en-tête pour les crons déclarés dans `vercel.json`.

```
Authorization: Bearer <valeur de CRON_SECRET>
```

### Bypass de test — `?test=1` (**preview uniquement**)

Pour pouvoir appeler un cron en **environnement de preview** sans connaître le
secret (qui peut y être masqué), un **double verrou** autorise un bypass :

```ts
const isProd = process.env.VERCEL_ENV === "production";
const isPreviewTest = !isProd && searchParams.get("test") === "1";
```

- Le bypass n'est actif que si **`VERCEL_ENV !== "production"`** **ET**
  **`?test=1`**.
- **En production, le bypass est inatteignable** (le premier verrou est toujours
  faux) → le `Bearer CRON_SECRET` y reste **toujours** requis.

### Dry-run — `?dry=1` (preview-test uniquement)

Combiné au bypass de test (`?test=1&dry=1`), le mode **dry-run** :

- effectue le **raisonnement / les transitions de compteur** côté cron de
  rappels (pour valider la séquence `0→1→2→expired`),
- **n'envoie aucun email** et, pour le cron de validation, **n'écrit rien**
  (ni Odoo, ni table, ni email),
- est **ignoré hors preview-test** → **jamais actif en production**.

La réponse JSON expose `dryRun: true/false` et l'`env` courant pour lever toute
ambiguïté lors d'un test.

> Récapitulatif sécurité :
>
> | Contexte | `Bearer CRON_SECRET` | `?test=1` | `?dry=1` |
> |---|---|---|---|
> | **Production** | **requis** | ignoré (inatteignable) | ignoré |
> | **Preview** | accepté, ou bypass via `?test=1` | actif | actif si `?test=1` |
</content>
