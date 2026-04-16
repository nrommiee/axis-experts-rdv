---
name: shadcn-studio
description: Library of pre-built shadcn/ui component variants from ShadcnStudio. Use when building Next.js/React interfaces to select the most appropriate component variant (accordion, button, card, alert, etc.) based on context. Contains 300+ professionally designed components with multiple style variations per category.
---

# ShadcnStudio Components Library

Pre-built shadcn/ui component variants for Next.js/React applications.

## Usage Workflow

1. When building UI, identify needed component types (accordion, button, card, etc.)
2. Read the relevant component file from `references/components/`
3. Select the variant that best fits the use case
4. Adapt content (texts, icons, data) to match the project context

## Component Selection Guidelines

Choose variants based on:
- **Visual hierarchy**: Simple variants for secondary actions, rich variants for primary content
- **Information density**: Icon variants for compact spaces, avatar/media variants for rich content
- **User interaction**: Expandable variants (plus/minus icons) for progressive disclosure
- **Branding**: Outlined/filled variants based on design system

## Available Components

| Category | File | Variants | Best For |
|----------|------|----------|----------|
| Accordion | `references/components/accordion.md` | 16 | FAQ, collapsible sections, nested content |

## Implementation Notes

- All components use `@/components/ui/` imports (shadcn/ui standard)
- Icons from `lucide-react`
- Tailwind classes for styling - adapt colors to project theme (teal for AutoState)
- Replace placeholder content with actual project data
