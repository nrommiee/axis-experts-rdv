# AUDIT — Erreur Postgres 42P10 sur signup public

**Date** : 2026-05-22
**Branche** : `claude/epic-noether-rcwmp` (analyse faite après `git fetch` / `git checkout main`, HEAD `46e56fe`)
**Erreur** : `there is no unique or exclusion constraint matching the ON CONFLICT specification` (code `42P10`)
**Reproduction** : signup public `n.rommiee@gmail.com` / org « Bureau Nicolai » via lien d'invitation, flow « Créer votre compte »
**Première occurrence Postgres Logs** : 2026-05-22 06:34:37

---

## 1. Résumé exécutif

- L'erreur ne vient **PAS** de la table `invitations` mais de la table `portal_clients`. Le seul `ON CONFLICT` exécuté dans le flow signup est sur `portal_clients (user_id)`.
- L'origine est une **régression introduite il y a 2 jours** (commit `098fcfa`, 2026-05-20 13:12:57 UTC, "fix(admin): handle soft-deleted users on re-invitation"). Avant ce commit, le code faisait un `INSERT` simple, pas un `UPSERT`.
- En production, `portal_clients.user_id` **n'a pas de contrainte UNIQUE** : la seule déclaration `UNIQUE(user_id)` du repo se trouve dans `supabase/migration.sql` (fichier de bootstrap hors `supabase/migrations/`), dans un `CREATE TABLE IF NOT EXISTS` — donc jamais réappliqué sur la table existante.
- Le HARD DELETE effectué ce matin sur `invitations` / `invitations_legacy` est **étranger au bug**. C'est simplement le premier signup réel depuis le 20/05, donc la première exécution du code path régressé.

---

## 2. Diagnostic confirmé

### Fichier et ligne du code fautif

- **Fichier** : `src/app/api/auth/setup-account/route.ts`
- **Lignes** : 249–253

```ts
const { error: clientError } = await admin
  .from("portal_clients")
  .upsert(portalClientPayload, { onConflict: "user_id" })
  .select("id")
  .single();
```

`portalClientPayload` est construit aux lignes 229–247.

### Requête SQL reconstituée (PostgREST → SQL)

```sql
INSERT INTO public.portal_clients (
  user_id, odoo_partner_id, odoo_agency_id, client_type,
  nom_societe, nom_bailleur, email_bailleur, odoo_template_prefix,
  organization_id, logo_url, product_config,
  first_name, last_name,
  deleted_at, deleted_by, blocked_at, blocked_by
) VALUES (...)
ON CONFLICT (user_id) DO UPDATE SET ...
RETURNING id;
```

### Colonne(s) du `ON CONFLICT` attendue(s) par le code

- `user_id` (cible unique).

### Contrainte manquante en DB (production)

- **Aucune contrainte UNIQUE ni EXCLUSION sur `portal_clients.user_id`.**
- Il existe seulement un index **non-unique** : `idx_portal_clients_user_id` (déclaré ligne 32 de `supabase/migration.sql`). Un index non-unique ne satisfait pas un `ON CONFLICT`.
- La PK `portal_clients_pkey` est sur `id` (pas `user_id`), donc inutile pour ce `ON CONFLICT`.

### Pourquoi la contrainte n'a jamais été appliquée

`supabase/migration.sql` (singulier, **hors** du répertoire `supabase/migrations/` utilisé par la CLI Supabase) contient :

```sql
CREATE TABLE IF NOT EXISTS public.portal_clients (
  ...
  UNIQUE(user_id)
);
```

Or :

1. Ce fichier n'est pas dans la pipeline `supabase/migrations/` — il n'a probablement jamais été rejoué via `supabase db push` après le bootstrap initial.
2. Même s'il l'était, `IF NOT EXISTS` skip la création complète si la table existe, donc la contrainte inline `UNIQUE(user_id)` ne serait pas ajoutée à la table existante.
3. Aucune migration ultérieure dans `supabase/migrations/` n'ajoute `UNIQUE(user_id)` à `portal_clients` (vérifié par `grep -rn "portal_clients" supabase/migrations/`). Les migrations existantes n'ajoutent que des colonnes (`organization_id`, `first_name`, `last_name`, `deleted_at`, etc.) ou des policies RLS.

L'indice « `_pkey1` avec un `1` » mentionné par l'utilisateur sur `invitations_pkey1` est cohérent avec un drift historique : la migration `invitations_v2.sql` fait `ALTER TABLE invitations RENAME TO invitations_legacy;` puis `CREATE TABLE invitations (...)`. Le ré-emploi du nom `invitations` a forcé Postgres à choisir un nouveau nom de PK (`_pkey1`), parce que `invitations_pkey` était déjà pris par la legacy. Cela ne change rien au bug actuel, mais confirme le pattern « migrations historiques in-place sans nettoyage ».

---

## 3. Hypothèse « bug préexistant vs régression »

### Verdict : **RÉGRESSION** — bug introduit il y a 48h, jamais déclenché jusqu'à aujourd'hui

Preuves :

1. **`git log -S "onConflict" -- src/app/api/auth/setup-account/route.ts`** → un seul commit :
   - `098fcfa` — "fix(admin): handle soft-deleted users on re-invitation" — **2026-05-20 13:12:57 UTC**.

2. **Avant ce commit**, le code (introduit dans `19332a9` du 13/04/2026) était :
   ```ts
   const { error: clientError } = await admin.from("portal_clients").insert({ ... });
   ```
   Un `INSERT` n'a pas besoin de contrainte UNIQUE — c'est pour ça que le flow signup a fonctionné en prod depuis avril.

3. **Le diff `098fcfa`** (extrait, src/app/api/auth/setup-account/route.ts) :
   ```
   -    const { error: clientError } = await admin.from("portal_clients").insert({
   +    const { error: clientError } = await admin
   +      .from("portal_clients")
   +      .upsert(portalClientPayload, { onConflict: "user_id" })
   ```
   Le `upsert` a été ajouté pour gérer la **réactivation des comptes soft-deleted** (clear `deleted_at`, repointer `organization_id`). Le commit suppose que `user_id` est UNIQUE en DB — cette précondition n'a pas été vérifiée.

4. **Le HARD DELETE de ce matin** sur `invitations` / `invitations_legacy` est **non-causal** : un DELETE ne supprime aucune contrainte. Il a juste précédé temporellement le premier signup réel post-`098fcfa`. La séquence est : déploiement `098fcfa` (20/05) → bug latent → premier signup test (22/05 06:34) → erreur.

5. **Pourquoi le bug n'a pas explosé entre le 20/05 et le 22/05** : très probablement aucun signup public n'a été exécuté pendant ces 48h, ou bien les tentatives ont échoué silencieusement plus tôt dans le flow (token invalide, etc.) avant d'atteindre la ligne 251. Le mail testé `n.rommiee@gmail.com` est celui de l'utilisateur — c'est de toute évidence une session de dogfood.

6. **Aucun test (unit / integration / e2e) ne couvre `setup-account`** — `grep -rn "setup-account" --include="*.test.ts" --include="*.spec.ts"` retourne 0 résultat. C'est pourquoi le commit `098fcfa` est passé sans alerte.

### Sur l'hypothèse initiale de l'utilisateur

> « Contraintes UNIQUE manquantes suspectées : `(email, organization_id)` ou `email` seul » sur `invitations`.

→ **Infirmée.** Le code de `setup-account` ne fait **aucun** `ON CONFLICT` sur `invitations` : il fait un `SELECT` par `token` (ligne 100–106) puis un `UPDATE … SET used_at = …` par `id` (ligne 267–270). De même, `admin/invite/route.ts:130-140` fait un `INSERT` simple sur `invitations` sans `ON CONFLICT`. La contrainte manquante est sur `portal_clients.user_id`, pas sur `invitations`.

---

## 4. Cartographie d'impact

### Code paths qui font `ON CONFLICT` / `upsert` dans le repo

| Fichier | Ligne | Table | `onConflict` | Statut |
|---|---|---|---|---|
| `src/app/api/auth/setup-account/route.ts` | 251 | `portal_clients` | `user_id` | **❌ FAUTIF** |
| `src/app/api/admin/organizations/[id]/custom-fields/route.ts` | 125 | `organization_custom_fields` | `organization_id,custom_field_id` | ✅ UNIQUE existe (`0010_custom_fields.sql:29`) |
| `src/app/api/rdv-custom-values/route.ts` | 141 | `rdv_custom_values` | `organization_id,custom_field_id,order_ref` | ✅ UNIQUE existe (`0010_custom_fields.sql:42`) |
| `src/app/api/cron/check-rdv-notifications/route.ts` | 217, 383 | (cron) | — | hors flow signup |
| `src/app/api/messages/read/route.ts` | 28 | (messages) | — | hors flow signup |

### Autres flows qui touchent `portal_clients`

Risque annexe sur les **mêmes lignes upsertées** :
- RLS UPDATE policy (`20260417104648_portal_clients_update_policy.sql`) : `USING (auth.uid() = user_id)` — Ok, ne dépend pas de l'unicité.
- Soft-delete / blocking (`20260416120000_user_soft_delete_and_blocking.sql`) : `UPDATE portal_clients SET deleted_at = ...` par `id`. Ok.
- Aucun autre code ne fait de `ON CONFLICT` sur `portal_clients` → l'ajout d'un `UNIQUE(user_id)` n'aura **pas** d'effet secondaire fonctionnel ailleurs, à condition qu'il n'y ait pas déjà de doublons en DB (à vérifier — voir checklist §7).

### Risques de données

- **Doublons potentiels en prod** : si la contrainte UNIQUE n'a jamais existé, il est possible que des doublons `(user_id)` existent dans `portal_clients` (un même user appartenant à 2 orgs après bascule, etc.). Ajouter `UNIQUE(user_id)` sans vérifier provoquerait l'échec de la migration. À auditer **avant** d'ajouter la contrainte.
- **`invitations_legacy`** : table conservée pour référence historique. Aucun code applicatif ne la lit (`grep -rn "invitations_legacy" src/` → 0 résultat). Pas d'impact sur le bug.

---

## 5. Options de fix proposées (NE PAS IMPLÉMENTER ICI)

### Option A — Ajouter la contrainte UNIQUE manquante en DB **(recommandée)**

- **DB** : migration `ALTER TABLE public.portal_clients ADD CONSTRAINT portal_clients_user_id_key UNIQUE (user_id);`
- **Pré-requis** : vérifier qu'aucun doublon n'existe (`SELECT user_id, COUNT(*) FROM portal_clients GROUP BY user_id HAVING COUNT(*) > 1;`).
- **Code** : aucune modification.
- **Risques** : si doublons → migration échoue → besoin de cleanup data préalable.
- **Effort** : ~10 min (vérif + migration + push).
- **Avantage** : aligne la prod sur la schéma déclaré dans `supabase/migration.sql`, fix structurel.

### Option B — Faire le upsert manuellement en deux étapes (SELECT puis UPDATE/INSERT)

- **Code** : remplacer le `upsert` ligne 249–253 par :
  1. `SELECT id FROM portal_clients WHERE user_id = ?`
  2. Si trouvé → `UPDATE … WHERE user_id = ?`
  3. Sinon → `INSERT …`
- **DB** : aucune modif.
- **Risques** : pas atomique (race condition en théorie, mais le user vient juste d'être créé/réactivé donc négligeable). Code plus verbeux. Ne fixe pas la cause racine (drift DB).
- **Effort** : ~15 min.

### Option C — Upsert sur `id` au lieu de `user_id`

- **Code** : pré-générer un `id` UUID applicatif ou faire un SELECT préalable pour récupérer l'id existant, puis `.upsert(..., { onConflict: "id" })`.
- **Risques** : revient quasi à l'option B en plus tordu. Non recommandé.
- **Effort** : ~20 min.

### Option D — Revert temporaire de `098fcfa` (rollback partiel)

- **Code** : remettre `INSERT` au lieu de `upsert`, et gérer le cas `priorClient` via `UPDATE` explicite si `priorClient` existait.
- **Risques** : régression de la fonctionnalité « réactivation soft-deleted » (PR #18 → commit `098fcfa`). Peut casser le cas où n.rommiee@gmail.com aurait justement un priorClient.
- **Effort** : ~20 min.

---

## 6. Recommandation finale — fix avant présentation

**Option A** : ajouter `UNIQUE(user_id)` sur `portal_clients` via migration Supabase.

Justification :
- Cause racine, pas un contournement.
- 1 ligne SQL, aucune modif de code applicatif (= aucun risque de régression côté Next.js).
- L'index `idx_portal_clients_user_id` existant peut être remplacé par/coexister avec la contrainte (la contrainte UNIQUE crée son propre index unique).
- Aligne la prod avec ce que `supabase/migration.sql` déclarait dès le début.
- Si aucun doublon → fix en ~5 min. Si doublons → option A reste préférable mais nécessite 10–15 min de cleanup data.

**Pas Option D** : on perdrait la feature réactivation soft-deleted qui est en prod depuis 2 jours.

---

## 7. Checklist AVANT lancement du fix (session suivante)

Pré-fix — DB read-only via MCP Supabase `psbcebctdkxuqnoxgwrs` :

- [ ] `SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.portal_clients'::regclass;` → confirmer qu'il n'y a effectivement **aucune** contrainte UNIQUE/EXCLUSION sur `user_id`.
- [ ] `SELECT user_id, COUNT(*) AS n FROM public.portal_clients GROUP BY user_id HAVING COUNT(*) > 1;` → **doit retourner 0 lignes**. Si non : décider de la stratégie de dedup (garder la plus récente ? merger les data ?) avant la migration.
- [ ] `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'portal_clients';` → confirmer la présence de `idx_portal_clients_user_id` (non-unique) et décider si on le drop après création de la contrainte UNIQUE (la contrainte crée déjà son index unique).
- [ ] Vérifier que `n.rommiee@gmail.com` n'a pas laissé un `portal_clients` orphelin du test échoué de 06:34 (peut bloquer la réactivation).
- [ ] Vérifier qu'aucun `auth.users` orphelin n'a été créé par la tentative échouée (`admin.auth.admin.createUser` ligne 169 ou 209 réussit avant que l'upsert plante ; ça crée un user "fantôme").

Migration :

- [ ] Créer `supabase/migrations/20260522XXXXXX_portal_clients_user_id_unique.sql` avec :
  ```sql
  ALTER TABLE public.portal_clients
    ADD CONSTRAINT portal_clients_user_id_key UNIQUE (user_id);
  ```
- [ ] Décision : drop `idx_portal_clients_user_id` (redondant avec l'index UNIQUE auto-créé) ou pas. **Recommandé : pas dans la même migration**, pour limiter le blast radius pré-démo.
- [ ] `supabase db push` (en validation manuelle, pas via CI auto si évitable).

Post-fix — validation E2E :

- [ ] Retester le signup `n.rommiee@gmail.com` / Bureau Nicolai depuis le lien d'invitation existant (vérifier d'abord que le `used_at` n'a pas été stamped — sinon régénérer une invitation).
- [ ] Vérifier l'entrée `portal_clients` créée : `organization_id`, `first_name`, `last_name`, `email_bailleur`, `deleted_at = null`.
- [ ] Vérifier l'auto-login après création (étape 6 du route handler).
- [ ] Ajouter (post-démo, pas dans le fix express) un test d'intégration sur `/api/auth/setup-account` couvrant a) signup fresh, b) signup avec priorClient soft-deleted, pour éviter qu'une régression identique repasse.

Documentation :

- [ ] Ajouter une note dans `supabase/migration.sql` (ou CLAUDE.md) que ce fichier est **historique** et que toute modif de schéma doit passer par `supabase/migrations/`.
- [ ] Considérer un audit large : `grep -rn "CREATE TABLE IF NOT EXISTS" supabase/migration.sql` pour repérer d'autres contraintes potentiellement non-appliquées en prod (drift général).
