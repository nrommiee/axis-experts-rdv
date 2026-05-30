# DESIGN_SPEC.md — Portail RDV Axis Experts

> **Audit design (lecture seule).** Objectif : documenter le design system existant
> pour reproduire **à l'identique** le look sur une nouvelle page (formulaire de demande de RDV).
> Sources auditées : `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/utils.ts`,
> `package.json`, `src/components/ui/*`, `src/app/demande/page.tsx`.
> Aucun fichier de l'app n'a été modifié (seul ce document a été créé).

---

## 1. Stack front

| Élément | Détail |
|---|---|
| **Framework** | **Next.js `^16.2.5`** (App Router, dossier `src/app/`). ⚠️ Version récente avec breaking changes — voir `AGENTS.md`. |
| **UI lib** | React `19.2.4` / React-DOM `19.2.4`. |
| **Styling** | **Tailwind CSS v4** via `@tailwindcss/postcss` (cf. `postcss.config.mjs`). **Pas de `tailwind.config.js`** : la configuration se fait **en CSS** dans `src/app/globals.css` via `@import "tailwindcss"` + bloc `@theme inline`. |
| **Pattern composants** | Style **shadcn/ui-like** (composants copiés dans `src/components/ui/`, **pas** de `components.json`/CLI). Primitives **Radix UI** (`@radix-ui/react-*` : dialog, alert-dialog, checkbox, label, popover, tooltip, slot). Variantes via **`class-variance-authority` (cva)**. Fusion de classes via **`tailwind-merge` + `clsx`** (helper `cn`). `tailwind-variants` également présent. |
| **Icônes** | **`lucide-react`** (`^1.8.0`). |
| **Dates** | `react-day-picker` `^9`, `date-fns` + `date-fns-tz` (locale `fr`, `weekStartsOn: 1`). |
| **Toasts** | **`sonner`** (`<Toaster>` monté dans le layout). |
| **Polices** | **Aucune police custom / aucun `next/font` / aucune Google Font.** Stack système définie en token : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. `<html>` a la classe `antialiased`. |
| **Autres** | Supabase (`@supabase/ssr`), Resend (emails), Odoo (xmlrpc), Google Maps (autocomplete adresse), recharts, zod. |

### Helper `cn` (`src/lib/utils.ts`)
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Layout racine (`src/app/layout.tsx`)
```tsx
export const metadata = {
  title: "Axis Experts - Portail de demande de RDV",
  description: "Demandez un rendez-vous pour un état des lieux avec Axis Experts",
  icons: { icon: "https://axis-experts.be/.../cropped-Axis-favicon-32x32.png" },
};
// <html lang="fr" className="h-full antialiased">
//   <body className="min-h-full flex flex-col font-sans"> {children} <Toaster /> </body>
```

---

## 2. Design tokens (valeurs RÉELLES, copiables)

> En Tailwind v4, les tokens vivent **dans le CSS** sous `@theme`. Chaque `--color-x`
> génère automatiquement les utilitaires `bg-x`, `text-x`, `border-x`, `ring-x`, etc.
> **Couleur de marque = jaune doré `#F5B800`.** Thème **clair uniquement** (pas de `.dark`).

### Bloc à copier tel quel — `src/app/globals.css`
```css
@import "tailwindcss";

@theme inline {
  /* === Marque (jaune Axis) === */
  --color-primary: #F5B800;
  --color-primary-foreground: #1a1a1a;
  --color-primary-dark: #d9a400;   /* hover du primaire */
  --color-primary-light: #F5B80020; /* jaune à ~12% (alpha 0x20) : fonds/accents */

  /* === Texte de marque === */
  --color-dark: #333333;
  --color-dark-light: #555555;

  /* === Surfaces / base === */
  --color-background: #ffffff;
  --color-foreground: #333333;
  --color-card: #ffffff;
  --color-card-foreground: #333333;
  --color-popover: #ffffff;
  --color-popover-foreground: #333333;

  /* === Secondaire / muted / accent === */
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #262626;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-accent: #F5B80020;        /* = primary-light */
  --color-accent-foreground: #333333;

  /* === États === */
  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;

  /* === Bordures / inputs / focus === */
  --color-border: #e5e5e5;
  --color-input: #e5e5e5;
  --color-ring: #F5B800;            /* anneau de focus = jaune */

  /* === Échelle de gris === */
  --color-gray-50:  #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #e5e5e5;
  --color-gray-300: #d4d4d4;
  --color-gray-400: #a3a3a3;
  --color-gray-500: #737373;
  --color-gray-600: #525252;
  --color-gray-700: #404040;
  --color-gray-800: #262626;
  --color-gray-900: #171717;

  /* === Rayons === */
  --radius-sm: 0.25rem;  /* 4px  */
  --radius-md: 0.375rem; /* 6px  */
  --radius-lg: 0.5rem;   /* 8px  */
  --radius-xl: 0.75rem;  /* 12px */

  /* === Typo === */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}

/* Focus global natif sur tous les champs : outline jaune */
input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}
```

### Couleurs — résumé sémantique
| Rôle | Token / valeur |
|---|---|
| **Primaire (marque)** | `#F5B800` (jaune doré) — texte foncé dessus `#1a1a1a` |
| Primaire hover | `#d9a400` (`primary-dark`) ou `primary/90` |
| Accent / fond sélectionné | `#F5B80020` (`primary-light` = `accent`) |
| Texte principal | `#333333` (`foreground` / `dark`) |
| Texte secondaire / muted | `#737373` (`muted-foreground` / `gray-500`) |
| Fond page / cartes | `#ffffff` ; fond doux : `gray-50 #fafafa` / `gray-100 #f5f5f5` |
| Bordures | `#e5e5e5` (`border` / `input` / `gray-200`) |
| Danger / erreur | `#dc2626` (`destructive`) — texte dessus `#ffffff` |
| Anneau de focus | `#F5B800` (`ring`) |

### Typographie
- **Famille :** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (pas de webfont). `antialiased`.
- **Échelle observée (utilitaires Tailwind) :**
  | Rôle | Classe | Taille |
  |---|---|---|
  | Titre de section (`h2`) | `text-lg font-bold` | 1.125rem / 18px, 700 |
  | Sous-titre / nom de groupe (`h3`) | `font-semibold` | 1rem, 600 |
  | Corps / inputs | `text-sm` | 0.875rem / 14px |
  | Labels | `text-sm font-medium` | 14px, 500 |
  | Hints / texte d'aide / footer | `text-xs` | 0.75rem / 12px |
  | Badges | `text-xs font-semibold` | 12px, 600 |
- **Poids utilisés :** 400 (normal), 500 (`font-medium`), 600 (`font-semibold`), 700 (`font-bold`).
- `leading-none` sur les labels ; `line-height` par défaut Tailwind ailleurs.

### Rayons / ombres / espacements
- **Rayons :** tokens `sm 4px → xl 12px`. En pratique les cartes/inputs utilisent `rounded-xl` (12px) et `rounded-2xl` (16px, valeur Tailwind par défaut) ; chips `rounded-full` ; petits éléments `rounded-md`.
- **Ombres :** échelle Tailwind par défaut — `shadow-sm` (boutons/badges), `shadow-md` (popover/tooltip), `shadow-lg` (carte de formulaire, dialog, toast).
- **Espacements récurrents :** padding cartes `p-5 sm:p-7` ; sections `space-y-5`/`space-y-6` ; grilles `gap-2`/`gap-3` ; inputs `px-3 py-2.5` (compact) ou `px-4 py-3` (large).
- **Overlay modales :** `bg-black/60`.

### Breakpoints (Tailwind par défaut)
- `sm` = 640px (paddings, layout colonnes), `md` = 768px (ex. calendrier 1→2 mois), `lg` = 1024px.
- Conteneurs : `max-w-3xl` (formulaire), `max-w-4xl` (header), `max-w-6xl` (vue récap large), `max-w-lg` (stepper), centrés via `mx-auto`.

---

## 3. Composants UI réutilisables (`src/components/ui/`)

> Tous consomment le helper `cn(...)` et les tokens ci-dessus.

### Button (`button.tsx`) — cva
Base : `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50` (+ auto-size des `svg` à `size-4`).

| `variant` | Classes |
|---|---|
| `default` (primaire) | `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm` |
| `outline` | `border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| `size` | Classes |
|---|---|
| `default` | `h-9 px-4 py-2` |
| `sm` | `h-8 rounded-md px-3 text-xs` |
| `lg` | `h-10 rounded-md px-6` |
| `icon` | `h-9 w-9` |

`defaultVariants: { variant: "default", size: "default" }`. Supporte `asChild` (Radix `Slot`).

### Badge (`badge.tsx`) — cva
Base : `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2`.
- `default` : `border-transparent bg-primary text-primary-foreground hover:bg-primary/80`
- `secondary` : `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `destructive` : `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80`
- `outline` : `text-foreground`

### Champs de formulaire
> ⚠️ **Il n'existe PAS de composant `Input`/`Select`/`Textarea` dans `ui/`.** Les champs sont des éléments HTML natifs stylés en Tailwind directement dans les pages, + le **focus jaune global** défini dans `globals.css`.

Classe d'input de référence (page `/demande`) :
```
w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 text-sm
```
Variante « large » : `px-4 py-3 ... bg-white`. Label associé : `text-sm font-medium text-gray-600`. Astérisque requis : `text-destructive ml-1`. Message d'erreur : `flex items-center gap-1 px-1 text-sm text-destructive` (+ icône `AlertCircle size-4`).

### Checkbox (`checkbox.tsx`) — Radix
`peer h-4 w-4 shrink-0 rounded-sm border border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground` (indicateur = `CheckIcon h-4 w-4`).
> Sur la page `/demande`, certaines cases utilisent un `<input type="checkbox" className="accent-primary">` natif.

### Label (`label.tsx`) — cva (Radix Label)
`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`.

### Card / conteneur
Pas de composant `Card` dédié ; le pattern « carte » est inline :
```
bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7
```

### Chip produit (`product-chip.tsx`)
`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all`
- sélectionné : `bg-primary text-white`
- non sélectionné : `bg-gray-100 text-gray-600 hover:bg-gray-200`

### Dialog / Alert-Dialog (`dialog.tsx`, `alert-dialog.tsx`) — Radix
- Overlay : `fixed inset-0 z-50 bg-black/60` + animations `fade-in/out`.
- Content : `fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-border bg-background p-6 shadow-lg sm:rounded-lg` (+ `zoom/fade`).
- Bouton fermer : `absolute right-4 top-4 ... XIcon h-4 w-4`. Header : `flex flex-col space-y-1.5 text-center sm:text-left`.

### Popover (`popover.tsx`) / Tooltip (`tooltip.tsx`) — Radix
- Popover content : `z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md` (+ `zoom-in/out-95`).
- Tooltip content : `z-50 rounded-md border border-border bg-popover px-3 py-1.5 text-sm shadow-md` (+ `fade/zoom-in-95`).

### Calendar (`calendar.tsx`) & Date-range-picker (`date-range-picker.tsx`)
`react-day-picker` stylé aux tokens : jour sélectionné `bg-primary text-primary-foreground`, aujourd'hui `bg-accent`, milieu de plage `bg-accent`, bouton-jour = variante `ghost` `h-9 w-9` (`h-10 w-10` sur mobile dans le range-picker), nav via `buttonVariants({variant:"outline"})`. Range-picker « façon Booking » (2 clics, aperçu au survol, locale `fr`, `weekStartsOn:1`, 1 mois mobile / 2 mois desktop), trigger = `Button variant="outline"` pleine largeur avec icône calendrier + chevron.

### Toaster (`sonner.tsx`)
`theme="light"`, `position="top-right"`, `richColors`, `closeButton` ; classes mappées sur les tokens (`bg-background`, `text-foreground`, `border-border`, action `bg-primary`).

---

## 4. Thème, responsive & animations

- **Thème :** **clair uniquement.** Aucun bloc `.dark` ni `prefers-color-scheme` ; le toaster est forcé `theme="light"`. Pas de dark mode à gérer.
- **Responsive :** mobile-first, breakpoints Tailwind standard (`sm` 640 / `md` 768 / `lg` 1024). Largeurs max par contexte (`max-w-3xl` formulaire, `max-w-4xl` header, `max-w-6xl` récap), `mx-auto`, paddings qui montent (`p-5 sm:p-7`), grilles qui se réorganisent (`grid-cols-2`, `grid-cols-6` + `col-span-*`).
- **Focus :** double système — anneau Tailwind `focus-visible:ring-2 ring-ring ring-offset-2` (jaune) sur les composants, **et** `outline: 2px solid #F5B800` natif sur `input/select/textarea` via `globals.css`.
- **Transitions :** `transition-colors` (boutons/badges), `transition-all` (chips, cartes de sélection), animations d'entrée/sortie Radix/Tailwind (`animate-in/out`, `fade-in-0`, `zoom-in-95`, `fade-out-0`, `zoom-out-95`) sur dialogs/popovers/tooltips. Durée modales `duration-200`.

---

## 5. Logique de mise en page (page `/demande`, le formulaire RDV)

1. **En-tête fixe en haut :** bandeau blanc `bg-white border-b border-gray-200`, contenu dans `max-w-4xl mx-auto px-4 py-3`, disposé en `flex items-center justify-between` (logo à gauche, actions à droite).
2. **Zone principale centrée :** `<main className="mx-auto px-4 py-5 max-w-3xl">` (passe à `max-w-6xl` sur l'étape de récapitulatif). Tout le contenu respire sur fond blanc général.
3. **Stepper de progression :** `flex items-center justify-center mb-6 max-w-lg mx-auto` avec pastilles d'étape rondes (`w-6 h-6 rounded-full bg-primary text-white text-xs`) reliées par une ligne — code couleur jaune marque pour l'étape active.
4. **Carte de formulaire :** un grand bloc `bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7`, sections espacées en `space-y-5/6`. Sous-blocs regroupés dans des cartes douces `bg-gray-50 rounded-xl p-5`, titrés par une pastille numérotée (`rounded-full bg-primary text-white`) + libellé `font-semibold`.
5. **Champs & sélections :** inputs `rounded-xl border-gray-200 bg-gray-50` en grilles 2/6 colonnes ; choix de type via boutons-cartes `p-3 rounded-xl border-2` qui passent à `border-primary bg-primary-light` une fois sélectionnés ; chips produits arrondis jaunes ; date via popover calendrier. CTA = `Button` primaire jaune (`bg-primary text-primary-foreground`). Erreurs en `text-destructive` avec icône.

---

## Comment recréer ce look en 5 lignes

1. **Tailwind v4 sans config JS** : `@import "tailwindcss"` + bloc `@theme` ci-dessus ; helper `cn = twMerge(clsx(...))` ; police **système** (aucune webfont), `<body class="antialiased">`.
2. **Marque = jaune `#F5B800`** (`primary`, texte foncé `#1a1a1a` dessus), accent/fond sélection `#F5B80020`, texte `#333`, gris muted `#737373`, bordures `#e5e5e5`, danger `#dc2626`, anneau de focus jaune.
3. **Boutons (cva)** : primaire `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md h-9 px-4` ; variantes outline/secondary/ghost/link ; champs = HTML natif `rounded-xl border-gray-200 bg-gray-50 px-3 py-2.5 text-sm` + outline jaune au focus.
4. **Conteneurs** : carte `bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7`, sous-cartes `bg-gray-50 rounded-xl p-5`, pastilles numérotées rondes jaunes, chips `rounded-full`, modales/popovers Radix sur overlay `bg-black/60`.
5. **Système** : thème clair uniquement, breakpoints Tailwind (sm 640 / md 768), largeurs `max-w-3xl/4xl`, animations `transition-colors`/`fade/zoom-in-95`, icônes `lucide-react`, toasts `sonner` (top-right, richColors).
