# PLAN.md — Fondations back de la page publique de prise de RDV

> **Étape 1 / Fondations back uniquement.** Ce document est **un plan**, pas du code.
> Aucune migration n'est appliquée, aucun fichier existant n'est modifié, rien n'est
> lancé. La page publique elle-même (UI + route API) **n'est pas** l'objet de cette
> étape — seules les deux fondations le sont :
> **(1)** le *tampon* de demandes en attente, **(2)** l'exemption d'accès public.
>
> Repo **EN PRODUCTION**. Toute action ci-dessous est conçue pour être **purement
> additive** et **sans impact** sur le portail privé. Aucune valeur de secret n'est
> reproduite ici.
>
> Référence d'isolation relue : `PUBLIC_RDV_PLAN.md` (branche
> `claude/relaxed-goldberg-0Fzjd`). Le présent document en applique les principes aux
> deux fondations back.

---

## 0. Méthode d'analyse (lecture seule)

Fichiers réellement inspectés pour produire ce plan :

- `src/proxy.ts` — point d'entrée middleware + `matcher`.
- `src/lib/supabase/middleware.ts` — `updateSession()`, liste blanche `!user`,
  `isCguExemptedPath()`, gate CGU, routages admin / org / dactylo.
- `supabase/rdv_drafts.sql` + `supabase/migrations/20260416080847_rdv_drafts_organization.sql`
  — table `rdv_drafts` et son évolution.
- `supabase/migrations/20260526120000_phase0_rgpd_minimal.sql` — tables
  `user_consents` et `audit_log` (modèle de référence pour une table « server-only »).
- Inventaire des autres migrations (`supabase/migrations/*.sql`) pour confirmer
  qu'aucune table « demande publique en attente » n'existe déjà.

---

## 1. TAMPON SUPABASE — constat

### 1.1 `rdv_drafts` est-elle réutilisable ? → **NON**

Définition actuelle (`supabase/rdv_drafts.sql`) :

```sql
CREATE TABLE rdv_drafts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
ALTER TABLE rdv_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own drafts"
  ON rdv_drafts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

Puis, migration `20260416080847_rdv_drafts_organization.sql` : ajout de
`organization_id` / `created_by` (FK `organizations` / `auth.users`) et **remplacement**
des policies par 4 policies couplées à `auth.uid()` **et** à `portal_clients`
(SELECT/INSERT/UPDATE/DELETE « membres de la même org »).

**Pourquoi `rdv_drafts` est inadaptée et risquée pour le public :**

1. **Couplage fort à `auth.users`** : `user_id UUID NOT NULL REFERENCES auth.users(id)`.
   Un demandeur public **n'a pas de compte** → impossible d'insérer une ligne sans
   inventer un faux `user_id` (interdit) ou rendre la colonne nullable (= **ALTER**
   sur une table de prod, formellement exclu).
2. **RLS liée aux comptes connectés** : toutes les policies reposent sur `auth.uid()`
   et sur l'appartenance à `portal_clients`. Inopérantes hors session.
3. **Aucun mécanisme `token` ni `expiration`** : la table n'a ni jeton de
   confirmation ni date d'expiration — les deux besoins centraux du tampon public.
4. **Sémantique différente** : `rdv_drafts` = *brouillons éditables par un client
   connecté de son organisation*. Le tampon public = *demande anonyme en attente de
   confirmation par e-mail*. Mélanger les deux pollue le portail privé (lectures org,
   `/brouillons`, etc.) et crée un risque de fuite inter-tenant.

> **Conclusion §1.1 :** réutiliser `rdv_drafts` exigerait un `ALTER`/`DROP POLICY`
> sur une table de prod du portail privé → **exclu**. On crée une **table neuve**.

### 1.2 Aucune autre table existante ne convient

Tables présentes (migrations inspectées) : `portal_clients`, `organizations`,
`invitations`, `product_catalog`, `custom_fields`, `organization_custom_fields`,
`rdv_custom_values`, `rdv_drafts`, `user_consents`, `audit_log`, et tables liées
notifications/dactylo. **Aucune** ne stocke une « demande publique en attente avec
token + expiration sans couplage `auth.users` ». Le précédent le plus proche en
*forme* (mais pas en *fonction*) est `audit_log` : RLS activée, **aucune policy
`anon`/`authenticated`**, écriture **uniquement** côté serveur en `service_role`.
C'est **ce modèle de sécurité** que la nouvelle table reprend.

### 1.3 Table NEUVE proposée — `public_rdv_requests` (CREATE TABLE uniquement)

Fichier proposé (à NE PAS exécuter à cette étape) :
`supabase/migrations/20260530120000_public_rdv_requests.sql`

```sql
-- À EXÉCUTER MANUELLEMENT EN SQL EDITOR SUPABASE (après validation)
-- Fondation publique RDV — tampon des demandes en attente de confirmation
-- Date : 2026-05-30
--
-- ISOLATION : aucune FK vers auth.users, aucune dépendance à portal_clients /
-- organizations, RLS activée, AUCUNE policy anon/authenticated. L'accès se fait
-- EXCLUSIVEMENT côté serveur via la clé service_role (qui contourne la RLS),
-- exactement comme public.audit_log. "Deny by default" pour tout le reste.
-- AUCUN ALTER / DROP sur une table existante.

CREATE TABLE IF NOT EXISTS public.public_rdv_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Jeton opaque transmis dans le lien de confirmation e-mail.
  token         uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Cycle de vie de la demande : pending -> confirmed | expired | cancelled.
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),

  -- Charge utile du formulaire public (champs libres, validés côté serveur).
  form_data     jsonb NOT NULL,

  -- Coordonnées dénormalisées pour l'envoi d'e-mail et le suivi.
  email         text,
  phone         text,

  -- Expiration du tampon : au-delà, la demande non confirmée est caduque.
  expires_at    timestamptz NOT NULL,
  confirmed_at  timestamptz,

  -- Renseigné UNIQUEMENT après confirmation, quand le sale.order Odoo est créé.
  odoo_order_id bigint,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Recherche par jeton (lien de confirmation) — unique.
CREATE UNIQUE INDEX IF NOT EXISTS public_rdv_requests_token_idx
  ON public.public_rdv_requests (token);

-- Balayage des demandes expirées (purge / cron ultérieur).
CREATE INDEX IF NOT EXISTS public_rdv_requests_status_expires_idx
  ON public.public_rdv_requests (status, expires_at);

-- RLS activée, "deny by default".
ALTER TABLE public.public_rdv_requests ENABLE ROW LEVEL SECURITY;

-- AUCUNE policy anon / authenticated. Policy service_role explicite, calquée sur
-- public.audit_log (le service_role contourne déjà la RLS ; policy explicite =
-- intention documentée). Le portail privé n'a aucun accès à cette table.
CREATE POLICY "service_role_can_do_anything_public_rdv"
  ON public.public_rdv_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.public_rdv_requests IS
  'Tampon des demandes de RDV publiques (sans login) en attente de confirmation. '
  'Aucun couplage au portail privé. Accès server-only (service_role). '
  'Conservation : purge des demandes expirées/non confirmées à définir en étape ultérieure.';
```

**Garanties d'isolation de cette table :**

- **Pas de FK vers `auth.users`** ni vers `organizations` / `portal_clients`.
- **RLS activée** + **aucune** policy `anon`/`authenticated` → invisible à toute
  session du portail privé et à tout client anonyme direct.
- Écriture/lecture **uniquement** par la route API serveur en `service_role`
  (à implémenter à l'étape suivante, hors de ce plan).
- `token` + `expires_at` natifs → support direct du flux « confirmer par e-mail ».
- `CREATE TABLE IF NOT EXISTS` + `CREATE ... IF NOT EXISTS` → **idempotent**,
  **aucun** `ALTER`/`DROP` sur l'existant.

> Note : `updated_at` n'est pas auto-mis à jour ici (pas de trigger) pour rester
> minimal et n'introduire aucun objet partagé ; la route API serveur le posera
> explicitement. À décider à l'étape d'implémentation, pas maintenant.

---

## 2. EXEMPTION D'ACCÈS PUBLIC — diff proposé pour `src/proxy.ts`

### 2.1 État actuel (verbatim)

`src/proxy.ts` :

```ts
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Skip Supabase middleware entirely for reset-password to preserve the
  // PKCE ?code= query param needed by exchangeCodeForSession() on the client.
  if (request.nextUrl.pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  // Skip Supabase middleware for /setup-account so the token query
  // param passes through and the page remains publicly accessible.
  if (request.nextUrl.pathname.startsWith("/setup-account")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Le mécanisme d'exemption existe déjà : un `if (pathname.startsWith(...)) return
NextResponse.next();` **en tête** de `proxy()` court-circuite entièrement
`updateSession` (donc auth **et** gate CGU). On réutilise **exactement** ce motif.

### 2.2 Diff proposé (NON appliqué)

Emplacement exact : **tout en haut** du corps de `proxy()`, **avant** le bloc
`/reset-password` (ligne 7 actuelle), de façon à sortir le plus tôt possible.

```diff
--- a/src/proxy.ts
+++ b/src/proxy.ts
@@
 export async function proxy(request: NextRequest) {
+  // Page publique de prise de RDV (sans login) — totalement isolée du portail
+  // privé. On court-circuite le middleware Supabase (auth + gate CGU) pour ces
+  // préfixes uniquement. Purement additif : aucun chemin privé ne matche ces
+  // préfixes, donc le comportement des routes privées est inchangé.
+  if (
+    request.nextUrl.pathname.startsWith("/prendre-rdv") ||
+    request.nextUrl.pathname.startsWith("/confirmer") ||
+    request.nextUrl.pathname.startsWith("/api/public/")
+  ) {
+    return NextResponse.next();
+  }
+
   // Skip Supabase middleware entirely for reset-password to preserve the
   // PKCE ?code= query param needed by exchangeCodeForSession() on the client.
   if (request.nextUrl.pathname.startsWith("/reset-password")) {
     return NextResponse.next();
   }
```

### 2.3 `updateSession` doit-il aussi être modifié ? → **NON (recommandé)**

Avec l'exemption (2.2) **en tête de `proxy()`**, l'exécution **n'atteint jamais**
`updateSession` pour `/prendre-rdv`, `/confirmer`, `/api/public/`. Il est donc
**inutile** (et non souhaitable) de toucher à `src/lib/supabase/middleware.ts` :

- ni à la liste blanche `!user` (lignes 56-66) ;
- ni à `isCguExemptedPath()` (lignes 8-20) ;
- ni au gate CGU, ni aux routages admin/org/dactylo.

Une seule source de vérité (proxy.ts) = pas de duplication, pas de divergence.

> **Filet de sécurité optionnel (non retenu par défaut, mentionné pour info) :** si
> l'on voulait une défense en profondeur au cas où l'exemption proxy serait retirée
> par erreur, on pourrait ajouter les mêmes préfixes à la liste blanche `!user` et à
> `isCguExemptedPath()`. **Non nécessaire** tant que (2.2) est en place. À ne PAS
> appliquer à cette étape.

### 2.4 `matcher` — **NE PAS TOUCHER**

Le `matcher` (lignes 20-24) n'exclut que les assets statiques ; il **inclut déjà**
`/prendre-rdv`, `/confirmer` et `/api/public/*`. Le point de contrôle est donc bien
l'exemption (2.2). **Modifier le `matcher` est exclu** (risque d'effet de bord sur
d'autres routes privées). On ne le change pas.

> ⚠️ Choix des chemins : `/prendre-rdv`, `/confirmer`, `/api/public/` n'entrent en
> collision avec **aucune** route existante (`src/app/`), ni avec aucune entrée des
> listes blanches du middleware. (À noter : `PUBLIC_RDV_PLAN.md` proposait
> `/prendre-rdv/merci` plutôt qu'un préfixe `/confirmer` séparé. La consigne de cette
> étape impose explicitement `/prendre-rdv`, `/confirmer` et `/api/public/` : c'est ce
> que liste le diff ci-dessus. Le choix UI final (`/confirmer` vs `/prendre-rdv/merci`)
> sera tranché à l'étape page, sans impact sur la sûreté de l'exemption.)

---

## 3. Ce que je vais créer (étape ultérieure, après validation)

> Rien de ceci n'est créé maintenant. Cette étape ne produit **que ce PLAN.md**.

- **Nouvelle migration** `supabase/migrations/20260530120000_public_rdv_requests.sql`
  (CREATE TABLE + index + RLS + policy `service_role`, tel que §1.3). À exécuter
  **manuellement** en SQL Editor Supabase, **après** ta validation.
- **Exemption** dans `src/proxy.ts` (diff §2.2), purement additive.
- (Étapes suivantes, hors de ce périmètre « fondations ») : page publique
  `src/app/prendre-rdv/`, page/route de confirmation, route API
  `src/app/api/public/rdv/route.ts` (validation, rate-limit, `service_role`,
  intégration Odoo/e-mail). **Non couvert ici.**

## 4. Ce que je ne touche pas

- **Aucune** table existante (`rdv_drafts`, `portal_clients`, `organizations`,
  `user_consents`, `audit_log`, `invitations`, `product_catalog`, …) : pas
  d'`ALTER`, pas de `DROP`, pas de modification de policy.
- **`src/lib/supabase/middleware.ts`** : `updateSession`, liste blanche `!user`,
  `isCguExemptedPath`, gate CGU, routages admin/org/dactylo — **inchangés**.
- Le **`matcher`** de `src/proxy.ts` — **inchangé**.
- Les flux privés `src/app/demande/page.tsx` et `src/app/api/submit-rdv/route.ts`.
- Les libs partagées (`odoo.ts`, `email.ts`, etc.) : on les **appellera** plus tard,
  on ne les **modifie pas**.
- Aucune migration appliquée, aucune commande lancée, aucun secret écrit.

## 5. Risques pour la prod et comment ils sont évités

| Risque | Évité par |
|---|---|
| Casser l'auth ou le gate CGU du portail privé | Exemption **additive** en tête de `proxy()` ; les chemins privés ne matchent pas les préfixes publics → flux privé strictement inchangé. `updateSession` non modifié. |
| Exposer/altérer des données du portail privé via la nouvelle table | Table **neuve**, **sans** FK `auth.users`/`portal_clients`/`organizations` ; RLS activée + **aucune** policy `anon` ; accès **server-only** `service_role` (modèle `audit_log`). |
| Modifier par erreur une table de prod | Migration **CREATE TABLE … IF NOT EXISTS** uniquement, **zéro** `ALTER`/`DROP` ; exécution **manuelle** après validation. |
| Ouvrir trop large via le middleware | `matcher` **non modifié** ; exemption restreinte à 3 préfixes dédiés, inexistants ailleurs. |
| Fuite inter-tenant si on réutilisait `rdv_drafts` | On **ne réutilise pas** `rdv_drafts` ; séparation physique des données publiques. |
| Migration jouée automatiquement contre la prod | Convention du repo respectée (« À EXÉCUTER MANUELLEMENT EN SQL EDITOR ») ; rien n'est `push` côté base à cette étape. |
| Collision de routes | `/prendre-rdv`, `/confirmer`, `/api/public/` absents de `src/app/` et des listes du middleware. |

---

## 6. STOP — attente de validation

Conformément à la consigne : **analyse + plan uniquement**. Je m'arrête ici.
Aucun code n'est écrit, aucune migration n'est appliquée. J'attends ta validation
avant de passer à l'implémentation des fondations (migration + exemption proxy).
