# PUBLIC_RDV_PLAN.md

> Analyse **en lecture seule** du repo `axis-experts-rdv` (en production) en vue
> d'ajouter une **page publique de prise de RDV** (sans login), **totalement
> isolée** du portail privé. Aucune valeur de secret n'est reproduite ici.
> Aucun fichier existant n'a été modifié pour produire ce document.

---

## 1. `/demande` et `/api/submit-rdv` sont-elles PUBLIQUES ou protégées ?

**Les deux sont PROTÉGÉES (login obligatoire + gate CGU).** Double verrou :

### a) Verrou middleware (`src/proxy.ts` → `updateSession`)

- `src/proxy.ts` enregistre un middleware dont le `matcher` couvre **toutes** les
  routes sauf les assets statiques (`_next/static`, `_next/image`, `favicon.ico`,
  images `.svg/.png/.jpg/...`). `/demande` et `/api/submit-rdv` sont donc
  interceptées.
- `proxy.ts` ne fait d'exemption (`NextResponse.next()`) **que** pour
  `/reset-password` et `/setup-account`. Tout le reste passe par `updateSession`.
- Dans `src/lib/supabase/middleware.ts` → `updateSession()` :
  - Si `!user` et que le chemin n'est pas dans la liste blanche
    (`/login`, `/setup-account`, `/auth/callback`, `/api/auth/validate-token`,
    `/api/auth/setup-account`, `/api/cron/`, `/api/health`, `/`), alors :
    - route `/api/*` → réponse **401 `{ error: "Unauthorized" }`** ;
    - page HTML → **redirection 302 vers `/login`**.
  - `/demande` et `/api/submit-rdv` **ne sont PAS** dans cette liste blanche → un
    visiteur anonyme est donc bloqué.
  - S'ajoute le **gate CGU** : tout utilisateur connecté sans consentement
    `user_consents` (version `v1.0`) est renvoyé vers `/cgu-required`
    (ou 403 `code: "cgu_required"` côté API). `isCguExemptedPath()` n'exempte ni
    `/demande` ni `/api/submit-rdv`.

### b) Verrou applicatif (dans la route elle-même)

- `src/app/api/submit-rdv/route.ts` revérifie l'auth :
  `const { data: { user } } = await supabase.auth.getUser();` puis
  `if (!user) return 401 "Non authentifié"`. Elle exige aussi une ligne
  `portal_clients` pour l'utilisateur (`odoo_partner_id`, `client_type`,
  `organization_id`...). Sans compte portail configuré → 400.
- `src/app/demande/page.tsx` est un composant `"use client"` qui s'appuie sur la
  session Supabase (`createClient()` client) et sur `portal_clients`.

**Conclusion §1 :** `/demande` et `/api/submit-rdv` sont **strictement privées**
et **fortement couplées** à `auth.users` + `portal_clients` + Odoo template/agency.
**Il ne faut ni les réutiliser, ni les modifier, ni les « ouvrir »** pour la
feature publique. La page publique doit avoir **ses propres** page + route API.

---

## 2. Chemins LIBRES (sans collision) pour la feature publique

### Chemins déjà utilisés (à NE PAS réutiliser)

Pages : `/` · `/login` · `/dashboard` · `/demande` · `/brouillons` · `/profil` ·
`/confirmation` · `/dactylo` · `/admin/*` · `/setup-account` · `/reset-password` ·
`/cgu-required` · `/account-suspended` · `/auth/callback`.

API : `/api/admin/*` · `/api/agency/*` · `/api/auth/*` · `/api/cgu/*` ·
`/api/cron/*` · `/api/custom-fields` · `/api/dactylo/*` · `/api/drafts/*` ·
`/api/health` · `/api/messages/*` · `/api/odoo/*` · `/api/profile` ·
`/api/rdv-custom-values` · `/api/submit-rdv`.

Aucun chemin contenant `rdv`, `public`, `book`, `prendre` n'existe côté pages
(`src/app`). Champ libre.

### Chemins SÛRS proposés (préfixe dédié, isolant et auto-documenté)

| Usage | Chemin proposé | Pourquoi sûr |
|---|---|---|
| Page publique du formulaire | `/prendre-rdv` (alt. `/rdv-public`) | aucun conflit, hors de toutes les listes du middleware |
| Page de confirmation publique | `/prendre-rdv/merci` | sous-arbre du même préfixe, exempté en une règle |
| Route API soumission publique | `/api/public/rdv` (alt. `/api/rdv-public`) | préfixe `/api/public/*` inexistant, facile à exempter en bloc |
| Route API vérif token (si besoin) | `/api/public/rdv/verify` | même préfixe |

> Recommandation : **regrouper tout sous deux préfixes** — `/prendre-rdv` (UI) et
> `/api/public/` (API). Un préfixe unique = une exemption middleware unique =
> surface de risque minimale et zéro régression sur le privé.

---

## 3. Fonctions de `odoo.ts` / `email.ts` appelables TELLES QUELLES

Aucune modification de ces libs n'est nécessaire. Signatures exactes :

### `src/lib/odoo.ts`

```ts
// Création d'un enregistrement Odoo (ex. sale.order, res.partner, sale.order.line)
export async function odooCreate(
  model: string,
  values: Record<string, unknown>
): Promise<number>            // retourne l'ID créé

// Appel générique (search_read, write, message_post, action_cancel, ...)
export async function odooExecute(
  model: string,
  method: string,
  args: unknown[],
  kwargs?: Record<string, unknown>   // défaut {}
): Promise<unknown>

// Recherche pratique (wrapper search_read)
export async function odooSearch(
  model: string,
  domain: unknown[],
  fields?: string[],           // défaut []
  limit?: number               // défaut 0
): Promise<Record<string, unknown>[]>

// Mapping client→template (utile seulement si tu réutilises la logique template)
export function getTemplateId(
  clientPrefix: string,
  typeBien: string,
  typeMission: "entree" | "sortie"
): number | null
```

**Créer un `sale.order` minimal côté public** (sans dépendre de `portal_clients`),
exemple de pattern réutilisable tel quel :

```ts
import { odooCreate, odooExecute } from "@/lib/odoo";

// 1) partenaire adresse (optionnel)
const partnerId = await odooCreate("res.partner", { name, email, phone });

// 2) commande
const orderId = await odooCreate("sale.order", {
  partner_id: partnerId,
  x_studio_portail_client: true,      // si tu veux taguer l'origine
});

// 3) ligne
await odooCreate("sale.order.line", {
  order_id: orderId,
  name: "…",
  product_uom_qty: 1,
  price_unit: 0,
});
```

> ⚠️ La logique métier riche de `submit-rdv` (templates `CLIENT_TEMPLATES`,
> branche `agency`, tags ELE/ELS, partenaires bailleur/locataire, champs
> `x_studio_*`) dépend de `portal_clients` et du contexte privé. **Ne la copie
> pas aveuglément** : pour le public, définis ton propre payload minimal viable.

### `src/lib/email.ts`

```ts
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
  replyTo?: string;
}): Promise<{ success: true; id: string } | { success: false; error: string }>
```

- Expéditeur fixe `Axis Experts <noreply@axis-experts.be>`, `replyTo` par défaut
  `info@axis-experts.be`. Renvoie un résultat **jamais throw** (toujours un objet
  `success`). Domaines de test bloqués en production (`example.com`, etc.).
- Appelable telle quelle pour : accusé de réception au demandeur **et/ou**
  notification interne `info@axis-experts.be`.

**Aucune des deux libs ne lit la session utilisateur** → 100 % compatibles avec un
contexte public (elles s'appuient uniquement sur des variables d'environnement
serveur déjà présentes : `ODOO_*`, `RESEND_API_KEY`).

---

## 4. Ajouter des routes PUBLIQUES sans changer le comportement privé

Deux fichiers concernés, **modifications purement additives** (aucune ligne
existante supprimée/altérée) :

### a) `src/proxy.ts` — exemption en amont (recommandé)

Ajouter, **au début** de `proxy()`, une exemption sur le préfixe public, sur le
même modèle que `/reset-password` et `/setup-account` :

```ts
// Routes publiques de prise de RDV (sans login) — bypass total du middleware
if (
  request.nextUrl.pathname.startsWith("/prendre-rdv") ||
  request.nextUrl.pathname.startsWith("/api/public/")
) {
  return NextResponse.next();
}
```

- `return NextResponse.next()` court-circuite **et** l'auth **et** le gate CGU.
- C'est purement additif : les chemins privés ne matchent pas ce préfixe, donc
  leur comportement est **inchangé**.

### b) (Filet de sécurité) `src/lib/supabase/middleware.ts`

L'exemption en (a) suffit (le code n'atteint jamais `updateSession`). Si tu veux
une défense en profondeur au cas où quelqu'un retirerait l'exemption proxy,
ajouter le préfixe à la liste blanche `!user` et à `isCguExemptedPath()`. **Non
nécessaire** si (a) est en place — préférer une seule source de vérité (a) pour
éviter la duplication.

### c) La route API publique elle-même

- **NE PAS** appeler `createClient()` (serveur, basé cookies) pour de l'auth :
  côté public il n'y a pas de session. Pour les écritures Supabase, utiliser
  `createAdminClient()` (`src/lib/supabase/admin.ts`, service role).
- Reproduire les protections « maison » sans dépendre du login :
  - **rate limiting** par IP via `extractClientIp(request)` +
    `checkRateLimit({ ... })` (`src/lib/rate-limit.ts`) — signatures déjà prêtes ;
  - validation stricte des entrées (réutiliser le style `validateBody` /
    `isValidEmail` / `escapeHtml`), CAPTCHA recommandé, limites de taille fichiers.
- `export const dynamic = "force-dynamic";` comme les autres routes.

> Note matcher : le `matcher` de `proxy.ts` **inclut déjà** `/api/public/*` et
> `/prendre-rdv` (il n'exclut que les assets). L'exemption (a) est donc bien le
> point de contrôle — **ne pas toucher au `matcher`** (le modifier risquerait
> d'affecter d'autres routes).

---

## 5. Créer une NOUVELLE table Supabase sans toucher à l'existant — CONFIRMÉ

**Oui, c'est sûr et isolé.** Tables existantes (à ne pas modifier) :
`portal_clients`, `user_consents`, `audit_log`, `organizations`, `invitations`,
`product_catalog`, `custom_fields`, `organization_custom_fields`,
`rdv_custom_values`, `rdv_drafts`, `portal_message_reads`.

Crée **tes propres tables** avec un préfixe dédié, ex. `public_rdv_requests` et
`public_rdv_tokens`. Recommandations :

- Une **nouvelle migration** dédiée (ex. `supabase/migrations/<timestamp>_public_rdv.sql`),
  sans `ALTER`/`DROP` sur les tables existantes.
- **RLS activée** + **aucune** policy ouverte à `anon` : la page publique écrit via
  la route API serveur en **service role** (`createAdminClient()`), qui contourne
  la RLS. Donc RLS « deny by default » (aucune policy) = personne d'autre que le
  service role n'y accède. (À la différence de `rdv_drafts` dont la policy est liée
  à `auth.uid()` — inadaptée au public.)
- Ne **pas** référencer `auth.users(id)` en `NOT NULL` (les demandeurs publics
  n'ont pas de compte). Génère plutôt un token UUID propre.

Squelette indicatif (à adapter) :

```sql
CREATE TABLE public_rdv_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token        UUID NOT NULL DEFAULT gen_random_uuid(),
  status       TEXT NOT NULL DEFAULT 'pending',
  form_data    JSONB NOT NULL,
  odoo_order_id BIGINT,
  email        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public_rdv_requests ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès réservé au service role (route API serveur).
CREATE UNIQUE INDEX idx_public_rdv_requests_token ON public_rdv_requests(token);
```

---

## Conclusion

### ✅ Chemins / fichiers SÛRS à CRÉER (nouveaux uniquement)

- `src/app/prendre-rdv/page.tsx` — formulaire public (`"use client"` autonome,
  **sans** dépendance à la session ni à `portal_clients`).
- `src/app/prendre-rdv/merci/page.tsx` — confirmation publique.
- `src/app/api/public/rdv/route.ts` — soumission : valide, rate-limit par IP,
  `createAdminClient()` pour Supabase, `odooCreate`/`odooExecute` pour le
  `sale.order`, `sendEmail()` pour les notifications.
- `supabase/migrations/<timestamp>_public_rdv.sql` — `public_rdv_requests`
  (+ `public_rdv_tokens` si besoin), RLS activée, sans policy `anon`.
- Réutilisables **tels quels, sans modification** : `odooCreate`, `odooExecute`,
  `odooSearch`, `getTemplateId` (`odoo.ts`) ; `sendEmail` (`email.ts`) ;
  `checkRateLimit`, `extractClientIp` (`rate-limit.ts`) ;
  `createAdminClient` (`supabase/admin.ts`).

### ✋ Modifications additives minimales tolérées

- `src/proxy.ts` : ajouter **une** exemption `NextResponse.next()` pour
  `/prendre-rdv` et `/api/public/` (même pattern que `/reset-password`).
  Rien d'autre.

### ⛔ Ce qu'il ne faut SURTOUT PAS toucher

- `src/app/api/submit-rdv/route.ts` et `src/app/demande/page.tsx` (flux privé).
- La logique d'auth et de CGU de `src/lib/supabase/middleware.ts` (`updateSession`,
  liste blanche `!user`, `isCguExemptedPath`, `CURRENT_CGU_VERSION`).
- Le `matcher` exporté dans `src/proxy.ts`.
- Le **corps** des libs `odoo.ts` et `email.ts` (les appeler, pas les modifier).
- Les **tables existantes** (`portal_clients`, `user_consents`, `rdv_drafts`, etc.)
  et leurs policies RLS.
- Le bucket Storage privé `rdv-documents` scoping par `user.id` (si tu gères des
  fichiers publics, utilise un **chemin/bucket distinct**, pas le scoping privé).
