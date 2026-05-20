# Audit UX polish axis-experts-rdv — 2026-05-20

Lecture seule. Sources `file:line` à l'appui. Branch : `claude/audit-ux-feasibility-OJsf6`.

## Tableau récapitulatif

| Item | Fichier(s) concerné(s) | Effort réel | Blockers | Recommandation |
|------|------------------------|-------------|----------|----------------|
| B-01 | `src/app/demande/page.tsx:649, 1806-1810` ; `src/app/api/drafts/route.ts` | 30 min | aucun | OK — ajouter `router.push('/dashboard')` + toast après succès |
| B-02 | `src/app/demande/page.tsx:1788-1801` ; `src/components/ui/dialog.tsx` | 45 min | décision UX (modal pleine page vs barre) | Wrap dans `<Dialog>` shadcn existant — bloque clics, message clair |
| B-03 | `src/app/demande/page.tsx:1057-1063, 1626` ; `src/app/api/submit-rdv/route.ts:568, 896-915` | 45 min | aucun | Ajouter checkbox `notifyBailleur` + flag dans payload |
| B-04 | `src/app/brouillons/page.tsx:245, 258-260, 304-306` ; `src/app/api/drafts/route.ts:50-78` | 1 h | accès `auth.users` côté serveur (admin client) | Remplacer lookup `portal_clients.nom_bailleur` par `auth.users.email` du `created_by` |
| B-05 | `src/app/demande/page.tsx:1352-1364, 1691` ; `src/app/api/submit-rdv/route.ts:544, 813-850` | 15 min | aucun | Déjà implémenté — micro-polish (preview "nom.ext" live) |
| B-06 | `src/app/demande/page.tsx:754-758, 1079-1147, 1623-1628` ; `portal_clients.logo_url` (`supabase/migration.sql:12`) | 30 min | aucun | Réduire bloc Bailleur récap à logo (si présent) + nom uniquement |
| B-07 | `src/app/admin/organizations/[id]/NotificationsTab.tsx:19-22, 202-671` ; API `organizations/[id]/notifications` | 2 h | colonnes manquantes en DB (à créer via migration Supabase) | Ajouter `notify_on_create` + `notify_on_update` (BOOL) + 2 switches UI |
| B-08 | `vercel.json:1-8` ; `src/app/api/cron/check-rdv-notifications/route.ts:82-90` | 15 min (audit) | déclenchement réel uniquement en prod Vercel (cron) | Test manuel possible via `curl` avec header `Bearer $CRON_SECRET` sur preview |
| B-09 | `src/lib/useAddressAutocomplete.ts:11-71` ; `src/lib/google-maps-loader.ts:25-69` ; `src/lib/google-maps-bootstrap.js` | 2-3 h code + check GCP | API `Autocomplete` legacy (dépréciée) ; clés/quotas GCP non vérifiables côté code | Migration vers `PlaceAutocompleteElement` ; diagnostic réseau dans devtools requis avant code |
| B-10 | `src/components/PriceCalculatorModal.tsx:96-500+` | 2-3 h | choix lib icônes (lucide-react déjà importable via shadcn) | Reporter à l'audit pricing UI (conv #B) ; layout pictos + texte |
| B-11 | `src/lib/email-templates/rdv-notification.ts:78-139` (ligne ~130) | 15 min | aucun | Supprimer le `<a>` "Voir le dossier" du template HTML |

---

## Détails par item

### B-01 — Brouillon : redirect dashboard + notification claire

- Handler : `saveDraft()` défini `src/app/demande/page.tsx:649`, bouton ligne 1806-1810 (footer récap) et ligne 760 (header).
- État actuel : POST `/api/drafts`, met `savingDraft`/`draftSaved`, label bouton change pendant 3 s ("Brouillon enregistré"). **Aucune redirection, pas de toast global.**
- Action :
  1. après succès `await saveDraft()`, `router.push('/dashboard')` (ou `/brouillons`).
  2. Toast via `src/lib/toast.ts` (helper existant).
- Effort : 30 min. Pas de blocker.

### B-02 — Sync création RDV en modal

- Loader actuel : barre de progression inline `src/app/demande/page.tsx:1788-1801` (state `submitting`, `submitProgress`). N'empêche pas le clic ailleurs.
- Composants modaux existants :
  - `src/components/ui/dialog.tsx` (shadcn Dialog) — disponible.
  - Modales custom (divs) `src/app/demande/page.tsx:1829-1876` (confirm) et 1879-1904 (cancel).
- Action : envelopper le bloc submitting dans `<Dialog open={submitting}>` (modal non dismissible). Réutiliser la barre.
- Effort : 45 min. Décision UX à confirmer (pleine page vs garder discrète).

### B-03 — Email confirmation bailleur : option on/off

- Champ saisie : `src/app/demande/page.tsx:1057-1063` (`form.bailleurEmail`).
- Affichage récap : `src/app/demande/page.tsx:1626`.
- Payload submit : `src/app/api/submit-rdv/route.ts:568` envoie `bailleurEmail`.
- Logique mail bailleur : `src/app/api/submit-rdv/route.ts:896-915` — envoi inconditionnel si `bailleurEmail` présent.
- Action : ajouter `form.notifyBailleur: boolean` (default `true`), checkbox à côté du champ email, propager au POST, gate l'envoi mail derrière `payload.notifyBailleur === true`.
- Effort : 45 min. Pas de blocker (pas de changement DB nécessaire si non persisté).

### B-04 — Colonne "Créé par" affiche email user

- Affichage table desktop : `src/app/brouillons/page.tsx:245` (en-tête), 258-260 (cellule `created_by_name`).
- Affichage mobile : `src/app/brouillons/page.tsx:304-306`.
- Source actuelle : `src/app/api/drafts/route.ts:50-78` lookup `portal_clients.nom_bailleur` OU `portal_clients.email_bailleur` à partir de `created_by` (`user_id`). **Affiche le nom de l'organisation/bailleur, PAS l'email de l'utilisateur connecté.**
- Action : remplacer le lookup par un appel `supabase.auth.admin.listUsers()` (ou `getUserById` par ID) côté serveur pour récupérer `email` de chaque `created_by`. Nécessite client admin (service-role) — déjà présent ailleurs dans le code.
- Effort : 1 h (refonte enrichment + perf : N requêtes ou un seul `listUsers`).
- Blocker mineur : pagination `listUsers` si > 50 users.

### B-05 — Renommage fichier visible

- Input renommage : `src/app/demande/page.tsx:1352-1364` (champ texte sous chaque doc, placeholder = nom sans ext).
- Nom original grisé : `src/app/demande/page.tsx:1351`.
- Récap : `src/app/demande/page.tsx:1691` (`doc.customName || doc.file.name`).
- Upload : `src/app/api/submit-rdv/route.ts:544` (concat ext) + 813-850 (attachment Odoo).
- État : **déjà fonctionnel et visible**. À faire éventuellement : preview live "monfichier.pdf" en temps réel sous l'input.
- Effort : 15 min (polish optionnel). Aucun blocker.

### B-06 — Bailleur : afficher logo + nom uniquement

- Schéma : colonne `logo_url TEXT` en `portal_clients` (`supabase/migration.sql:12, 55`).
- Fetch : `src/app/demande/page.tsx:165-168` (SELECT `logo_url`).
- Logo affiché en **header** : `src/app/demande/page.tsx:754-758`.
- Bloc Parties Bailleur : `src/app/demande/page.tsx:1079-1147` (`SummaryRow` Société/Nom/Email/Tél).
- Bloc récap final : `src/app/demande/page.tsx:1623-1628` (Société, Nom, Email, Tél).
- Action : si `portalClient` → restreindre récap à `<img logo_url>` + nom uniquement (cacher Société/Email/Tél). Si bailleur saisi manuellement → laisser tel quel.
- Effort : 30 min. Aucun blocker.

### B-07 — Toggle notifications création vs confirmation

- UI : `src/app/admin/organizations/[id]/NotificationsTab.tsx:19-22, 202-671`.
- États actuels :
  - `notifications_enabled` (bool, ON/OFF global)
  - `notification_recipients_mode` ("creator_only" | "all_org_users" | "custom_list")
  - `notification_custom_emails` (array)
- **Pas de distinction "création" vs "confirmation" en DB ni UI.**
- Migration Supabase nécessaire : ajouter `notify_on_create BOOL DEFAULT true`, `notify_on_update BOOL DEFAULT true` à `organizations` (table à confirmer dans `supabase/*.sql`).
- API : mettre à jour `PATCH /api/admin/organizations/[id]/notifications` pour persister les 2 flags.
- Cron : `src/app/api/cron/check-rdv-notifications/route.ts` filtre `initial` vs `updated` (lignes ~111-320) — gate l'envoi sur les 2 nouveaux flags.
- Effort : 2 h (migration + UI + API + intégration cron).
- Blocker : migration DB (à coordonner avec environnement Supabase).

### B-08 — Vérifier cron check-rdv-notifications

- Cron config : `vercel.json` — `*/10 * * * *` → `/api/cron/check-rdv-notifications`.
- Handler : `src/app/api/cron/check-rdv-notifications/route.ts:82-90` (auth Bearer `CRON_SECRET`).
- Logique : (résumé) fetch Odoo orders (90j), détecte mode bootstrap, compare RDV dates, classifie `initial`/`updated`, résout destinataires (`resolveNotificationRecipients`), construit template (`buildRdvNotificationEmail`), envoie.
- **Test manuel possible** : `curl -H "Authorization: Bearer $CRON_SECRET" https://<deploy-url>/api/cron/check-rdv-notifications` sur preview ou prod.
- Vercel Cron : actif sur déploiements Production uniquement (per Vercel docs). Les previews n'exécutent pas le scheduler — mais l'endpoint reste appelable manuellement.
- Effort : 15 min audit ; vérifier les logs Vercel + Resend (ou autre provider) pour confirmer envois récents.
- Blocker : pas d'accès aux logs Vercel depuis cet environnement (à vérifier côté dashboard).

### B-09 — Google Maps autocomplete

- Hook : `src/lib/useAddressAutocomplete.ts:11-71` — utilise **`google.maps.places.Autocomplete`** (legacy). TODO inline ligne 11 mentionne migration `PlaceAutocompleteElement`.
- Options actuelles : `types: ["address"]`, `componentRestrictions: { country: "be" }`, fields restreints.
- Loader : `src/lib/google-maps-loader.ts:25-69` charge la lib via `window.google.maps.importLibrary("places")` (API moderne v3).
- Bootstrap : `src/lib/google-maps-bootstrap.js:12-39` = bootstrap officiel Google (stub `importLibrary`).
- Usage : `src/app/demande/page.tsx` (2 occurrences) + `src/components/QuickRequestModal.tsx`.
- Diagnostic possible côté code : oui (cohérence loader/hook). **Non possible côté code** : clé API GCP active, restrictions HTTP referrers, quotas, facturation, activation API "Places API (New)" vs "Places API legacy". Nécessite check console GCP.
- Effort : 2-3 h (migration + tests) hors investigation GCP. Blocker : dépréciation Google, certaines features payantes Places New.

### B-10 — Refonte UI pricing pictogrammes

- Composant : `src/components/PriceCalculatorModal.tsx:96-500+`.
- État actuel : texte uniquement (toggles `appart/maison/studio/kot`, checklist suppléments). Pas de SVG/icônes.
- Dépend de l'audit pricing UI (Conv #B).
- Fichier à modifier (unique) : `src/components/PriceCalculatorModal.tsx`. Pas de réseau de dépendances.
- Effort : 2-3 h selon ambition (icônes lucide-react déjà accessible via shadcn écosystème).

### B-11 — Email confirmation RDV : retirer bouton "Voir le dossier"

- Template HTML : `src/lib/email-templates/rdv-notification.ts:78-139`.
- Bouton "Voir le dossier" ≈ ligne 130, `<a href="https://rdv.axis-experts.be/dashboard">` teal #0ABFB8.
- Appelé par : `src/app/api/cron/check-rdv-notifications/route.ts:309-318` (`buildRdvNotificationEmail`).
- Action : supprimer le `<a>` (et la wrapper `<div>`/`<table>` du CTA si présente) du HTML retourné.
- Effort : 15 min. Aucun blocker.

---

## Estimation totale révisée

| Item | Estim. initiale (supposée) | Estim. révisée |
|------|----------------------------|----------------|
| B-01 | 30 min | **30 min** ✓ |
| B-02 | 1 h | **45 min** ↓ |
| B-03 | 1 h | **45 min** ↓ |
| B-04 | 30 min | **1 h** ↑ (lookup auth.users) |
| B-05 | 30 min | **15 min** ↓ (déjà fait) |
| B-06 | 30 min | **30 min** ✓ |
| B-07 | 1 h | **2 h** ↑ (migration DB) |
| B-08 | 30 min audit | **15 min** ✓ |
| B-09 | 2 h | **2-3 h** ↑ (legacy → new + GCP) |
| B-10 | 2 h | **2-3 h** ✓ (dépend pricing audit) |
| B-11 | 30 min | **15 min** ↓ |

**Total révisé : ~11-13 h** (vs ~10 h cumulés en estimation initiale).

---

## Ordre d'exécution recommandé

### Vague 1 — Quick wins (≤ 30 min chacun, zéro blocker), ~2 h
1. **B-11** — retirer le bouton "Voir le dossier" (15 min).
2. **B-05** — polish micro nom fichier (15 min) ou skip (déjà OK).
3. **B-01** — redirect dashboard + toast (30 min).
4. **B-03** — toggle `notifyBailleur` (45 min).
5. **B-06** — récap Bailleur logo + nom (30 min).

### Vague 2 — UX moyenne (45 min - 1 h), ~2 h
6. **B-02** — modal Dialog pendant submit (45 min).
7. **B-04** — colonne "Créé par" via `auth.users.email` (1 h).

### Vague 3 — Vérifications (audit / external), ~1 h
8. **B-08** — test manuel cron + check logs Vercel (15 min en code, dépend infra).
9. **B-09 phase 1** — diagnostic GCP console (clés, quotas, API activées) avant tout code.

### Vague 4 — Plus lourds (nécessitent prérequis), ~6-9 h
10. **B-07** — migration Supabase + UI + API + intégration cron (2 h). **Prérequis** : décider du nommage des colonnes, coordonner migration prod.
11. **B-09 phase 2** — migration `Autocomplete` → `PlaceAutocompleteElement` (2-3 h). **Prérequis** : phase 1 B-09.
12. **B-10** — pictogrammes pricing (2-3 h). **Prérequis** : audit pricing UI (conv #B) terminé, choix iconographie validé.

### Dépendances clés
- **B-09 phase 2** dépend de **B-09 phase 1** (diagnostic GCP).
- **B-10** dépend de l'audit pricing UI (conv #B).
- **B-07** dépend d'une décision produit sur les noms de colonnes et d'une migration coordonnée Supabase (préférer un déploiement séparé).
- **B-04** dépend de la disponibilité du client admin Supabase (service_role) — déjà utilisé ailleurs, donc trivial.
