# Vague 2.5 — Durcissement admin — Test results

Date : 2026-05-20
Branch : `claude/harden-admin-security-gl0KM`
Audit ref : `/docs/ADMIN_MODULE_AUDIT_2026-05-20.md`

> **Stop** : ces résultats sont les checks agent-side locaux. Le test
> réel (preview Vercel + Supabase + Resend) doit être effectué par un
> humain avant l'ouverture de la PR et avant tout merge.

---

## Item 1 — Alignement `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAIL`

**Changement** : `src/app/admin/layout.tsx` ne contient plus de
référence à `NEXT_PUBLIC_ADMIN_EMAIL`. Le contrôle d'accès admin est
**exclusivement server-side** via `src/lib/admin.ts` (`ADMIN_EMAILS`)
et `src/lib/supabase/middleware.ts`. Le layout client ne fait plus
qu'afficher l'email (récupéré via `supabase.auth.getUser()`) et
fournir le bouton « Déconnexion ».

**Bénéfice** : ajouter un 2ème admin se résume désormais à ajouter son
email à `ADMIN_EMAILS` côté Vercel — plus de risque de boucle
`/admin ⇄ /dashboard` due à un désaccord client/serveur.

`.env.example` ne mentionnait pas `NEXT_PUBLIC_ADMIN_EMAIL` —
aucune modification nécessaire à ce fichier. La variable doit être
**retirée manuellement** des dashboards Vercel (prod + preview) si
elle y figure (cf. `CLEAN_LAUNCH_PROCEDURE.md` §1.3).

**Tests à exécuter manuellement** (preview Vercel) :

- [ ] Login avec un compte **non-admin** → middleware redirige vers
      `/dashboard`. Aucun comportement régressé.
- [ ] Login avec l'admin (`n.rommiee@axis-experts.be`) → arrive
      directement sur `/admin`, sans boucle ni redirection visible.
- [ ] Aucun écran flash « redirection vers dashboard » brièvement
      visible avant `/admin` (l'`useEffect` ne fait plus de
      `router.replace`).
- [ ] Test cross-check : si on **ajoute temporairement** un 2ème email
      à `ADMIN_EMAILS` sur la preview, ce compte arrive bien sur
      `/admin` (et plus jamais sur `/dashboard`).

---

## Item 2 — Route handler `/auth/callback` server-side pour reset password

**Changements** :

- Nouvelle Route Handler `src/app/auth/callback/route.ts` (GET) :
  - lit `?code=...` + `?next=...`,
  - appelle `supabase.auth.exchangeCodeForSession(code)` via le
    client SSR (`@/lib/supabase/server`), qui pose le cookie de
    session via `cookies()` Next,
  - redirige vers `${origin}${next}` (`/reset-password` par défaut),
  - en cas d'erreur, redirige vers `/login?error=invalid_code` ou
    `/login?error=missing_code`.
- `src/app/login/page.tsx` : `resetPasswordForEmail` cible désormais
  `${origin}/auth/callback?next=/reset-password` au lieu de
  `${origin}/reset-password`.
- `src/app/reset-password/page.tsx` : tout le code
  `exchangeCodeForSession` / `setSession` / fallback `getSession` /
  `authParams` est supprimé. La page suppose simplement qu'une
  session est déjà présente (le callback l'a posée côté serveur).
  Si `updateUser` échoue pour une raison de session, on affiche un
  message clair « Le lien a expiré ou est invalide » + bouton retour
  `/login`.
- `src/lib/supabase/middleware.ts` : ajout de `/auth/callback` à la
  liste des paths publics (sinon un user non authentifié serait
  redirigé vers `/login` avant que le callback ne puisse échanger le
  code).

**Effet** : le `code_verifier` n'est plus stocké en `localStorage`
du browser ayant fait la demande de reset. La session est établie
**côté serveur** via cookie HTTP-only. Conséquence : ouvrir le lien
de reset sur un autre device, dans une session privée, ou même dans
un autre navigateur fonctionne.

**Tests à exécuter manuellement (preview Vercel)** :

- [ ] `/login` → « Mot de passe oublié » → saisir
      `nrommiee@icloud.com` → email reçu.
- [ ] Ouvrir le lien email **dans un autre device ou navigateur** que
      celui ayant fait la demande (test cross-device). À défaut, en
      navigation privée du même navigateur (localStorage vide).
- [ ] Arrivée sur `/reset-password`, **sans** « Auth session
      missing! » ni écran d'erreur.
- [ ] Saisir un nouveau mot de passe → succès → redirection
      `/login` au bout de 3s.
- [ ] Se reconnecter avec le nouveau mot de passe → arrive sur le
      portail.
- [ ] Cas d'erreur : tronquer le `code` dans l'URL avant de cliquer
      → redirection `/login?error=invalid_code`.
- [ ] Cas d'erreur : ouvrir `/auth/callback` sans `code` →
      redirection `/login?error=missing_code`.

---

## Item 3 — Suppression de `/api/auth/register`

**Changement** : `src/app/api/auth/register/` supprimé (le dossier
entier, incluant `route.ts`).

**Vérification d'orphelinage** :

```
grep -rIn "api/auth/register" src/    # → 0 hits
grep -rIn "register" src/             # → 0 callsites résiduels
                                      #   (seules les references étaient
                                      #    dans le fichier supprimé)
```

Aucun callsite légitime trouvé. La route utilisait un schéma
`invitations.code` obsolète (V1) et contenait un
`auth.admin.deleteUser` de rollback risqué. Le flow officiel de
création de compte passe par `/api/auth/setup-account` (token UUID),
qui reste intact.

**Tests à exécuter** :

- [x] `pnpm tsc --noEmit` — voir section toolchain ci-dessous.
- [x] `pnpm lint` — voir section toolchain.
- [x] `pnpm build` — voir section toolchain.

---

## Item 5 — Fix calendrier range (popover reste ouvert entre from et to)

**Bug (régression V2 Item 3)** : sur `/demande`, le calendrier 2-mois
fermait le popover dès le premier clic au lieu d'attendre la
sélection de la date de fin (style Booking).

### Première hypothèse (incorrecte) — commit 3fb70a8

Hypothèse initiale : on propageait prématurément
`onChange({dateDebut: X, dateFin: X})` au parent, ce qui faisait
basculer `rdvDateValidation` et provoquait un re-render fermant le
popover. Le fix tentait d'introduire un état interne `pendingFrom`,
**mais conservait la logique « `range.to` truthy ⇒ commit »** dans
`handleSelect`. Vérifié non corrigé sur preview Vercel (Cmd+Shift+R,
test cross-device).

### Cause racine réelle — commit ultérieur

Fichier fautif : **`src/components/ui/date-range-picker.tsx`**, dans
`handleSelect` (le seul handler côté composant range).

Quirk de `react-day-picker` v9.14.0 — voir
`node_modules/react-day-picker/dist/esm/utils/addToRange.js` lignes
19-22 :

```js
if (!from && !to) {
  // the range is empty, add the date
  range = { from: date, to: min > 0 ? undefined : date };
}
```

Quand `selected = undefined` (état initial, value vide) et que `min`
n'est pas passé (défaut `min = 0`), rdp retourne **`{from: X, to: X}`
dès le premier clic**, et non `{from: X, to: undefined}` comme on
l'attendait. `handleSelect` interprétait alors le premier clic
comme une plage complète et fermait le popover.

### Fix appliqué

Refonte de `handleSelect` autour du flag interne `pendingFrom` (pas
seulement de la forme du `range` retourné par rdp) :

- **Premier clic** détecté par `!pendingFrom` : on stocke
  `pendingFrom = range.from` (que rdp ait rempli `to` ou non), on
  vide tout `value` engagé côté parent, on **ne ferme pas** le
  popover.
- **Deuxième clic** : `pendingFrom` est posé. On calcule
  `dateDebut/dateFin` depuis le `range` retourné par rdp et on valide
  via `isDateRangeValid`. Commit + `onChange` + `setOpen(false)`
  après 180 ms (feedback visuel du range final).
- **Détection du reset Booking-style** : si rdp swappe les endpoints
  (clic avant `pendingFrom` → rdp retourne `{from: Y, to: pendingFrom}`),
  on reset `pendingFrom = Y` au lieu de committer la plage inversée.
- **Plage hors limites (> 30 j)** : déjà bloquée visuellement par
  `disabledMatchers`. Fallback dans `handleSelect` : re-anchor
  `pendingFrom = range.to` plutôt que de committer une plage
  invalide.
- `selectedRange` envoyé à rdp ne reflète plus que le
  `pendingFrom` interne (jamais une plage déjà engagée dans
  `value`). Raison : si on repassait une plage complète comme
  `selected` lors d'une ré-ouverture, `addToRange` mutait un des
  endpoints existants au lieu de partir d'un état frais, rendant
  impossible de savoir avec fiabilité quelle date le user a cliquée.
  La plage engagée reste visible **dans le bouton trigger** via
  `displayLabel` — aucune perte d'info.
- `defaultMonth` séparé : `pendingFrom > value.dateDebut > minDate`.
- `useEffect` sur `open` : ferme proprement (Escape, clic dehors)
  en jetant `pendingFrom` et `hoveredDate` — pas de validation
  partielle leakée au parent.

Bonus de propreté : suppression de la branche morte « même date 2× ⇒
deselect » qui n'était plus atteignable avec le nouveau flux.

**Fix** :

- Ajout d'un état interne `pendingFrom` qui stocke le premier clic
  sans le propager au parent. Tant que `pendingFrom` est posé, le
  popover reste ouvert et le calendrier affiche `selected = {from,
  to: undefined}` (visuel « selecting end date »).
- Au deuxième clic, `react-day-picker` v9 retourne `{from, to}`
  complet ; `handleSelect` valide via `isDateRangeValid`, propage
  `onChange({dateDebut, dateFin})` et ferme le popover après un
  léger délai (180 ms) pour le feedback visuel du range final.
- `useEffect` sur `open` : si le popover se ferme (Escape, clic
  outside), on jette `pendingFrom` et `hoveredDate` → pas de
  validation partielle leakée.
- Clic avant le `from` actuel : rdp retourne `{from: Y, to:
  undefined}` (reset) → on stocke `pendingFrom = Y`, popover reste
  ouvert.
- Clic 2× sur la même date : rdp v9 retourne `{from: X, to: X}` →
  validation OK → plage 1 jour acceptée + popover fermé.
- Validation max 30 jours déjà couverte par `disabledMatchers`
  (inchangé).

**Tests ajoutés** dans
`src/components/ui/date-range-picker.test.tsx` (3 nouveaux, 11 au
total) :

- « ne propage pas de plage partielle au parent au premier clic »
- « propage la plage complète au deuxième clic »
- « accepte une plage d'un seul jour (clic sur la même date deux
  fois) »

**Tests manuels sur `/demande`** (preview Vercel) :

- [ ] Premier clic sur une date → popover reste ouvert, date
      surlignée comme `from`.
- [ ] Deuxième clic sur une date postérieure → popover ferme après
      ~180ms avec un visual highlight du range.
- [ ] Premier clic puis deuxième clic sur la même date → range 1
      jour (`le X`) accepté, popover ferme.
- [ ] Premier clic puis clic sur une date antérieure → la nouvelle
      date devient `from`, popover toujours ouvert.
- [ ] Premier clic puis Escape → popover ferme, parent inchangé
      (pas de validation partielle).
- [ ] Tentative de range > 30 jours → bloquée visuellement
      (`disabled`).
- [ ] Desktop ≥ 768px : 2 mois visibles, sélection à cheval sur
      les deux mois OK.
- [ ] Mobile < 768px : 1 mois, swipe → sélection à cheval sur
      deux mois OK.

---

## Item 4 — `CLEAN_LAUNCH_PROCEDURE.md`

Fichier `docs/CLEAN_LAUNCH_PROCEDURE.md` créé avec :

- Procédure SQL de purge des comptes démo (template ré-exécutable).
- Vérifications Supabase Dashboard / Vercel / Resend.
- Smoke test de bout en bout (création invitation → RDV → Odoo →
  reset cross-device).
- Procédure de rollback post-launch.
- Procédure de blocage / nettoyage d'urgence (suspension org, blocage
  user, révocation admin, coupure des emails).

---

## À configurer hors repo (action humaine requise)

1. **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

   Ajouter :

   - `https://rdv.axis-experts.be/auth/callback`
   - URL preview Vercel équivalente (pattern wildcard
     `https://*.vercel.app/auth/callback` si autorisé par la
     configuration, sinon URL exacte de la branche preview courante).

   Sans cette config, Supabase refuse le `redirectTo` envoyé par
   `resetPasswordForEmail` et l'email n'est pas envoyé / contient
   un mauvais lien.

2. **Vercel → Settings → Environment Variables**

   - Vérifier que `NEXT_PUBLIC_SITE_URL` pointe vers
     `https://rdv.axis-experts.be` en prod.
   - **Retirer** `NEXT_PUBLIC_ADMIN_EMAIL` (prod + preview) — plus
     utilisée depuis Item 1.

---

## Local toolchain status

| Check                                  | Result                                                            |
|----------------------------------------|-------------------------------------------------------------------|
| `pnpm tsc --noEmit`                    | 0 erreur                                                          |
| `pnpm vitest run`                      | 52 passed / 5 files (49 V2 + 3 nouveaux Item 5)                   |
| `pnpm build` *(dummy Supabase env)*    | Compiled successfully, 18/18 prerender, `/auth/callback` listée   |
| `pnpm lint`                            | 9 errors / 15 warnings — **tous pré-existants** (cf. V2_TEST_RESULTS.md). 1 warning de moins (img dans `reset-password` dédupliquée par la simplification du composant). 0 nouvelle erreur. |
