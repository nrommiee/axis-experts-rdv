# Audit V3 sécurité axis-experts-rdv — 2026-05-20

> Lecture seule. Aucune modification de code. Toutes les références sont sourcées en `fichier:ligne`.
>
> Note préliminaire : les deux documents cités dans la mission (`docs/PRE_LAUNCH_AUDIT_2026-05-20.md` et `docs/ADMIN_MODULE_AUDIT_2026-05-20.md`) **ne sont pas présents** dans `docs/` à la racine du repo (vérifié via `ls docs/`). Le contenu présent est : `ADMIN_USERS.md`, `CLEAN_LAUNCH_PROCEDURE.md`, `CUSTOM_FIELDS_E2E.md`, `DESIGN_SYSTEM.md`, `V2_5_TEST_RESULTS.md`, `V2_TEST_RESULTS.md`. Le présent audit recouvre le périmètre demandé indépendamment de ces deux documents manquants.

---

## A. Resend hardening

### A.1 Endpoints qui envoient des emails (via `sendEmail` / Resend)

| # | Route | Condition d'appel | Destinataire(s) | Validation destinataire ? |
|---|-------|-------------------|-----------------|---------------------------|
| 1 | `POST /api/submit-rdv` `src/app/api/submit-rdv/route.ts:900` | RDV créé + `bailleurEmail` fourni | `bailleurEmail` (form, non vérifié côté serveur autrement qu'une regex `isValidEmail`) | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` à `src/app/api/submit-rdv/route.ts:22-24, 55` |
| 2 | `POST /api/submit-rdv` `src/app/api/submit-rdv/route.ts:1026` | À chaque RDV créé (non-bloquant) | Hard-codé `"info@axis-experts.be"` `src/app/api/submit-rdv/route.ts:1027` | N/A (statique) |
| 3 | `POST /api/admin/invite` `src/app/api/admin/invite/route.ts:197` | Admin invite un utilisateur | `email` du body (regex `src/app/api/admin/invite/route.ts:44`) + `isAdmin(user.email)` `:28` | Regex seule, pas de whitelist domaine |
| 4 | `POST /api/admin/organizations/[id]/notifications/test` `src/app/api/admin/organizations/[id]/notifications/test/route.ts:153` | Admin déclenche un test depuis l'UI | `recipients` calculés via `resolveNotificationRecipients()` OU `override_recipients` (body) validés par `isValidEmail` `:115` + `normalizeAndValidateEmails` `:123` | Regex + dédupe ; pas de whitelist ; admin gate `:83-85` |
| 5 | `GET /api/cron/check-rdv-notifications` `src/app/api/cron/check-rdv-notifications/route.ts:323` | Cron (Bearer `CRON_SECRET`) | Recipients de l'org via `resolveNotificationRecipients(...)` `:287` | Validation = jeu de tests `resolveNotificationRecipients` (cf. `src/lib/notification-recipients.ts` non re-lu ici, mais utilisé à l'écriture aussi côté API admin) |

Helper unique : `src/lib/email.ts:29-54` (`sendEmail` → `Resend.emails.send`).

### A.2 État rate-limit

```
grep -rn "rateLimit|rate.limit|throttle|Upstash|ratelimit" src/ → 0 résultat
```

| Endpoint | Rate-limit en place ? |
|---|---|
| `POST /api/submit-rdv` | **Absent** |
| `POST /api/admin/invite` | **Absent** (mais admin-gated `:28`) |
| `POST /api/admin/organizations/[id]/notifications/test` | **Absent** (admin-gated `:83-85`, dédupe en mémoire ligne par ligne, mais aucun throttle par admin / par org) |
| `GET /api/cron/check-rdv-notifications` | Pas de RL ; mais auth via `CRON_SECRET` `:86-90`, et `sleep(200)` `:339, :360` entre envois (≈ pacing, pas un RL) |

Conclusion : **aucun rate-limit applicatif** dans `src/`. Aucune dépendance Upstash ou équivalent (à confirmer via `package.json` si nécessaire — non vérifié ici par souci de scope).

### A.3 Whitelist destinataire

```
grep -rn "whitelist|allowed.*email|isAllowed|emailWhitelist" src/ → 0 résultat
```

**Aucune whitelist** (ni domaine, ni explicite par adresse). Toute adresse passant la regex `isValidEmail` (`src/app/api/submit-rdv/route.ts:22-24` ; `src/lib/notification-recipients.ts` côté test) est acceptée.

### A.4 Configuration Resend dans le code

`src/lib/email.ts` :
- `from` : `"Axis Experts <noreply@axis-experts.be>"` hard-codé `src/lib/email.ts:15`.
- `replyTo` : **non défini** (jamais passé à `Resend.emails.send`, cf. `:32-39`).
- `tags` : optionnel, callers fournissent — utilisés uniquement par la cron `src/app/api/cron/check-rdv-notifications/route.ts:327-330` (`type=rdv_notification`, `notification_type=initial|updated`) et le test admin `src/app/api/admin/organizations/[id]/notifications/test/route.ts:157-160`. Les deux appels de submit-rdv (lignes 900 et 1026) n'envoient aucun tag.

### A.5 Table de logs des envois Resend

```
grep -rn "resend|email_log|email_sent|rate_limit" supabase/migrations/ → 0 résultat
```

Aucune table générique `email_logs` Resend. La seule trace persistée est `rdv_notifications_sent.recipients` (jsonb : `[{email, status, error?}]`), écrite par la cron à `src/app/api/cron/check-rdv-notifications/route.ts:343-354`. La DDL de cette table n'est **pas présente** dans `supabase/migrations/` (vérifié ; vraisemblablement créée hors migrations versionnées, à investiger séparément).

### A.6 Recommandation V3

1. **Rate-limit** sur `POST /api/submit-rdv` (clé : `user.id`, fenêtre courte ex. 5/min, + cap journalier ex. 30/j) ; sur `POST /api/admin/invite` (par admin) ; sur `POST /api/admin/organizations/[id]/notifications/test` (par org-id).
2. **Whitelist envoi** : ajouter dans `src/lib/email.ts` (autour de `:29-39`) une garde commune avant `emails.send` :
   - liste d'env. `EMAIL_DESTINATION_ALLOWLIST` (mode staging) ;
   - blocage des domaines disposables / des sous-domaines internes (`@axis-experts.be` ok, `@*.axis-experts.test` ko en prod).
3. **`replyTo`** à `info@axis-experts.be` ajouté dans `sendEmail()` `src/lib/email.ts:32-39`.
4. **Table `email_logs`** : `(id, route, recipient, subject_hash, tags, resend_id, status, error, created_at)` + index `(recipient, created_at)`. Migration à créer dans `supabase/migrations/`. Permet rate-limit applicatif côté DB en complément (count by recipient sur N minutes).
5. **Tags systématiques** : ajouter `tags=[{name:"route", value:"submit-rdv"}, {name:"env", value:process.env.NODE_ENV}]` aux deux appels `submit-rdv` (lignes 900, 1026) pour tracer dans Resend.

---

## B. Documents size cap

### B.1 Limites actuelles

| Variable / cap | Valeur | Fichier:ligne | Périmètre |
|---|---|---|---|
| `proxyClientMaxBodySize` | `"200mb"` | `next.config.ts:5` | Global (toutes routes) |
| `MAX_SIZE` (front submit-rdv) | `3 * 1024 * 1024` (3 Mo) | `src/app/demande/page.tsx:512`, ré-utilisé `:539, :1400` | Par fichier, **front uniquement** |
| Affichage UI | "max 3 Mo par fichier" | `src/app/demande/page.tsx:1317` | Texte d'aide |
| **Cap qty `documents` côté serveur (`/api/submit-rdv`)** | **AUCUN** | absent (`src/app/api/submit-rdv/route.ts:102, 856-860`) | itère `for (const doc of documents)` sans borne |
| **Cap taille par fichier côté serveur (`/api/submit-rdv`)** | **AUCUN** | absent (`src/app/api/submit-rdv/route.ts:813-854`) | `Buffer.from(fileData.base64, "base64")` sans vérification de longueur |
| **Cap total payload** | implicite via `proxyClientMaxBodySize: 200mb` | `next.config.ts:5` | très permissif |
| `MAX_FILE_SIZE` (Dactylo) | `20 * 1024 * 1024` (20 Mo) | `src/components/dactylo/constants.ts:1` | Vérifié serveur `src/app/api/dactylo/upload-batch/route.ts:255-261` ✓ |
| `MAX_FILES_PER_ROW` (Dactylo) | `10` | `src/components/dactylo/constants.ts:2` | Vérifié serveur `src/app/api/dactylo/upload-batch/route.ts:139, 247-251` ✓ |
| `MAX_LINES_PER_BATCH` (Dactylo) | importé de `@/lib/odoo/dactylo` | `src/app/api/dactylo/upload-batch/route.ts:18, 217-219` | Vérifié serveur ✓ |

### B.2 MIME validation

- **`/api/submit-rdv`** (`src/app/api/submit-rdv/route.ts:818-826`) : MIME **dérivé de l'extension** uniquement (lookup `mimeMap`). Pas de magic bytes, pas de validation MIME vs content-type côté serveur. Fallback `application/octet-stream`.
- **`/api/dactylo/upload-batch`** : extension regex `.docx` (`:247-250`), `entry.type` vérifié contre `DOCX_MIME` (`:252-254`), **magic bytes ZIP** vérifiés (`hasDocxMagic` `:112-126`, `ZIP_MAGIC = [0x50,0x4b,0x03,0x04]` `src/components/dactylo/constants.ts:9`). ✓ partiel/complet pour ce périmètre.

Aucun appel `%PDF` / `0xFF 0xD8` (JPEG) / autres magic bytes côté submit-rdv :
```
grep -rn "magic|%PDF|0xFF.*0xD8" src/ → seulement Dactylo
```

### B.3 Storage path structure

| Endpoint | Format | Risque |
|---|---|---|
| Submit final | `${user.id}/${fileName}` `src/app/api/submit-rdv/route.ts:829` avec `upsert: true` `:832` | **Écrasement** : deux RDV avec un fichier portant le même nom (ex. `etat-des-lieux.pdf`) écrasent celui du RDV précédent. Pas de préfixe `orderId`. |
| Brouillons | `${user.id}/drafts/${tempDraftId}/${finalName}` `src/app/demande/page.tsx:661` | OK (préfixe draftId UUID). |

### B.4 Recommandation V3

1. **`/api/submit-rdv`**, autour de `src/app/api/submit-rdv/route.ts:813-860` :
   - cap `documents.length` (ex. ≤ 10), refus 400 si dépassé ;
   - cap base64 → buffer length (ex. ≤ 3 Mo par fichier, ≤ 20 Mo cumulé) — calcul `Math.ceil(base64.length * 3 / 4)` avant `Buffer.from` pour bloquer avant alloc ;
   - whitelist extensions (`pdf|jpg|jpeg|png|doc|docx|xls|xlsx`) — refuser tout autre, ne pas tomber sur `octet-stream` ;
   - validation magic bytes pour les MIME critiques (`%PDF-`, ZIP `PK\x03\x04` pour docx/xlsx, JPEG `\xFF\xD8\xFF`, PNG `\x89PNG\r\n\x1a\n`).
2. **Storage path** : passer à `${user.id}/${orderId}/${fileName}` après création de `sale.order` (ligne 829 modifiée). Optionnel : retirer `upsert:true` pour rendre la collision explicite.
3. **`next.config.ts:5`** : abaisser `proxyClientMaxBodySize` à `25mb` (cap réaliste 10 docs × 3 Mo + marge) — pas besoin de 200 Mo en dehors du flow Dactylo, et ce dernier a déjà ses propres caps stricts.

---

## C. PII logs

### C.1 Inventaire complet (logs des fichiers en périmètre)

Légende : **S** = sûr (IDs/durées/statuts), **L** = PII low (1 champ peu identifiant), **H** = PII high (≥2 champs perso), **I** = identifiable (combinaison nom/email/adresse permettant d'identifier un individu).

| Fichier:ligne | Catégorie | Contenu en clair |
|---|---|---|
| `src/lib/email.ts:41` | **I** | `subject` (contient adresse complète, cf. `submit-rdv:902`) + objet erreur |
| `src/lib/email.ts:45` | **I** | `id` + `subject` (adresse en clair) |
| `src/lib/email.ts:48` | **I** | `subject` (adresse) + erreur |
| `src/app/api/submit-rdv/route.ts:120` | S | dateDebut / dateFin / label |
| `src/app/api/submit-rdv/route.ts:140` | S | partner_id, template prefix |
| `src/app/api/submit-rdv/route.ts:212` | S | catalog error |
| `src/app/api/submit-rdv/route.ts:246-247` | S | defaultCode + options count |
| `src/app/api/submit-rdv/route.ts:258` | S | template id, prefix, typeBien, typeMission |
| `src/app/api/submit-rdv/route.ts:272-274` | S | country_id |
| `src/app/api/submit-rdv/route.ts:290` | S | `adressePartnerRaw` (id Odoo) + id |
| `src/app/api/submit-rdv/route.ts:321-323` | S | id partner |
| `src/app/api/submit-rdv/route.ts:332-334` | **L** | id + `ownerName` (nom propriétaire) |
| `src/app/api/submit-rdv/route.ts:351-353` | S | id |
| `src/app/api/submit-rdv/route.ts:361-363` | **L** | id + `ownerName` (nom propriétaire) |
| `src/app/api/submit-rdv/route.ts:368-370` | S | id |
| `src/app/api/submit-rdv/route.ts:386` | **H** | `existingName` + `locataireFullName` (2 noms en clair) |
| `src/app/api/submit-rdv/route.ts:393` | S | id |
| `src/app/api/submit-rdv/route.ts:401` | S | id |
| `src/app/api/submit-rdv/route.ts:410` | S | id |
| `src/app/api/submit-rdv/route.ts:417` | S | id |
| `src/app/api/submit-rdv/route.ts:439, 445, 458` | S | ids représentant |
| `src/app/api/submit-rdv/route.ts:476, 480, 484` | S | tag info |
| `src/app/api/submit-rdv/route.ts:495` | S | ids only |
| `src/app/api/submit-rdv/route.ts:526-528` | S | payload `sale.order` (ids only — pas de PII directe) |
| `src/app/api/submit-rdv/route.ts:533` | S | id order |
| `src/app/api/submit-rdv/route.ts:535-537` | S | payload (ids) + erreur Odoo |
| `src/app/api/submit-rdv/route.ts:544, 546` | S | suivi_expert |
| `src/app/api/submit-rdv/route.ts:553-558` | S | cancel info |
| `src/app/api/submit-rdv/route.ts:580, 584, 597-602` | S | ids/counts |
| `src/app/api/submit-rdv/route.ts:612-614` | **L** | nom produit (60 chars) — pas PII direct mais peut contenir libellé client |
| `src/app/api/submit-rdv/route.ts:636` | **I** | `noteName.substring(0,60)` — les 3 noteLines (`:619-623`) contiennent : adresse complète, prénom+nom locataire, n° PO. Le tronquage à 60 chars laisse passer la majorité. |
| `src/app/api/submit-rdv/route.ts:650, 679` | **L→I** | nom template line, peut contenir "Adresse de l'immeuble concerné : ..." en clair |
| `src/app/api/submit-rdv/route.ts:691, 697, 704` | S | confirmation d'update |
| `src/app/api/submit-rdv/route.ts:714-715, 722` | S | partner IDs + write result |
| `src/app/api/submit-rdv/route.ts:740, 755, 768, 781, 799` | S | confirmations |
| `src/app/api/submit-rdv/route.ts:757, 770, 783, 801, 805` | S | erreurs (sans PII) |
| `src/app/api/submit-rdv/route.ts:835` | **L** | nom fichier (peut être ex. `bail-jean-dupont-2026.pdf`) |
| `src/app/api/submit-rdv/route.ts:837` | **L** | `storagePath = ${user.id}/${fileName}` |
| `src/app/api/submit-rdv/route.ts:850` | **L** | `odooName` (= customName ou fileName) |
| `src/app/api/submit-rdv/route.ts:852` | **L** | `fileData.name` + erreur |
| `src/app/api/submit-rdv/route.ts:906` | **H** | `emailRecipients.join(", ")` (email bailleur en clair) |
| `src/app/api/submit-rdv/route.ts:908, 911, 914` | S | erreurs / skipped |
| `src/app/api/submit-rdv/route.ts:1031` | S | destinataire statique `info@axis-experts.be` |
| `src/app/api/submit-rdv/route.ts:1056` | S | user.id |
| `src/app/api/submit-rdv/route.ts:1070, 1074, 1080` | S | erreurs |
| `src/app/api/cron/check-rdv-notifications/route.ts:99, 103, 140, 207, 226, 256, 270, 275, 356, 369` | S | ids/counters seulement. ⚠️ `:275` log `partner=${partnerId}, agency=${agencyId}` (ids Odoo, pas PII directe). |
| `src/app/api/admin/invite/route.ts:129, 220` | S | message d'erreur — l'email invité **n'est jamais loggé** (vérifié manuellement) |
| `src/app/api/admin/organizations/[id]/notifications/test/route.ts:170-177` | **L** | `user.email` (= admin) + counters |
| `src/app/api/admin/organizations/[id]/notifications/test/route.ts:185` | S | erreur |
| `src/lib/odoo.ts:57` | S | message auth retry |
| `src/lib/odoo/dactylo.ts:124, 252` | S | counts / ids |
| `src/lib/odoo/ownership.ts` | S | aucun `console.*` |

### C.2 Total à nettoyer

| Catégorie | Count |
|---|---|
| **PII identifiable (I)** | 6 — `email.ts:41, 45, 48` ; `submit-rdv:636, 650, 679` |
| **PII high (H)** | 2 — `submit-rdv:386, 906` |
| **PII low (L)** | 7 — `submit-rdv:332-334, 361-363, 612-614, 835, 837, 850, 852` ; +1 admin email à `notifications/test/route.ts:170` |

Total à nettoyer en priorité : **8 entrées (I + H)**, et 8 entrées (L) à réduire en seconde passe.

### C.3 Recommandation V3

Fichiers à modifier :

1. `src/lib/email.ts` — remplacer `subject` par un hash court ou tronquer aux 30 premiers chars + tag `route` ; conserver l'id Resend, retirer le subject brut (`:41, 45, 48`).
2. `src/app/api/submit-rdv/route.ts` — remplacer toutes les chaînes contenant nom/email/adresse par des ids/longueurs :
   - `:332-334, 361-363` → `id=${...}` seul (retirer `name="..."`).
   - `:386` → `existingNameLength=${...} incomingNameLength=${...}` ou hash.
   - `:636, 679` → ne logger que le `display_type` et la longueur du nom, pas un substring du nom.
   - `:835, 837, 850, 852` → remplacer `fileName` par `ext=${ext} sizeKB=${...}` ; pour `:837` logger uniquement `storagePath` haché ou `<user>/<orderId>/<hash>.<ext>`.
   - `:906` → `recipients_count=${emailRecipients.length}` au lieu de la liste des adresses.
3. `src/app/api/admin/organizations/[id]/notifications/test/route.ts:170-177` — retirer `user.email`, garder `user.id`.

Helper recommandé : `src/lib/safe-log.ts` (`maskEmail("john@example.com") → "j***@e***.com"`, `hashShort(str) → 8 chars`) à brancher partout.

---

## D. État vs audit initial (P0/P1)

| Item | Description | Statut au 2026-05-20 |
|---|---|---|
| **P0-03** Resend hijack | Rate-limit + whitelist + table d'audit `email_logs` sur les routes envoyant via Resend | **Non fixé** — 0 résultat sur `grep "rateLimit\|throttle\|whitelist"` ; aucune table `email_logs` dans `supabase/migrations/`. |
| **P0-04** Documents size cap | Cap qty + cap taille + MIME magic + storage path scoped à orderId, côté serveur `submit-rdv` | **Non fixé** — `src/app/api/submit-rdv/route.ts:813-860` n'a aucune borne ; `next.config.ts:5` reste à `200mb` ; storage path = `${user.id}/${fileName}` `:829`. Le contrôle côté Dactylo (`dactylo/upload-batch`) est en place mais ne s'applique pas à `submit-rdv`. |
| **P1-06** PII logs | Masquer / supprimer les emails, noms, adresses dans les logs serveur | **Non fixé** — 8 entrées high/identifiable confirmées (cf. C.2), aucune trace de masquage ni de helper de log dans `src/lib/`. |

---

## E. Plan V3 actualisé

Aucune divergence avec la trame initiale : les trois fixes (P0-03, P0-04, P1-06) restent à faire intégralement. L'ordre de priorité reste :

1. **P0-04 documents** — cheapest fix (quelques validations dans `src/app/api/submit-rdv/route.ts:813-860` + abaisser `proxyClientMaxBodySize` dans `next.config.ts:5`) ; bénéfice immédiat (DoS payload + collision storage).
2. **P0-03 resend** — ordre proposé :
   1. Whitelist applicative dans `src/lib/email.ts` (env-driven, no-op en prod si vide) — 1 commit court.
   2. Table `email_logs` + insertion dans `sendEmail` — base pour RL DB.
   3. Rate-limit applicatif (en mémoire / via la table) sur `submit-rdv`, `admin/invite`, `notifications/test`.
3. **P1-06 PII logs** — refactor en passant par un `safe-log` helper unique ; en parallèle des deux P0 ci-dessus.

Aucun changement de plan justifié par cet audit V3 : tout converge avec le diagnostic initial. À traiter dans la Vague 3.
