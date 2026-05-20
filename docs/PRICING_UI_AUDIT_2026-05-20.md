# Audit pricing UI axis-experts-rdv — 2026-05-20

Audit lecture seule en amont de la refonte des badges de mission
(« Entrée App 1ch », « Sortie App 2ch », …) en pictogrammes.

---

## A. Source de vérité des types de mission

Le système est **hybride** : deux axes croisés produisent l'étiquette finale.

### A.1 Axe `typeMission` — hardcodé (enum binaire)

Valeurs : `"entree" | "sortie"`. Hardcodées partout :

- `src/lib/types.ts:36` — typage `FormData.typeMission`
- `src/components/PriceCalculatorModal.tsx:5,280-283` — type + sélecteur UI
- `src/components/QuickRequestModal.tsx:23,216-219` — sélecteur UI
- `src/app/demande/page.tsx:830-833` — sélecteur UI (avec icônes SVG inline existantes)
- `src/app/api/submit-rdv/route.ts:465` — mapping vers tag Odoo (`ELE` / `ELS`)
- `src/app/dashboard/page.tsx:405-406` — décodage tag → label (`"Entrée"` / `"Sortie"`)
- `src/lib/email-templates/rdv-notification.ts:51` — label email

Aucun stockage Supabase ni Odoo de cet enum côté front, hormis le tag Odoo.

### A.2 Axe `typeBien` (le « produit ») — Odoo `product.template`, filtré + relabellé

Deux chemins distincts coexistent :

#### Chemin « catalogue Odoo direct » (utilisé par la majorité des orgs)

`GET /api/odoo/products` (`src/app/api/odoo/products/route.ts`) :

1. Lit `portal_clients.odoo_template_prefix` + `portal_clients.product_config` (Supabase).
2. `odooSearch("product.template", [sale_ok, active])` → `id, name, list_price, default_code`.
3. Filtre côté serveur via `filterProductsByPartner` (`src/lib/partner-products.ts:5`) :
   `default_code.startsWith(prefix)`.
4. Réécrit le `displayLabel` via `mapProductName` (`src/lib/product-mapping.ts:7`)
   → `config.labelMap[default_code] ?? default_code`.

#### Chemin « catalogue Supabase » (agences immobilières, simulateur honoraires)

`GET /api/agency/price-catalog` (`src/app/api/agency/price-catalog/route.ts`) :

1. Lit toute la table `product_catalog` (`code`, `odoo_default_code`, `label`).
2. Va chercher les prix dans Odoo (`product.template.list_price`).
3. Retourne un `Record<code, { odoo_default_code, label, price }>`.

Table `product_catalog` créée par `supabase/migrations/product_catalog_sb.sql`
(16 produits pour le prefix `SB_`, naming `SB_ELE_A1` → « EDL Entree -
Appartement 1 chambre »). RLS lecture pour `authenticated`
(`supabase/migrations/product_catalog_rls.sql`).

### A.3 Axe legacy `CLIENT_TEMPLATES` (sale order templates Odoo)

`src/lib/odoo.ts:90-110` : map hardcodée `prefix → typeBien → { entree, sortie }`
(ID de `sale.order.template`). Couvre **CPASBXL** et **AXIS** uniquement, et
sert de fallback dans `submit-rdv` quand `useProductLines === false`
(`src/app/api/submit-rdv/route.ts:254-258`). À considérer comme déprécié dès
qu'un `selectedProduct.id` existe.

### A.4 Bilan source de vérité

| Donnée                          | Source                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| Type de mission (entree/sortie) | Hardcodé front + tag Odoo (`ELE`/`ELS`)                                 |
| Liste des produits par client   | `odoo product.template` filtré par prefix (`default_code LIKE PREFIX_%`)|
| Label affiché (« App 1ch »)     | `portal_clients.product_config.labelMap` OU `product_catalog.label`     |
| Prix HTVA                       | `odoo product.template.list_price`                                      |
| Suppléments / options           | `product.template` (option flag via `product_config.optionKeys`)        |
| Légacy mapping templates        | `CLIENT_TEMPLATES` (CPASBXL, AXIS) — fallback uniquement                |

---

## B. Mapping prix → récap

### B.1 Flow standard (`/demande`)

```
[/demande page mount]
  └─> fetch /api/odoo/products
       └─> portal_clients(prefix, product_config) ─┐
       └─> odooSearch(product.template, sale_ok)  ─┤
       └─> filterProductsByPartner(prefix)         │
       └─> mapProductName(default_code, labelMap) ─┘
       └─> Response: Product[] { id, defaultCode, displayLabel, listPrice, isOption }

[Step 1 — Mission tab]
  └─> mainProducts useMemo (src/app/demande/page.tsx:337-373)
       └─> Filtre regex /_ELL?E_/ ou /_ELL?S_/ selon typeMission
       └─> Cas spécial COMMUNS (filtré sur displayLabel.toLowerCase())
       └─> Tri : COMMUNS / Bureau en fin
       └─> Render chips (l.868-882)

[Step 5 — Récap]
  └─> articles = [selectedProduct, ...selectedOptions]
  └─> subtotalHTVA = Σ listPrice
  └─> tva = subtotalHTVA * 0.21    ← TVA hardcodée
  └─> totalTVAC = subtotalHTVA + tva
  └─> Render SummarySection « Tarification » (l.1656-1671)
```

### B.2 Flow simulateur honoraires (`PriceCalculatorModal`)

```
[Modal mount]
  └─> fetch /api/agency/price-catalog (cached max-age=3600 côté HTTP)
       └─> SELECT product_catalog
       └─> odooSearch(product.template, default_code IN allCodes)
       └─> Map { code → { odoo_default_code, label, price } }

[Sélection user]
  └─> buildCatalogKey(missionType, bienType, chambres)  ex: "entree_appart_2"
  └─> catalogEntry = catalog[catalogKey]
  └─> basePrice = catalogEntry.price OU FALLBACK_PRICES[key] (l.38-66, codé en dur)
  └─> totalHTVA = basePrice + extraRooms*15 + Σ suppléments
  └─> totalTVAC = totalHTVA * 1.21   ← TVA_RATE = 0.21 hardcodée
```

### B.3 TVA

- **Toujours 21 %** — hardcodée à deux endroits :
  - `src/components/PriceCalculatorModal.tsx:75` (`const TVA_RATE = 0.21`)
  - `src/app/demande/page.tsx:1658` (`subtotalHTVA * 0.21` inline)
- Pas de paramétrage par produit ni par organisation.

### B.4 Caching

- HTTP : `Cache-Control: public, max-age=3600` sur `/api/agency/price-catalog`
  (l.71-73). Aucun cache HTTP sur `/api/odoo/products`.
- Mémoization React : `useMemo` sur `mainProducts` / `optionProducts`
  (`src/app/demande/page.tsx:337-388`). Catalogue stocké dans le state du
  modal (un seul fetch par ouverture).
- Aucun cache serveur (Next route cache, Redis, ISR) — chaque hit = call XML-RPC
  Odoo.
- `uidCache` sur l'auth Odoo (`src/lib/odoo.ts:27`) — réutilise l'UID jusqu'à
  401.

---

## C. Composant UI actuel des badges

### C.1 Localisations

| Endroit                              | Fichier:ligne                              | Affichage                                                    |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ |
| Step 1 « Type de bien » (formulaire) | `src/app/demande/page.tsx:868-882`         | Chips horizontales, `rounded-full`, texte = `displayLabel`   |
| Quick request modal                  | `src/components/QuickRequestModal.tsx:227-241` | Chips horizontales, identiques au formulaire             |
| Récap « Tarification »               | `src/app/demande/page.tsx:1656-1671`       | Ligne `SummaryRow` : libellé brut + prix `formatEuro`        |
| Dashboard colonne « Type »           | `src/app/dashboard/page.tsx:756-758`       | Texte simple `"Entrée"`/`"Sortie"` (pas de badge)            |
| Dashboard colonne « Bien »           | `src/app/dashboard/page.tsx:759-761`       | Texte simple = `order.x_studio_type_de_bien_1`               |
| Brouillons liste                     | `src/app/brouillons/page.tsx:31-35`        | Texte « Entrée »/« Sortie » uniquement, pas de typeBien      |
| Mission type Step 1 (haut)           | `src/app/demande/page.tsx:830-857`         | Boutons larges avec icône SVG inline (flèche)                |

### C.2 Style actuel (Tailwind)

Chips produit (formulaire principal — `src/app/demande/page.tsx:872-879`) :

```tsx
className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
  selectedProduct?.id === p.id
    ? "bg-primary text-white"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
}`}
```

- Pas d'icône. Pas de pictogramme.
- Texte vient brut du `displayLabel` (donc dépend de `product_config.labelMap`).
- Token `bg-primary` = `#F5B800` (cf. `docs/DESIGN_SYSTEM.md`).
- Aucun composant `<Badge>` du shadcn n'est utilisé pour ces sélecteurs
  (`src/components/ui/badge.tsx` existe mais n'est pas branché ici).

### C.3 Format des labels (échantillons réels)

| Source             | `default_code`         | `displayLabel` (après mapping)              |
| ------------------ | ---------------------- | ------------------------------------------- |
| Sambre et Biesme   | `SB_ELE_A2`            | « EDL Entree - Appartement 2 chambres »     |
| Everecity (legacy) | `EVERECITY_ELLE_A1CH`  | « App 1ch » (via `labelMap`)                |
| AXIS               | `AXIS_ELE_A1CH`        | label brut Odoo si pas de `labelMap`        |
| CPAS BXL           | `CPASBXL_ELE_A2`       | label brut Odoo                             |

Format hétérogène entre orgs — aucune normalisation côté front.

---

## D. Différences par organisation

### D.1 Mécanisme de filtrage

Une seule clé : **`organizations.odoo_template_prefix`** (héritée par
`portal_clients.odoo_template_prefix` via la migration
`organizations_data_migration.sql`). Le filtre est `default_code LIKE
'<PREFIX>_%'` (`src/lib/partner-products.ts:5`).

### D.2 Orgs connues (d'après les migrations et les regex hardcodées)

| Org              | Prefix     | `odoo_partner_id` | Naming produits         | Source                                       |
| ---------------- | ---------- | ----------------- | ----------------------- | -------------------------------------------- |
| Axis Experts     | `AXIS`     | 88413             | `AXIS_ELE_*`            | `organizations_data_migration.sql:12`        |
| Everecity        | `EVERECITY`| 75694             | `EVERECITY_ELLE_*` (double L) | `organizations_data_migration.sql:26`   |
| CPAS Bruxelles   | `CPASBXL`  | 77104             | `CPASBXL_ELE_*`         | `organizations_data_migration.sql:39`        |
| Sambre & Biesme  | `SB`       | (non listé)       | `SB_ELE_A1`..`SB_ELS_M5`| `product_catalog_sb.sql:8-25`                |
| Org 77091        | `AXIS`     | 77091             | partage le prefix AXIS  | `organizations_data_migration.sql:52`        |

Aucune trace explicite de « **Prodactylo** » comme org cliente dans le code —
le module `src/components/dactylo/` semble être un produit *interne* (envoi en
masse d'EDL) plutôt qu'une org distincte avec son propre catalogue.

### D.3 Customisation par org

- **Labels** : `organizations.product_config` (JSONB) ou
  `portal_clients.product_config` legacy. Structure :
  `{ optionKeys: string[], labelMap: Record<defaultCode, prettyLabel> }`.
  Doc : `supabase/migrations/add_product_config.sql`.
- **Templates de commande** : `CLIENT_TEMPLATES` (`src/lib/odoo.ts:90-110`) —
  hardcodé pour AXIS et CPASBXL uniquement. Legacy.
- **Type de client** : `organizations.client_type ∈ {'social', 'agency'}`
  (`supabase/migrations/organizations.sql:15`) — pilote le simulateur d'honoraires
  et le filtrage par `x_studio_agence_partenaire` côté Odoo.

### D.4 Cas particuliers gérés

- Regex `/_ELL?E_/` / `/_ELL?S_/` (`src/app/demande/page.tsx:340-341`) absorbe
  les deux conventions de nommage (`ELE` vs `ELLE`, `ELS` vs `ELLS`).
- `COMMUNS` filtré sur `displayLabel.toLowerCase()` car le code Odoo ne
  contient pas `ELE`/`ELS` (commentaire `src/app/demande/page.tsx:353`).
- `Bureau` / `Bur.Com` exclu des options (`src/app/demande/page.tsx:386`).
- `HIDDEN_OPTIONS` (`src/components/QuickRequestModal.tsx:6`) :
  `["DEP.INUTILE", "URGENT_24h", "URGENT_24h_CO", "DEPL.INUT"]`.

---

## E. Faisabilité refonte pictogrammes

### E.1 Stack technique disponible

- `lucide-react` v1.8.0 déjà dépendance (`package.json:27`). Utilisé dans 8
  fichiers (boutons, calendrier, dialog). Icônes pertinentes disponibles :
  `Home`, `Building2`, `Hotel`, `Bed`, `DoorOpen`, `DoorClosed`, `Store`,
  `Warehouse`, `LogIn`, `LogOut`.
- **Attention** : v1.8.0 est très ancienne (la stable actuelle est 0.4xx puis
  re-versionnée). Vérifier que les noms d'icônes ci-dessus existent dans cette
  version avant d'écrire du code.
- Tailwind v4 + tokens design système (`docs/DESIGN_SYSTEM.md`) — couleurs
  `bg-primary`, `text-primary-foreground`, `bg-gray-100` réutilisables.
- Composant `Badge` shadcn (`src/components/ui/badge.tsx`) déjà scaffold mais
  non branché — opportunité de l'utiliser.

### E.2 Trois approches

#### Approche 1 — Parsing heuristique du `default_code` côté front

Mapping côté client à partir d'un suffixe.

```ts
function getIconForProduct(defaultCode: string): LucideIcon {
  if (/_A0|_KOT|STUDIO/i.test(defaultCode)) return Bed;
  if (/_A[1-9]/.test(defaultCode))           return Building2;
  if (/_M[1-9]|MAISON/i.test(defaultCode))   return Home;
  if (/BUREAU|BUR\.COM/i.test(defaultCode))  return Store;
  if (/COMMUNS/i.test(defaultCode))          return Warehouse;
  return Building2; // fallback
}
```

- **Pro** : zéro migration, déploiement immédiat, fonctionne pour les 4 orgs
  identifiées (naming homogène autour de `A`/`M` + chiffre).
- **Con** : si une org ajoute un produit hors convention (`SB_PARK_01` p.ex.),
  le pictogramme tombera sur le fallback silencieusement. Couplage front /
  conventions Odoo.
- **Effort** : ~2-3h (helper + tests + intégration dans 3 endroits).

#### Approche 2 — Colonne `icon_key` dans `product_catalog`

Migration + UI admin d'édition + mapping `icon_key → LucideIcon`.

```sql
ALTER TABLE product_catalog ADD COLUMN icon_key TEXT;
UPDATE product_catalog SET icon_key = 'building-2' WHERE odoo_default_code LIKE '%_A%';
-- ...
```

- **Pro** : source de vérité propre, modifiable sans deploy, supporte les cas
  hors convention.
- **Con** : `product_catalog` n'est peuplée que pour le prefix `SB` aujourd'hui
  (`product_catalog_sb.sql`). Pour bénéficier de la colonne, il faut **d'abord
  remplir la table pour toutes les orgs** (AXIS, EVERECITY, CPASBXL) — sinon
  les autres clients tombent sur le fallback. Migration + UI admin
  (`/admin/organizations/[id]/articles`) à étendre pour éditer `icon_key`.
- **Effort** : ~1-1.5j (migration + seed des 4 orgs + UI admin + intégration).

#### Approche 3 — Mapping hardcodé côté front basé sur le `code` court

```ts
const ICON_MAP: Record<string, LucideIcon> = {
  ELE_A1: Building2, ELE_A2: Building2, ELE_A3: Building2,
  ELE_M1: Home,     ELE_M2: Home,     ELE_M3: Home,
  ELE_KOT: Bed,     ELE_STUDIO: Bed,
  // ...
};
```

- **Pro** : explicite, lisible, typé.
- **Con** : ne marche que pour les orgs qui exposent un `code` court
  (`product_catalog.code`). Pour le chemin Odoo direct, on n'a que le
  `default_code` long → il faudrait extraire le suffixe par regex (= Approche 1).
- **Effort** : ~3-4h, mais à fusionner avec Approche 1 dans tous les cas.

### E.3 Recommandation

**Approche 1 (parsing heuristique)** comme V1 — livrable en une demi-journée,
zéro migration, suffisant pour les 4 orgs actuelles dont le naming est
remarquablement homogène (`A` = appartement + nb chambres, `M` = maison + nb
chambres, codes spéciaux `KOT`/`COMMUNS`/`BUREAU`).

Garder l'**Approche 2** en V2 si :
- une org ajoute un produit hors convention, ou
- le besoin émerge de différencier visuellement deux produits qui se ressemblent
  (p.ex. « App 2ch standard » vs « App 2ch loft »).

Dans tous les cas : passer le rendu actuel des chips
(`src/app/demande/page.tsx:868`, `src/components/QuickRequestModal.tsx:227`)
sur un composant unique `<ProductChip product={p} selected={...} />` —
aujourd'hui les deux blocs sont dupliqués à l'identique sauf pour
`onClick`.

---

## F. Estimation effort refonte

| Lot                                                                      | Approche 1 | Approche 2 |
| ------------------------------------------------------------------------ | ---------- | ---------- |
| Helper `getIconForProduct` + tests vitest                                | 1 h        | 0,5 h      |
| Composant `<ProductChip>` mutualisé                                      | 1 h        | 1 h        |
| Refacto `src/app/demande/page.tsx` (Step 1 + récap)                      | 1 h        | 1 h        |
| Refacto `src/components/QuickRequestModal.tsx`                           | 0,5 h      | 0,5 h      |
| Migration SQL `icon_key` + seed 4 orgs                                   | —          | 2 h        |
| UI admin `/admin/organizations/[id]` édition `icon_key`                  | —          | 3 h        |
| QA visuelle (4 orgs × 2 missions × N produits)                           | 1 h        | 1,5 h      |
| **Total**                                                                | **~4,5 h** | **~9,5 h** |

Hors scope (à arbitrer séparément) :
- Refonte du sélecteur « Type de mission » en haut de Step 1 — déjà iconisé
  avec un SVG inline (`src/app/demande/page.tsx:830-857`), pourrait être
  remplacé par `LogIn`/`LogOut` lucide pour cohérence.
- Affichage des pictogrammes dans la colonne « Bien » du dashboard
  (`src/app/dashboard/page.tsx:759`) — actuellement texte brut Odoo
  `x_studio_type_de_bien_1`, demanderait un parsing séparé car la valeur n'est
  ni un `default_code` ni un `code` court.
