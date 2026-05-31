# 05 — Configuration

Ce document liste les **variables d'environnement** (par leur **nom** — jamais
leur valeur), la configuration **Microsoft Azure / Graph** du module Outlook, et
la procédure d'application des **migrations SQL**.

> ⚠️ **Aucun secret, token, mot de passe ou valeur réelle ne doit figurer ici ni
> dans le dépôt.** On documente les **noms** des variables ; les valeurs vivent
> uniquement dans les *Environment Variables* Vercel et dans les secrets
> Microsoft/Supabase.
>
> ⚠️ **Après tout changement de variable d'environnement sur Vercel, il faut
> redéployer** : un déploiement antérieur à l'ajout ne « voit » pas la nouvelle
> variable.

---

## Variables d'environnement

### Cœur de l'application (présentes dans `main`)

| Nom | Rôle | Exposée client ? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canonique du site (ex. `https://rdv.axis-experts.be`). **Base des liens emails** (confirmation, validation). À défaut, le code retombe sur l'origin de la requête. | Oui (`NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase. | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (portail). | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé **`service_role`** : accès server-only aux tables publiques (contourne la RLS). **Strictement secrète.** | **Non** |
| `ODOO_URL` | URL de l'instance Odoo (prod). | Non |
| `ODOO_DB` | Nom de la base Odoo. | Non |
| `ODOO_USER` | Utilisateur Odoo (XML-RPC). | Non |
| `ODOO_API_KEY` | Clé API Odoo. **Secrète.** | Non |
| `RESEND_API_KEY` | Clé API Resend (envoi d'emails). **Secrète.** | Non |
| `CRON_SECRET` | Jeton **Bearer** exigé par les crons publics. **Secret.** | Non |
| `ADMIN_EMAILS` | Liste des emails administrateurs (portail). | Non |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clé Google Maps (héritée ; la carte du formulaire public a été retirée). | Oui |
| `VERCEL_ENV` | Injectée par Vercel (`production` / `preview` / `development`). Pilote le **double verrou** des crons. | — (plateforme) |
| `NODE_ENV` | Injectée par le runtime. Active la blocklist de domaines email en prod. | — |

> Détails d'usage des emails et adresses (`noreply@axis-experts.be`,
> `info@axis-experts.be`) : voir [`06-depannage.md`](./06-depannage.md) et
> `src/lib/email.ts`.

### Module Outlook *(branche `claude/outlook-sync`, non mergé)*

| Nom | Rôle |
|---|---|
| `MS_TENANT_ID` | Identifiant du tenant Microsoft Entra (Azure AD). |
| `MS_CLIENT_ID` | Identifiant de l'application Entra (app-only). |
| `MS_CLIENT_SECRET` | **Valeur** (pas l'ID) du secret client de l'application. **Secret.** |

> Voir le piège **AADSTS7000215** dans [`06-depannage.md`](./06-depannage.md) :
> il faut copier la **Value** du secret, **pas** son *Secret ID*.

---

## Microsoft Azure / Graph (module Outlook)

Configuration côté **Microsoft Entra (Azure AD)** + **Exchange Online** pour la
synchro app-only (client credentials, **sans utilisateur connecté**) :

1. **Application Entra** enregistrée → fournit `MS_TENANT_ID`, `MS_CLIENT_ID`, et
   un **client secret** (`MS_CLIENT_SECRET` = la *Value*).
2. **Permission applicative** Microsoft Graph **`Calendars.ReadWrite`**
   (app-only), avec **consentement administrateur** accordé.
3. **Application Access Policy** `RestrictAccess` (Exchange Online PowerShell) qui
   **limite l'application** au seul groupe de portée **`AxisRDVOutlookScope`**
   (groupe *mail-enabled security*). L'app ne peut donc écrire **que** dans les
   agendas des membres de ce groupe — pas dans toute l'organisation.
4. **Membres du groupe** = les experts autorisés (voir
   [`03-operations.md`](./03-operations.md#e-ajouter-un-expert-module-outlook)).

Vérification de la policy :

```powershell
Test-ApplicationAccessPolicy -Identity "prenom.nom@axis-experts.be" -AppId <MS_CLIENT_ID>
# AccessCheckResult attendu : Granted
```

> Même quand le résultat est **`Granted`**, la **propagation côté Microsoft peut
> prendre jusqu'à 24 h** : les premiers appels peuvent renvoyer
> `ErrorAccessDenied` sans que ce soit un bug. Voir
> [`06-depannage.md`](./06-depannage.md).

---

## Migrations SQL

> **Toutes les migrations sont exécutées MANUELLEMENT** dans le **SQL Editor de
> Supabase**, après revue. Elles sont **additives et idempotentes** (`CREATE
> TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) et ne font **aucun
> `ALTER`/`DROP`** sur une table existante.

Migrations du module public (`supabase/migrations/`) :

| Fichier | Effet |
|---|---|
| `20260530120000_public_rdv_requests.sql` | Crée `public_rdv_requests` (+ index token / `(status, expires_at)`, RLS `service_role` only). |
| `20260530140000_public_rdv_documents.sql` | Ajoute les colonnes `documents` (jsonb) et `upload_failed` (bool). |
| `20260530160000_public_rdv_party_validations.sql` | Crée `public_rdv_party_validations` (+ contrainte `UNIQUE (odoo_order_id, party)`, index, RLS `service_role` only). |

Procédure :

1. Ouvrir **Supabase → SQL Editor**.
2. Coller le contenu de la migration (dans l'ordre chronologique des noms).
3. Exécuter. Un message **« Success. No rows returned »** est **normal** pour un
   `CREATE` / `ALTER` / `UPDATE` (voir [`06-depannage.md`](./06-depannage.md)).

Côté **Storage** : créer le bucket **privé** `rdv-documents` (s'il n'existe pas).
Les objets publics y sont rangés sous le préfixe `public/<requestId>/`.

> Le module Outlook ajoute par ailleurs la table `outlook_calendar_sync` (livrée
> avec sa branche, non encore mergée) — même principe : RLS `service_role` only,
> migration manuelle.
</content>
