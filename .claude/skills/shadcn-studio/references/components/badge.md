# Badge Components

24 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Primary filled | Default label |
| 2 | Secondary | Secondary filled | Less emphasis |
| 3 | Destructive | Red filled | Errors, warnings |
| 4 | Outline | Border only | Subtle label |
| 5 | Dot | With dot indicator | Status indicator |
| 6 | Rounded | Square corners | Card-style |
| 7 | Number | Numeric count | Notifications |
| 8 | Large | Bigger size | Prominent label |
| 9 | Small | Smaller size | Compact label |
| 10 | With Icon | Star icon | Featured items |
| 11 | Link | With arrow | Clickable badge |
| 12 | Closable | X button | Removable tags |
| 13 | Selectable | Checkbox | Toggle selection |
| 14 | Gradient | Gradient bg | Premium/special |
| 15 | Gradient Outline | Gradient border | Premium outline |
| 16 | In Progress | Amber dot | Status: pending |
| 17 | Blocked | Red dot | Status: blocked |
| 18 | Completed | Green dot | Status: done |
| 19 | Pending | Amber outline + icon | Status badge |
| 20 | Failed | Red outline + icon | Error status |
| 21 | Successful | Green outline + icon | Success status |
| 22 | Avatar | With image | User badge |
| 23 | Cart | On icon | Shopping cart |
| 24 | Status Online | On avatar | User online |

---

## 1. Default

Basic primary badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeDemo = () => {
  return <Badge>Default</Badge>
}
```

---

## 2. Secondary

Secondary variant.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeSecondaryDemo = () => {
  return <Badge variant='secondary'>Secondary</Badge>
}
```

---

## 3. Destructive

Red/error variant.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeDestructiveDemo = () => {
  return <Badge variant='destructive'>Destructive</Badge>
}
```

---

## 4. Outline

Border only, transparent background.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeOutlineDemo = () => {
  return <Badge variant='outline'>Outline</Badge>
}
```

---

## 5. With Dot

Status dot indicator.

```tsx
const BadgeDotDemo = () => {
  return (
    <span className='inline-flex w-fit shrink-0 items-center justify-center gap-1 px-2 py-0.5 text-xs font-medium whitespace-nowrap'>
      <span className='bg-primary size-2 rounded-full' aria-hidden='true' />
      Dot Badge
    </span>
  )
}
```

---

## 6. Rounded (Square)

Square corners badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeRoundedDemo = () => {
  return <Badge className='rounded-sm'>Rounded</Badge>
}
```

---

## 7. Number

Numeric notification badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeNumberDemo = () => {
  return <Badge className='h-5 min-w-5 px-1 tabular-nums'>8</Badge>
}
```

---

## 8. Large

Larger size badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeLargeDemo = () => {
  return <Badge className='px-3 py-1'>Large</Badge>
}
```

---

## 9. Small

Smaller size badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeSmallDemo = () => {
  return <Badge className='px-1.5 py-px'>Small</Badge>
}
```

---

## 10. With Icon

Badge with star icon.

```tsx
import { StarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgeWithIconDemo = () => {
  return (
    <Badge>
      <StarIcon className='size-3' />
      With Icon
    </Badge>
  )
}
```

---

## 11. Link Badge

Clickable badge with arrow.

```tsx
import { ArrowRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgeLinkDemo = () => {
  return (
    <Badge asChild>
      <a href='#' className='focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-0'>
        Link <ArrowRightIcon className='size-3' />
      </a>
    </Badge>
  )
}
```

---

## 12. Closable

Dismissible badge with X button.

```tsx
'use client'
import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgeClosableDemo = () => {
  const [isActive, setIsActive] = useState(true)
  if (!isActive) return null
  return (
    <Badge>
      Closable
      <button
        className='focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground/60 hover:text-primary-foreground -my-px -ms-px -me-1.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]'
        aria-label='Close'
        onClick={() => setIsActive(false)}
      >
        <XIcon className='size-3' aria-hidden='true' />
      </button>
    </Badge>
  )
}
```

---

## 13. Selectable

Toggle selection with checkbox.

```tsx
'use client'
import { useState, useId } from 'react'
import { CheckCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const BadgeSelectableDemo = () => {
  const [selected, setSelected] = useState(false)
  const id = useId()
  return (
    <Badge
      variant={selected ? 'secondary' : 'outline'}
      className='has-focus-visible:border-ring/50 has-focus-visible:ring-ring/50 relative cursor-pointer rounded-sm outline-none has-focus-visible:ring-2'
    >
      <Checkbox
        id={id}
        className='peer sr-only after:absolute after:inset-0'
        checked={selected}
        onCheckedChange={checked => setSelected(!!checked)}
      />
      <CheckCircleIcon
        className='hidden size-3 text-green-600 peer-data-[state=checked]:block dark:text-green-400'
        aria-hidden='true'
      />
      <label htmlFor={id} className='cursor-pointer select-none after:absolute after:inset-0'>
        {selected ? 'Selected' : 'Selectable'}
      </label>
    </Badge>
  )
}
```

---

## 14. Gradient

Gradient background badge.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeGradientDemo = () => {
  return (
    <Badge className='rounded-sm border-transparent bg-gradient-to-r from-indigo-500 to-pink-500 [background-size:105%] bg-center text-white'>
      Gradient
    </Badge>
  )
}
```

---

## 15. Gradient Outline

Gradient border with transparent background.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeGradientOutlineDemo = () => {
  return (
    <div className='flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 p-0.5'>
      <Badge className='bg-background hover:bg-background text-foreground border-none'>Gradient Outline</Badge>
    </div>
  )
}
```

---

## 16. In Progress (Amber)

Status badge with amber dot.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeInProgressDemo = () => {
  return (
    <Badge className='border-none bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 focus-visible:outline-none dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5'>
      <span className='size-1.5 rounded-full bg-amber-600 dark:bg-amber-400' aria-hidden='true' />
      In Progress
    </Badge>
  )
}
```

---

## 17. Blocked (Red)

Status badge with red dot.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeBlockedDemo = () => {
  return (
    <Badge className='bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none'>
      <span className='bg-destructive size-1.5 rounded-full' aria-hidden='true' />
      Blocked
    </Badge>
  )
}
```

---

## 18. Completed (Green)

Status badge with green dot.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeCompletedDemo = () => {
  return (
    <Badge className='border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
      <span className='size-1.5 rounded-full bg-green-600 dark:bg-green-400' aria-hidden='true' />
      Completed
    </Badge>
  )
}
```

---

## 19. Pending (Outline)

Amber outline with icon.

```tsx
import { AlertCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgePendingDemo = () => {
  return (
    <Badge
      variant='outline'
      className='rounded-sm border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 [a&]:hover:bg-amber-600/10 [a&]:hover:text-amber-600/90 dark:[a&]:hover:bg-amber-400/10 dark:[a&]:hover:text-amber-400/90'
    >
      <AlertCircleIcon className='size-3' />
      Pending
    </Badge>
  )
}
```

---

## 20. Failed (Outline)

Red outline with icon.

```tsx
import { BanIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgeFailedDemo = () => {
  return (
    <Badge
      variant='outline'
      className='text-destructive [a&]:hover:bg-destructive/10 [a&]:hover:text-destructive/90 border-destructive rounded-sm'
    >
      <BanIcon className='size-3' />
      Failed
    </Badge>
  )
}
```

---

## 21. Successful (Outline)

Green outline with icon.

```tsx
import { CheckCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const BadgeSuccessfulDemo = () => {
  return (
    <Badge
      variant='outline'
      className='rounded-sm border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 [a&]:hover:bg-green-600/10 [a&]:hover:text-green-600/90 dark:[a&]:hover:bg-green-400/10 dark:[a&]:hover:text-green-400/90'
    >
      <CheckCircleIcon className='size-3' />
      Successful
    </Badge>
  )
}
```

---

## 22. With Avatar

Badge with user image.

```tsx
import { Badge } from '@/components/ui/badge'

const BadgeAvatarDemo = () => {
  return (
    <Badge variant='outline' className='p-1 pr-2'>
      <img
        src='https://example.com/avatar.png'
        alt='User'
        className='size-6 rounded-full'
      />
      Avatar
    </Badge>
  )
}
```

---

## 23. Cart Badge

Badge on shopping cart icon.

```tsx
import { ShoppingCartIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const BadgeCartDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-9 rounded-sm'>
        <AvatarFallback className='rounded-sm'>
          <ShoppingCartIcon className='size-5' />
        </AvatarFallback>
      </Avatar>
      <Badge className='absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums'>8</Badge>
    </div>
  )
}
```

---

## 24. Status Online

Online indicator on avatar.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const BadgeStatusOnlineDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-10'>
        <AvatarImage src='https://example.com/avatar.png' alt='User' />
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
      <span className='border-background absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-green-600 dark:bg-green-400'>
        <span className='sr-only'>Online</span>
      </span>
    </div>
  )
}
```
