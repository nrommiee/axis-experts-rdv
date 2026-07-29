# AUDIT READ-ONLY — Génération & téléchargement de documents (Word / Excel / PDF)

**Repo** : `axis-experts-rdv` · **Branche d'audit** : `claude/audit-document-exports-oer2oy`
**Date** : 2026-07-29 · **Périmètre** : audit statique du code (aucune modification).
**Portée** : ce rapport est le **seul** fichier écrit. Aucune modification de code, commit, package ou PR.

> ⚠️ Limites de l'audit : je n'ai pas d'accès à l'instance Odoo (`axisexperts.odoo.com`), ni au
> tableau Vercel (plan, limites, logs), ni à un environnement de run. Toutes les affirmations
> portant sur le comportement serveur Odoo ou les quotas Vercel sont marquées **❓ À vérifier**.

---

## 1. Synthèse exécutive

Le portail **ne génère aucun document**. Il n'existe dans `package.json` **aucune librairie**
de génération Word/Excel/PDF (`docx`, `officegen`, `exceljs`, `xlsx`, `pdfkit`, `pdf-lib`,
`jspdf`, `puppeteer`, `mammoth`, `docxtemplater`…). Les fichiers téléchargés par les clients
sont des **pièces jointes déjà présentes dans Odoo** (`ir.attachment.datas`, base64) : devis
Odoo, états des lieux **Word (.docx)** saisis par les dactylos, et pièces uploadées par les
clients. Le portail ne fait que **relire et servir** ces binaires.

**Cause probable de l'échec Word** (hypothèse principale) : le téléchargement des pièces depuis
le tableau de bord passe par une route qui **charge le base64 complet de jusqu'à 10 pièces dans
une seule réponse JSON** (`/api/odoo/attachments`), puis décode côté navigateur via `atob()`
**sans aucun try/catch**. Les états des lieux Word (avec photos intégrées) sont volumineux ;
au-delà de la limite de taille de réponse des fonctions serverless Vercel (**~4.5 Mo ❓**), la
requête échoue et **rien ne se télécharge**, sans message clair. Cela colle au symptôme « certains
clients, format Word, ça ne passe pas » : ce sont précisément les commandes avec un `.docx`
lourd qui cassent, pas les petits PDF. Une seconde voie (fil de discussion, `MessageDrawer`)
utilise une route serveur en streaming correcte, ce qui explique que « parfois » ça marche.

**Ampleur du chantier « 3 formats partout »** : ~important. Il n'y a **aucune** couche d'export
à faire évoluer — tout est à **construire** (renderer DOCX + XLSX + PDF, modèle de charte, tests).

**Top 3 actions**
1. **P0 — Réparer le téléchargement Word** : router **tous** les téléchargements par la route
   serveur en streaming (`/api/odoo/attachments/download`, une pièce à la fois), retirer le
   base64 inline du listing, et emballer `atob()` dans un try/catch avec message d'erreur.
2. **P0 — Fiabiliser la route de download** : déclarer `runtime = "nodejs"` + `maxDuration`,
   valider/forcer le `Content-Type` OOXML pour les `.docx`, vérifier le mimetype stocké côté Odoo.
3. **P1 — Décider la cible** : si « DOCX+XLSX+PDF partout » vise des **documents générés par le
   portail** (devis, récap RDV, état des lieux), c'est un module d'export à créer de zéro.

---

## 2. Cartographie des flux de documents (Phase 1)

### 2.1 Constat structurant
Aucune génération de document dans le code. Recherche exhaustive négative pour :
`report` / `render_qweb` / `qweb` / `ir.actions.report`, `jsPDF` / `pdf-lib` / `puppeteer`,
`docx` / `officegen` / `mammoth` / `docxtemplater`, `exceljs` / `sheetjs`
(seules occurrences : listes d'extensions autorisées à l'**upload** et mimetypes).
Les seules références PDF sont des **mimetypes d'upload** (`src/lib/public-rdv/uploads.ts:22`,
`src/app/api/submit-rdv/route.ts:1028`, `src/app/api/agency/extract-bail/route.ts:170`).

### 2.2 Flux de **téléchargement** (sortants — ce que le client récupère)

| # | Document (métier) | Route/handler | Fichier:ligne | Format(s) | Source des données | Chemin de livraison |
|---|---|---|---|---|---|---|
| D1 | Pièces jointes d'une commande (devis Odoo, **état des lieux .docx**, pièces uploadées) | `GET /api/odoo/attachments` (**listing avec binaire inline**) | `src/app/api/odoo/attachments/route.ts:62-80` | tel quel (mimetype Odoo) | Odoo `ir.attachment.datas` (base64), **jusqu'à 10 pièces, `datas` inclus** | JSON → client `atob()` → `Blob` → `<a download>` (`src/app/dashboard/page.tsx:459-475`, déclenché `:938`) |
| D2 | Pièce jointe d'un **message** (fil de discussion) | `GET /api/odoo/attachments/download?id=` (**streaming binaire**) | `src/app/api/odoo/attachments/download/route.ts:8-117` | tel quel (mimetype Odoo, fallback `octet-stream`) | Odoo `ir.attachment.datas` (base64) | `NextResponse(Uint8Array)` + `Content-Disposition: attachment` ; déclenché par `window.open(...)` (`src/components/MessageDrawer.tsx:252-256`) |

> Il existe donc **deux chemins de téléchargement distincts** pour le même type de fichier
> (`ir.attachment`), avec des propriétés d'intégrité et de robustesse **différentes**. D1 (le
> plus utilisé — bouton « Pièces jointes » du dashboard) est le plus fragile ; D2 est correct.

### 2.3 Flux d'**upload / stockage** (entrants — origine des documents servis)

| # | Document | Route/handler | Fichier:ligne | Format(s) acceptés | Destination |
|---|---|---|---|---|---|
| U1 | États des lieux **.docx** saisis par les dactylos | `POST /api/dactylo/upload-batch` → `processDactyloOrderBatch` | `src/app/api/dactylo/upload-batch/route.ts` ; `src/lib/odoo/dactylo.ts:216-229` | `.docx` uniquement (magic ZIP `50 4B 03 04` vérifié) | Odoo `ir.attachment` (`mimetype` OOXML **correct** `:221`, `datas = buffer.toString("base64")` `:222`) |
| U2 | Pièces jointes d'une demande de RDV | `POST /api/submit-rdv` | `src/app/api/submit-rdv/route.ts:1028-1048` (map mimetypes) | pdf/doc/**docx**/xls/**xlsx**/images | Supabase Storage `rdv-documents` → re-poussé en base64 vers Odoo |
| U3 | Pièces jointes envoyées dans un message | `POST /api/odoo/messages` | `src/components/MessageDrawer.tsx:135-151` | image/pdf/doc/docx | Odoo `ir.attachment` |
| U4 | Bail (PDF) pour extraction IA | `POST /api/agency/extract-bail` | `src/app/api/agency/extract-bail/route.ts:115-170` | `application/pdf` | Supabase Storage → Anthropic (lecture), non re-servi |
| U5 | Pièces jointes du parcours public `/prendre-rdv` | `src/lib/public-rdv/uploads.ts` ; `src/lib/public-rdv/odoo-order.ts:487-499` | `src/lib/public-rdv/uploads.ts:18-26` | pdf/doc/docx/xls/xlsx | Supabase Storage → base64 → Odoo |

**Validation d'intégrité à l'upload** : `src/lib/mime-validation.ts:1-21` vérifie les magic bytes
(docx/xlsx = `50 4B 03 04`, PDF = `25 50 44 46`, etc.). Bon point : les fichiers **entrants**
sont contrôlés. Le problème signalé est en **sortie**, non couvert par cette validation.

---

## 3. Diagnostic de l'échec Word (Phase 2)

Le seul `.docx` réellement produit/servi par le système est l'**état des lieux Word** (U1),
téléchargé côté client via **D1** (dashboard) et **D2** (message). Analyse cause par cause.

### 3.1 Tableau de statut

| Cause | Statut | Preuve (fichier:ligne) | Impact | Sévérité |
|---|---|---|---|---|
| **A. Intégrité binaire — D2 (streaming)** : `Buffer.from(datas,"base64")` → `new Uint8Array(buffer)` | ✅ conforme | `src/app/api/odoo/attachments/download/route.ts:90,101` | aucun | — |
| **A. Intégrité binaire — D1 (client)** : `atob()` → `Uint8Array` via `charCodeAt` → `Blob` | ✅ conforme sur le principe, mais **sans try/catch** | `src/app/dashboard/page.tsx:461-466` | échec silencieux si base64 tronqué/invalide | **P1** |
| **A. Base64 Odoo décodé côté serveur ?** D2 oui ; D1 **décodé côté navigateur** (base64 transite en JSON) | ⚠️ défaut (D1) | `src/app/api/odoo/attachments/route.ts:77` ; `dashboard/page.tsx:461` | payload JSON gonflé de +33 % | **P1** |
| **A. Transformation middleware du flux** | ✅ non trouvée | `src/proxy.ts` (proxy Supabase auth, ne touche pas ces routes) ; `next.config.ts` | — | — |
| **B. `Content-Type` `.docx` exact** (`…wordprocessingml.document`) | ❓ non garanti | D2 renvoie `att.mimetype` **tel quel** ou `application/octet-stream` (`download/route.ts:91-94`) ; D1 idem via `att.mimetype` (`dashboard/page.tsx:466`) | si Odoo stocke un mimetype faux → Word refuse | **P1** |
| **B. `Content-Disposition` + accents** | ✅ conforme | `download/route.ts:97-99,105` (`filename="..."` **+** `filename*=UTF-8''...`, sanitisation `["\\r\n]`) | — | — |
| **B. `Content-Length` cohérent** | ✅ conforme (D2) | `download/route.ts:106` (`String(buffer.length)`) | — | — |
| **C. Runtime edge alors que `Buffer` utilisé** | ⚠️ à durcir | routes D1/D2 **ne déclarent pas** `runtime="nodejs"` (`attachments/route.ts:6`, `download/route.ts:6` : seul `dynamic` est posé). Défaut App Router = nodejs → OK aujourd'hui, mais non verrouillé | risque si défaut change | **P2** |
| **C. Timeout serverless** | ⚠️ défaut | aucune `maxDuration` sur D1/D2 (cf. absence dans le grep, vs `submit-rdv` `:18`, `public/rdv` `:16`). Odoo + gros base64 peut dépasser le défaut (~10 s ❓) | 504 → download vide | **P1** |
| **C. Taille de réponse max (Vercel)** | ❌ défaut probable | D1 renvoie `datas` de **jusqu'à 10 pièces** en un JSON (`attachments/route.ts:67-80`). `.docx` + photos → dépasse ~4.5 Mo ❓ | listing 500/tronqué → **aucun téléchargement** | **P0** |
| **C. Mise en cache d'une route de download** | ✅ conforme | `Cache-Control: private, no-store` (`download/route.ts:107`) + `force-dynamic` | — | — |
| **D. HTML renommé `.docx`** | ✅ non applicable | aucune génération HTML→Word dans le repo (grep négatif) ; les `.docx` viennent de vrais fichiers uploadés (U1, magic ZIP vérifié `dactylo/upload-batch/route.ts:270`) | — | — |
| **E. Blob bon type MIME (client D1)** | ⚠️ dépend d'Odoo | `new Blob([...], { type: att.mimetype || "octet-stream" })` (`dashboard/page.tsx:466`) | si mimetype Odoo faux → fichier « corrompu » perçu | **P2** |
| **E. `<a download>` cross-origin / `window.open`** | ⚠️ défaut (D2) | D1 = blob same-origin → OK (`:467-474`) ; **D2 = `window.open(url)`** (`MessageDrawer.tsx:253`) | bloqueurs de pop-up, webviews in-app (iOS Safari, LinkedIn, Gmail) → ouverture/preview au lieu de download | **P2** |
| **E. Signed URL expirées** | ✅ non applicable | pas d'URL signée pour ces téléchargements (binaire servi en direct) | — | — |
| **F. Supabase `contentType` à l'upload** | ✅ conforme (upload) | `BailImport.tsx:53` (`contentType:"application/pdf"`) ; `submit-rdv/route.ts:1028-1035` (map) | — | — |
| **F. RLS bucket → 400/403 rendu comme fichier vide** | ✅ non applicable aux D1/D2 | le download final vient d'**Odoo**, pas de Storage | — | — |

### 3.2 Hypothèse principale (classée)

**H1 — Dépassement de la limite de taille de réponse serverless sur le listing D1 (P0).**
Le bouton « Pièces jointes » du dashboard (chemin nominal du client) appelle `/api/odoo/attachments`,
qui **inline le base64 complet de jusqu'à 10 pièces** dans une seule réponse JSON
(`attachments/route.ts:67-80`). Un état des lieux **Word** avec photos pèse facilement plusieurs
Mo ; en base64 (+33 %) et sérialisé en JSON, la réponse dépasse la limite Vercel (~4.5 Mo ❓).
Résultat : la requête échoue (500/504/tronquée) → `res.ok` faux → message générique « Erreur lors
du chargement » (`dashboard/page.tsx:446-448`), **ou** le `atob()` reçoit une chaîne tronquée et
jette sans être capturé (`:461`). Le client ne récupère **rien**. Les petits PDF passent, les gros
`.docx` non → « certains clients, en Word, ça ne passe pas ».

*Tests de confirmation* :
- Reproduire avec une commande dont l'état des lieux `.docx` fait > 4–5 Mo, observer le code HTTP
  et la taille de `/api/odoo/attachments?orderId=…` (DevTools → onglet Réseau).
- `curl -i "$BASE/api/odoo/attachments?orderId=<id>" -H "Cookie: <session>"` → vérifier `Content-Length`
  et un éventuel 500/504.
- Comparer avec D2 (message) sur le **même** fichier : `curl -i "$BASE/api/odoo/attachments/download?id=<id>"`
  puis `file`/`unzip -l` sur la sortie pour confirmer un OOXML ZIP valide.

### 3.3 Hypothèses secondaires

- **H2 — `atob()` sans garde (P1).** `dashboard/page.tsx:461` n'a aucun try/catch : toute chaîne
  non-base64 (troncature, mimetype texte, espaces) fait échouer le décodage **silencieusement**
  → « téléchargement vide, rien ne se passe ». *Test* : injecter une pièce dont `datas` est tronqué
  et vérifier l'absence de fichier + absence de message.
- **H3 — Mimetype Odoo erroné (P1, ❓).** D1 et D2 servent le `mimetype` **tel quel** depuis Odoo.
  Les `.docx` créés par le portail sont bien typés (`dactylo.ts:221`), mais un `.docx` ajouté par un
  **autre canal** (UI Odoo, module tiers, rapport) peut porter `application/octet-stream` voire
  `application/msword`/`text/html` → Word/Word Online refuse ou dégrade. *Test* : dans Odoo, lister
  `ir.attachment` (`name`, `mimetype`) des pièces `.docx` des commandes concernées.
- **H4 — `window.open` sur D2 dans un webview (P2).** `MessageDrawer.tsx:253` ouvre l'URL de download
  dans un onglet. Dans un navigateur in-app (LinkedIn, Gmail, iOS Safari), le `.docx` n'a pas de
  visionneuse → onglet blanc / « échec » perçu, ou pop-up bloquée. *Test* : ouvrir le portail depuis
  un lien LinkedIn/Gmail sur iOS et cliquer une pièce de message.
- **H5 — Timeout serverless (P1).** Absence de `maxDuration` sur D1/D2 : un gros base64 récupéré
  d'Odoo par XML-RPC peut dépasser le défaut → 504 rendu comme échec de téléchargement. *Test* :
  chronométrer la réponse Odoo pour une grosse pièce.

---

## 4. Matrice de couverture — cible « DOCX + XLSX + PDF partout » (Phase 3)

> Aucun document n'est **généré** par le portail : il n'existe donc **aucune couche d'export**
> réutilisable ni de code dupliqué à factoriser — tout serait à créer. La cible « 3 formats
> partout » suppose de définir **quels documents métier** le portail doit produire lui-même.

| Document métier | DOCX | XLSX | PDF | Manquant | Effort estimé | Dépendance |
|---|---|---|---|---|---|---|
| **État des lieux** (aujourd'hui `.docx` uploadé par dactylo, U1) | ⚠️ existant mais **download défectueux** (H1) | ❌ N/A (doc de prose, XLSX peu pertinent — *à justifier métier*) | ❌ absent (pas de conversion .docx→PDF) | XLSX N/A ; **PDF absent** | Réparer D1 (P0) ; conversion→PDF = LibreOffice/Gotenberg (lourd serverless) | Odoo `ir.attachment` |
| **Devis / quotation** | ❌ absent | ❌ absent | ⚠️ ❓ existe-t-il un PDF Odoo servi ? (non trouvé dans le repo) | DOCX + XLSX absents ; PDF à câbler depuis Odoo | Génération QWeb Odoo (`ir.actions.report`) côté ERP | Odoo |
| **Récap RDV** (données structurées, `src/lib/public-rdv/recap.ts`) | ❌ absent | ❌ absent | ❌ absent | Les 3 | Renderer à créer | Supabase/Odoo |
| **Pièces uploadées par le client** (U2/U3/U5) | N/A — restituées telles quelles | N/A | N/A | N/A (pas d'obligation multi-format sur un fichier tiers) | — | Odoo/Storage |
| **Listings / stats** (dashboard, admin) | ❌ N/A (prose) | ❌ absent (export tableur pertinent) | ❌ absent | **XLSX** (+ PDF éventuel) | `exceljs`/CSV | Supabase/Odoo |

Légende : ✅ existant · ⚠️ existant mais défectueux · ❌ absent · N/A (non pertinent, justifié).

**Analyses complémentaires**
- **Modèle unique décliné vs 3 chaînes séparées** : recommandé — **une source de vérité par document
  → un renderer par format**, plutôt que 3 chaînes indépendantes (risque d'incohérence de contenu).
- **Couche d'abstraction existante** : **aucune**. À créer (`src/lib/export/` avec un renderer
  DOCX/XLSX/PDF derrière une interface commune).
- **Cohérence de charte** : aucun template partagé (logo/mise en page Axis Experts) aujourd'hui,
  puisqu'aucun rendu n'est produit. À définir en même temps que la couche d'export.
- **Source de vérité** : dispersée entre **Odoo** (devis, états des lieux, `ir.attachment`) et
  **Supabase** (RDV publics, drafts, custom fields). Risque d'incohérence entre formats si un
  export lit tantôt l'un tantôt l'autre — à arbitrer document par document.

---

## 5. Recommandations priorisées (Phase 4 — descriptives, non implémentées)

### R1 — Correctif immédiat du téléchargement Word (quick win) — **P0**
- **Problème** : D1 (dashboard) inline le base64 de jusqu'à 10 pièces en un JSON + `atob()` sans garde.
- **Approche recommandée** : ne **plus** renvoyer `datas` dans `/api/odoo/attachments` (listing =
  métadonnées seules : `id/name/mimetype/file_size`), et faire télécharger **chaque** pièce par la
  route serveur en streaming **déjà existante et correcte** `/api/odoo/attachments/download?id=`
  (`download/route.ts`), via un `<a href download>` same-origin (et non `window.open`).
- **Alternative** : garder D1 mais borner (`file_size` max, pas de `datas` inline, chargement à la
  demande) — plus de code pour un résultat inférieur.
- **Avantages** : supprime la limite de taille de réponse (H1), le timeout d'agrégat (H5) et le
  `atob()` fragile (H2) d'un coup ; réutilise du code éprouvé. **Inconvénients** : quasi nuls.
- **Effort** : faible. **Risque de régression** : faible (route cible déjà en production pour D2).

### R2 — Fiabiliser la route de download — **P0/P1**
- Déclarer `export const runtime = "nodejs"` et `export const maxDuration = 60` sur `download/route.ts`
  (et sur le listing) — verrouille le runtime (Buffer) et évite les 504 (cause C).
- **Forcer** le `Content-Type` pour les extensions bureautiques : mapper `.docx` →
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.xlsx` →
  `…spreadsheetml.sheet`, indépendamment du mimetype Odoo (couvre H3).
- Uniformiser le download côté client via `<a download>` same-origin (couvre H4).

### R3 — Architecture cible d'export unifié — **P1**
- Créer `src/lib/export/` avec une interface `renderDocument(model, format)` et **un renderer par
  format** (DOCX, XLSX, PDF) partageant un **template de charte** (logo, en-têtes Axis Experts).
- Une **source de vérité par document** ; les 3 formats lisent le même modèle de données.

### R4 — Choix de librairies (contraintes Next.js 16 / Vercel serverless) — **P1**
- **DOCX** : `docx` (pur JS, pas de binaire natif) — OK serverless. Éviter HTML→Word renommé
  (cause D, refus Word Online/macOS).
- **XLSX** : `exceljs` (pur JS) — OK serverless ; alternative légère : CSV pour les listings.
- **PDF** : `@react-pdf/renderer` ou `pdf-lib`/`pdfkit` (pur JS) — OK serverless.
  ⚠️ **Éviter Puppeteer/Chromium** sur Vercel (binaire lourd, cold starts, quota) ; si un rendu PDF
  **fidèle au .docx** est requis, prévoir un service externe (Gotenberg/LibreOffice) hors Vercel.
- Signaler l'impact **poids du bundle** et **cold start** de chaque lib ajoutée.

### R5 — Tests de non-régression — **P1**
- Validation OOXML : après download, `unzip -l` doit lister un ZIP valide ; ouverture réelle Word
  (Windows/macOS/Word Online), LibreOffice, Google Docs.
- Assertions : `Content-Type` exact, `Content-Disposition` avec accents, **taille non nulle**,
  `Content-Length` cohérent.
- Matrice navigateur/webview : Chrome, Safari macOS/iOS, webviews LinkedIn/Gmail.

### R6 — Sécurité — **P1/P2**
- ✅ Bon : contrôle d'accès par `verifyOrderOwnership` sur D1 et D2 (`download/route.ts:74-81`,
  `attachments/route.ts:50-60`) ; `Cache-Control: private, no-store`.
- ✅ Bon : sanitisation du nom de fichier pour `Content-Disposition` (`download/route.ts:98`).
- ⚠️ D1 expose le base64 en JSON (surface + poids) — supprimé par R1.
- ❓ À vérifier : expiration des signed URLs Supabase (buckets d'upload) et RLS des buckets
  `rdv-documents` (non impliqués dans D1/D2, mais dans les uploads U2/U4/U5).
- ❓ Exposition de données Odoo : le listing D1 renvoie tout le binaire — limiter aux métadonnées.

---

## 6. Plan d'action séquencé

| Priorité | Action | Réf. | Effort (j·h) |
|---|---|---|---|
| **P0** | Rediriger tous les téléchargements vers `/api/odoo/attachments/download` (streaming), retirer `datas` du listing, `<a download>` same-origin | R1 | 0,5–1 |
| **P0** | `runtime="nodejs"` + `maxDuration` + `Content-Type` OOXML forcé sur la route de download | R2 | 0,5 |
| **P1** | Try/catch autour de `atob()` / gestion d'erreur visible (si D1 conservé transitoirement) | R1/H2 | 0,25 |
| **P1** | Audit Odoo des `mimetype` des `.docx` existants + correction des faux mimetypes | H3 | 0,5 (❓ accès Odoo) |
| **P1** | Décision produit : quels documents le portail doit **générer** en 3 formats | R3 | 1 (atelier) |
| **P1** | Squelette `src/lib/export/` + 1er renderer (le plus demandé) + template de charte | R3/R4 | 3–5 |
| **P1** | Tests de non-régression download + validation OOXML + matrice client Office | R5 | 1–2 |
| **P2** | Uniformiser le déclenchement client (supprimer `window.open`) + webviews | H4 | 0,25 |
| **P2** | Revue RLS/signed URLs des buckets d'upload | R6 | 0,5 (❓ accès Supabase) |

**Total réparation Word (P0+P1 correctifs)** : ~1,5–2 j·h.
**Total « 3 formats partout » (construction)** : dépend du périmètre décidé (R3) — ordre de
grandeur **5–10 j·h** pour un premier document décliné en DOCX/XLSX/PDF avec tests, plus par
document supplémentaire.

---

## 7. Questions ouvertes / accès manquants

1. **❓ Reproduction exacte du symptôme** : « fichier corrompu », « non ouvrable », « erreur
   serveur » ou « téléchargement vide » ? Chaque variante pointe une hypothèse différente
   (H3 vs H1/H5 vs H2). À qualifier avec un cas client réel + logs Vercel.
2. **❓ Limites Vercel** (plan, taille max de réponse, `maxDuration` par défaut) — nécessaire pour
   confirmer H1/H5.
3. **❓ Accès Odoo** : `mimetype` réel des `.docx` servis (`ir.attachment`), origine des pièces
   (dactylo vs UI Odoo vs module), et existence d'un rapport PDF de devis (H3, ligne « Devis »).
4. **❓ Clients qui échouent** : Word Online, macOS, mobile, LibreOffice ? Aide à trancher H3/H4.
5. **❓ Périmètre cible** : « 3 formats partout » = restituer les pièces existantes en 3 formats
   (conversion, coûteuse) **ou** générer de nouveaux documents portail (devis/récap/état des lieux) ?
   Réponse structurante pour R3/R4.
6. **Zones non explorées** faute d'accès runtime : comportement réel de `xmlrpc@1.3.2` sur de gros
   champs base64, contenu binaire effectif des pièces, logs de production.
