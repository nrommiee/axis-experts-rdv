# V3.5 — Tests preview & polish UX

Référence : `docs/UX_POLISH_AUDIT_2026-05-20.md`.
Date : 2026-05-20.
Branche : `claude/ux-pricing-polish-bVqMo`.

> Ce document recense les vérifications hors code (cron Vercel, config GCP,
> tests manuels en preview) à effectuer avant le déploiement en prod.

---

## B-08 — Cron `check-rdv-notifications`

Configuration `vercel.json` :

```json
{
  "crons": [
    { "path": "/api/cron/check-rdv-notifications", "schedule": "*/10 * * * *" }
  ]
}
```

Cron actif **toutes les 10 minutes en production uniquement**. Vercel
ne planifie pas les crons sur les déploiements preview.

### Test manuel (preview ou prod)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<URL>/api/cron/check-rdv-notifications
```

- En preview, l'URL ressemble à `https://axis-experts-rdv-<branch>.vercel.app`.
- Le secret `CRON_SECRET` est lu depuis l'env Vercel.
- Réponse attendue : `200 OK` + JSON avec compteurs
  (`sent`, `skipped_same`, `skipped_disabled`, `bootstrap_recorded`, `errors`).
- Première exécution sur un environnement vierge : mode bootstrap actif,
  aucun email envoyé (les RDV existants sont enregistrés comme baseline).

### Toggles V3.5 (B-07)

Après application de la migration `notify_on_create` / `notify_on_update` :
- Si `notify_on_create = false` au niveau de l'org, les emails `initial`
  sont skippés (compteur `skipped_disabled`).
- Idem pour `notify_on_update = false` sur les emails `updated`.
- Si la migration n'a pas encore été exécutée, les deux flags sont
  considérés `true` (comportement V3 préservé).

---

## B-09 — Diagnostic Google Maps (Autocomplete legacy)

### Inventaire code

- `src/lib/useAddressAutocomplete.ts` — hook React qui instancie
  `google.maps.places.Autocomplete`. **API legacy, dépréciée par Google**
  (marqué `// TODO: migrer vers PlaceAutocompleteElement` dans le fichier).
- `src/lib/google-maps-loader.ts` — wrapper autour du bootstrap inline,
  charge `places` via `importLibrary("places")`.
- `src/lib/google-maps-bootstrap.js` — snippet officiel Google
  (copier-coller depuis la doc). Définit le stub
  `window.google.maps.importLibrary` synchrone.

### Variables d'environnement requises

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — clé publique (exposée côté client).

### À vérifier hors repo (GCP Console)

1. **HTTP referrers** : la clé doit autoriser les domaines
   `rdv.axis-experts.be`, `*.vercel.app` (preview), `localhost:3000` (dev).
2. **APIs activées** : Maps JavaScript API + Places API (legacy, encore
   nécessaire tant que l'app utilise `Autocomplete`).
3. **Quota mensuel** : vérifier que le quota n'est pas dépassé et que la
   facturation est active (sinon l'API renvoie un payload sans suggestions
   et l'autocomplétion échoue silencieusement).
4. **Restrictions de clé** : la clé doit être restreinte aux APIs Maps
   JavaScript et Places (pas de wildcards inutiles).

### Statut V3.5

**Pas de code change cette nuit.** B-09 phase 2 — migration vers
`google.maps.places.PlaceAutocompleteElement` — est reportée à V3.6 /
post-launch car elle implique :

- Remplacer le hook `useAddressAutocomplete` par un Web Component géré
  par React (intégration plus invasive).
- Adapter la stratégie de parsing `address_components` (le nouveau
  composant renvoie un schéma légèrement différent : `addressComponents`
  + `formattedAddress` via `place.fetchFields`).
- Tester en preview avec un compte GCP différent (la clé legacy peut
  rester sur l'ancienne API tant qu'elle n'est pas supprimée par Google).

---

## Tests preview à exécuter avant prod

À faire manuellement après déploiement preview de la branche :

- [ ] **B-NEW-12** : forcer un upload 413 (créer un dossier avec >20 Mo
  de PDFs) → toast lisible attendu, pas de message
  "string did not match the expected pattern".
- [ ] **B-NEW-13** : ajouter 11 fichiers depuis le file-picker → toast
  "Maximum 10 fichiers..." attendu, l'envoi est bloqué côté client.
- [ ] **B-11** : créer un RDV via portail puis recevoir l'email de
  confirmation → aucun bouton "Voir le dossier" visible.
- [ ] **B-05** : tenter d'uploader un fichier .zip (MIME refusé) ou un
  PDF >3 Mo → toast d'erreur lisible avec nom du fichier.
- [ ] **B-01** : cliquer "Enregistrer en brouillon" → redirection vers
  `/dashboard` et toast "Brouillon enregistré".
- [ ] **B-03** : décocher "Notifier le bailleur" et soumettre → vérifier
  dans les logs Resend qu'aucun email n'a été envoyé au bailleur (l'email
  interne `noreply` part toujours).
- [ ] **B-06** : récapitulatif → bloc "Bailleur" affiche logo + nom
  uniquement (pas d'email/téléphone/société).
- [ ] **B-02** : pendant l'envoi du formulaire → modal non dismissible
  (clavier Escape, click outside, croix : tous bloqués).
- [ ] **B-04** : `/brouillons` → colonne "Auteur" affiche l'email
  utilisateur (pas le nom_bailleur).
- [ ] **B-07** : Admin → Notifications d'une org → cocher / décocher
  les deux toggles indentés → sauvegarder → vérifier en DB.
- [ ] **B-10** : `/demande` step 1 et QuickRequestModal → chaque chip
  produit affiche un picto (lit / immeuble / maison / commerce / parts
  communes selon `defaultCode`).
