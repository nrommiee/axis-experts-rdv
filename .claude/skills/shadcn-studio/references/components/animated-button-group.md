# Animated Button Group Components

4 variants (13-16) from ShadcnStudio. Button groups with advanced animations.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 13 | Ripple Effect | motion/react, ripple-button.tsx | Material-style click feedback on group |
| 14 | Reveal on Hover | CSS only | Like/Dislike with expanding labels |
| 15 | Scale on Tap | motion/react | Previous/Next with tap animation |
| 16 | Shine Effect | CSS only | Upload/Download/Share with shine |

---

## 13. Ripple Effect

Button group using RippleButton component for Material-style click feedback.

### Dependencies

Requires the `RippleButton` component from `animated-button.md` (variant 39).

```bash
npm install motion
```

### Usage

```tsx
import { ArchiveIcon, InboxIcon, SendHorizonalIcon } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'

const ButtonGroupRippleDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <RippleButton variant='outline' className='rounded-none rounded-l-md shadow-none focus-visible:z-10'>
        <InboxIcon />
        Inbox
      </RippleButton>
      <RippleButton variant='outline' className='rounded-none shadow-none focus-visible:z-10'>
        <ArchiveIcon />
        Archived
      </RippleButton>
      <RippleButton variant='outline' className='rounded-none rounded-r-md shadow-none focus-visible:z-10'>
        <SendHorizonalIcon />
        Sent
      </RippleButton>
    </div>
  )
}

export default ButtonGroupRippleDemo
```

### UI Component: ripple-button.tsx

See `animated-button.md` variant 39 for the complete `RippleButton` component.

---

## 14. Reveal on Hover

Buttons that expand to reveal labels on hover with color change.

### Usage

```tsx
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupRevealDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button
        variant='outline'
        className='group w-20 justify-start gap-3 overflow-hidden rounded-none rounded-l-md shadow-none transition-all duration-200 not-hover:w-10 hover:bg-sky-500/10 hover:text-sky-500 focus-visible:z-10 dark:hover:bg-sky-400/10 dark:hover:text-sky-400'
      >
        <ThumbsUpIcon />
        Like
      </Button>
      <Button
        variant='outline'
        className='hover:bg-destructive/10! group hover:text-destructive w-24.5 justify-end gap-3 overflow-hidden rounded-none rounded-r-md shadow-none transition-all duration-200 not-hover:w-10 focus-visible:z-10'
      >
        Dislike
        <ThumbsDownIcon />
      </Button>
    </div>
  )
}

export default ButtonGroupRevealDemo
```

### Key Classes

- `not-hover:w-10` - Collapsed width when not hovered
- `w-20` / `w-24.5` - Expanded width on hover
- `transition-all duration-200` - Smooth expansion animation

---

## 15. Scale on Tap

Previous/Next buttons with scale animation on tap using motion.

### Dependencies

```bash
npm install motion
```

### Usage

```tsx
import * as motion from 'motion/react-client'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupScaleDemo = () => {
  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-md shadow-xs'>
      <Button className='rounded-none rounded-l-md transition-none focus-visible:z-10' asChild>
        <motion.button whileTap={{ scale: 0.9 }}>
          <ChevronLeftIcon />
          Previous
        </motion.button>
      </Button>
      <Button className='rounded-none rounded-r-md transition-none focus-visible:z-10' asChild>
        <motion.button whileTap={{ scale: 0.9 }}>
          Next
          <ChevronRightIcon />
        </motion.button>
      </Button>
    </div>
  )
}

export default ButtonGroupScaleDemo
```

### Notes

Uses `asChild` prop to pass Button styles to motion.button element.

---

## 16. Shine Effect

Button group with shine sweep effect on hover.

### Usage

```tsx
import { Button } from '@/components/ui/button'

const ButtonGroupShineDemo = () => {
  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-md shadow-xs'>
      <Button className='relative overflow-hidden rounded-none rounded-l-md before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] focus-visible:z-10 dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%,transparent_100%)]'>
        Upload
      </Button>
      <Button className='relative overflow-hidden rounded-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] focus-visible:z-10 dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%,transparent_100%)]'>
        Download
      </Button>
      <Button className='relative overflow-hidden rounded-none rounded-r-md before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] focus-visible:z-10 dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%,transparent_100%)]'>
        Share
      </Button>
    </div>
  )
}

export default ButtonGroupShineDemo
```

### Reusable Shine Class

You can extract the shine effect into a utility class:

```css
.btn-shine {
  @apply relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%,transparent_100%)];
}
```
