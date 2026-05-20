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
| `pnpm vitest run`                      | 49 passed / 5 files                                               |
| `pnpm build` *(dummy Supabase env)*    | Compiled successfully, 18/18 prerender, `/auth/callback` listée   |
| `pnpm lint`                            | 9 errors / 15 warnings — **tous pré-existants** (cf. V2_TEST_RESULTS.md). 1 warning de moins (img dans `reset-password` dédupliquée par la simplification du composant). 0 nouvelle erreur. |
