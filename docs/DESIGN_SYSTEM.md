# Design System — Axis Experts RDV

Socle technique mis en place au chantier 5. Toute la suite (chantiers 1 / 2 / 3)
s'appuie sur ce document.

## Principes

- Produit **Axis Experts** : jaune `#F5B800` comme couleur primaire.
- **Interdiction absolue** d'introduire des tokens `copilio-*` dans ce repo. Ce
  repo n'est pas Copilio — si tu copies un composant depuis Copilio, retire les
  préfixes/tokens `copilio-*` et remplace-les par les tokens shadcn standards
  (`--color-primary`, `--color-foreground`, etc.).
- Les composants viennent de shadcn/ui (scaffoldés manuellement dans
  `src/components/ui/`). Ce sont *nos* fichiers — libre à nous de les modifier.

## Palette

Définie dans `src/app/globals.css` via `@theme inline` (Tailwind v4). Les classes
Tailwind `bg-primary`, `text-primary-foreground`, `bg-destructive`,
`border-border`, etc. sont câblées sur ces variables.

| Token                         | Valeur     | Usage                             |
|-------------------------------|-----------|-----------------------------------|
| `--color-primary`             | `#F5B800` | Jaune Axis, CTA principaux, focus |
| `--color-primary-foreground`  | `#1a1a1a` | Texte sur fond primaire           |
| `--color-primary-dark`        | `#d9a400` | Hover / états appuyés             |
| `--color-primary-light`       | `#F5B80020` | Fond accent doux                |
| `--color-background`          | `#ffffff` | Fond de page                      |
| `--color-foreground`          | `#333333` | Texte par défaut                  |
| `--color-muted` / `-foreground` | `#f5f5f5` / `#737373` | Blocs atténués      |
| `--color-accent` / `-foreground` | `#F5B80020` / `#333333` | Hover ghost/outline |
| `--color-destructive`         | `#dc2626` | Actions dangereuses               |
| `--color-border` / `--color-input` | `#e5e5e5` | Bordures, inputs             |
| `--color-ring`                | `#F5B800` | Anneau focus                      |

Échelle de gris : `--color-gray-50` → `--color-gray-900` (Neutral).

## Composants disponibles

Tous sous `src/components/ui/` :

| Fichier             | Export(s)                                                                 |
|---------------------|---------------------------------------------------------------------------|
| `button.tsx`        | `Button`, `buttonVariants` (variantes : default/destructive/outline/secondary/ghost/link ; tailles : default/sm/lg/icon) |
| `alert-dialog.tsx`  | `AlertDialog*` (confirmation destructive — remplace les `confirm()` natifs) |
| `dialog.tsx`        | `Dialog*` (modales classiques)                                            |
| `checkbox.tsx`      | `Checkbox`                                                                |
| `label.tsx`         | `Label`                                                                   |
| `tooltip.tsx`       | `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`         |
| `badge.tsx`         | `Badge`, `badgeVariants`                                                  |
| `popover.tsx`       | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`           |
| `calendar.tsx`      | `Calendar` (wrapper `react-day-picker` v9)                                |
| `sonner.tsx`        | `Toaster` (monté une seule fois dans `src/app/layout.tsx`)                |

Helpers dans `src/lib/` :

- `utils.ts` → `cn()` : merge de classes Tailwind (clsx + tailwind-merge)
- `toast.ts` → `toast.success / error / info / warning / message / promise / dismiss`

## Ajouter un nouveau composant shadcn

1. **Ne pas utiliser** `pnpm dlx shadcn@latest add …` — il écrase les tokens
   couleurs et peut introduire des variables non-Axis.
2. Consulter le skill `.claude/skills/shadcn-studio/references/components/<nom>.md`
   pour les variantes disponibles et choisir la plus adaptée au contexte.
3. Scaffolder manuellement le fichier dans `src/components/ui/<nom>.tsx` en
   utilisant **uniquement** les tokens shadcn standards (`bg-primary`,
   `text-foreground`, `border-border`, `ring-ring`, etc.). Si un token est
   manquant dans `globals.css`, l'ajouter là — pas dans le composant.
4. Vérifier dans un navigateur (pas juste `tsc`) : le jaune `#F5B800` doit
   apparaître sur les éléments primaires.

## Règle absolue

**Aucun token `copilio-*` dans ce repo.** Les tokens autorisés sont :
- Les tokens shadcn standards listés ci-dessus
- L'échelle `gray-*`
- Les tokens legacy Axis (`--color-dark`, `--color-dark-light`, `--color-primary-dark`, `--color-primary-light`)

Si un PR introduit un token `copilio-*`, il doit être rejeté.

## noUncheckedIndexedAccess — dette technique

Le flag `noUncheckedIndexedAccess` a été activé dans `tsconfig.json` pendant le
chantier 5. Il révèle **53 erreurs** dans **7 fichiers** pré-existants, non
corrigées à ce stade (hors scope du chantier 5) :

- `src/app/admin/organizations/page.tsx` (4 erreurs)
- `src/app/admin/page.tsx` (3 erreurs)
- `src/app/api/odoo/attachments/download/route.ts` (11 erreurs)
- `src/app/api/odoo/messages/route.ts` (1 erreur)
- `src/app/api/rdv-custom-values/route.ts` (1 erreur)
- `src/app/api/submit-rdv/route.ts` (25 erreurs)
- `src/app/demande/page.tsx` (2 erreurs)

La majorité (`TS2532` / `TS18048`) concerne des accès indexés (`array[i]`,
`att`, `baseProduct`, …) utilisés sans garde après destructuration ou `find`.
Ces erreurs seront traitées dans les chantiers fonctionnels qui touchent déjà
ces fichiers.

## Tests

- `pnpm test` lance Vitest (jsdom).
- Configuration : `vitest.config.ts`.
- Test de sanité : `src/lib/utils.test.ts` (vérifie le merge tailwind du `cn`).
