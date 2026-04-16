# Avatar Components

21 variants from ShadcnStudio (note: #6 missing in source). Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Basic | Image + fallback | Default user avatar |
| 2 | Ring | Border ring | Highlighted user |
| 3 | Rounded | Square corners | Card-style avatar |
| 4 | Size | Custom size | Large avatar |
| 5 | Fallback only | Initials only | No image available |
| 7 | Status busy | Red dot | User busy |
| 8 | Status ring | Green ring + check | Verified online |
| 9 | Status away | Amber dot | User away |
| 10 | Plus button | Add action | Add friend/follow |
| 11 | Notification | Badge count | Unread messages |
| 12 | Verified | Blue checkmark | Verified account |
| 13-14 | Group | Stacked avatars | Team members |
| 15 | Group size | Large stacked | Prominent team |
| 16 | Group tooltip | Hover names | Interactive team |
| 17 | Group transition | Expand on hover | Animated team |
| 18 | Group tooltip+transition | Both effects | Full interactive |
| 19 | Group dropdown | Overflow menu | Many members |
| 20 | Group outline | Pill container | Compact team |
| 21 | Popularity | "Loved by X+" | Social proof |

---

## 1. Basic

Simple avatar with image and fallback.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarDemo = () => {
  return (
    <Avatar>
      <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
      <AvatarFallback className='text-xs'>UN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 2. With Ring

Border ring around avatar.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarRingDemo = () => {
  return (
    <Avatar className='ring-ring ring-2'>
      <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
      <AvatarFallback className='text-xs'>UN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 3. Rounded (Square)

Square avatar with small border radius.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarRoundedDemo = () => {
  return (
    <Avatar className='rounded-sm'>
      <AvatarImage src='https://example.com/avatar.png' alt='User Name' className='rounded-sm' />
      <AvatarFallback className='text-xs'>UN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 4. Custom Size

Larger avatar size.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarSizeDemo = () => {
  return (
    <Avatar className='size-12'>
      <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
      <AvatarFallback className='text-xs'>UN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 5. Fallback Only

Initials without image.

```tsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const AvatarFallbackDemo = () => {
  return (
    <Avatar>
      <AvatarFallback className='text-xs'>UN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 6. Icon Avatar

Avatar with icon instead of image.

```tsx
import { HomeIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const AvatarIconDemo = () => {
  return (
    <Avatar>
      <AvatarFallback className='bg-indigo-500/10 text-indigo-500'>
        <HomeIcon className='size-4' />
      </AvatarFallback>
    </Avatar>
  )
}
```

---

## 7. Status - Busy

Red indicator dot.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarStatusBusyDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <span className='border-background bg-destructive absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2'>
        <span className='sr-only'>Busy</span>
      </span>
    </div>
  )
}
```

---

## 8. Status - Online with Ring

Green ring with checkmark.

```tsx
import { CheckIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarStatusRingDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='ring-offset-background ring-2 ring-green-600 ring-offset-2 dark:ring-green-400'>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <span className='absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-green-600 dark:bg-green-400'>
        <CheckIcon className='size-3 text-white' />
      </span>
    </div>
  )
}
```

---

## 9. Status - Away

Amber indicator on square avatar.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarStatusAwayDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='rounded-sm'>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' className='rounded-sm' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <span className='border-background absolute -top-1.5 -right-1.5 size-3 rounded-full border-2 bg-amber-600 dark:bg-amber-400'>
        <span className='sr-only'>Away</span>
      </span>
    </div>
  )
}
```

---

## 10. Plus Action Button

Add button overlay.

```tsx
import { PlusCircleIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarPlusDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-10'>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <button className='focus-visible:ring-ring/50 absolute -right-1 -bottom-1 inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:outline-none'>
        <PlusCircleIcon className='text-background size-5 fill-slate-400' />
        <span className='sr-only'>Add</span>
      </button>
    </div>
  )
}
```

---

## 11. Notification Badge

Badge with count.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const AvatarNotificationBadgeDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-10 rounded-sm'>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' className='rounded-sm' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <Badge className='absolute -top-2.5 -right-2.5 h-5 min-w-5 bg-indigo-500 px-1 tabular-nums'>8</Badge>
    </div>
  )
}
```

---

## 12. Verified Badge

Blue checkmark badge.

```tsx
import { BadgeCheckIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarVerifiedDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-10'>
        <AvatarImage src='https://example.com/avatar.png' alt='User Name' />
        <AvatarFallback className='text-xs'>UN</AvatarFallback>
      </Avatar>
      <span className='absolute -top-1.5 -right-1.5'>
        <span className='sr-only'>Verified</span>
        <BadgeCheckIcon className='text-background size-5 fill-sky-500' />
      </span>
    </div>
  )
}
```

---

## 13. Avatar Group

Stacked overlapping avatars.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const avatars = [
  { src: '/avatar-1.png', fallback: 'OS', name: 'Olivia Sparks' },
  { src: '/avatar-2.png', fallback: 'HL', name: 'Howard Lloyd' },
  { src: '/avatar-3.png', fallback: 'HR', name: 'Hallie Richards' },
  { src: '/avatar-4.png', fallback: 'JW', name: 'Jenny Wilson' }
]

const AvatarGroupDemo = () => {
  return (
    <div className='flex -space-x-2'>
      {avatars.map((avatar, index) => (
        <Avatar key={index} className='ring-background ring-2'>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
```

---

## 14. Avatar Group with Max

Show "+N" for overflow.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarGroupMaxDemo = () => {
  return (
    <div className='flex -space-x-2'>
      {avatars.slice(0, 3).map((avatar, index) => (
        <Avatar key={index} className='ring-background ring-2'>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar className='ring-background ring-2'>
        <AvatarFallback className='text-xs'>+9</AvatarFallback>
      </Avatar>
    </div>
  )
}
```

---

## 15. Avatar Group Large

Larger stacked avatars.

```tsx
const AvatarGroupSizeDemo = () => {
  return (
    <div className='flex -space-x-2'>
      {avatars.map((avatar, index) => (
        <Avatar key={index} className='ring-background size-12 ring-2'>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
```

---

## 16. Avatar Group with Tooltip

Hover to show names.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const AvatarGroupTooltipDemo = () => {
  return (
    <div className='flex -space-x-2'>
      {avatars.map((avatar, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <Avatar className='ring-background ring-2 transition-all duration-300 ease-in-out hover:z-1 hover:-translate-y-1 hover:shadow-md'>
              <AvatarImage src={avatar.src} alt={avatar.name} />
              <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{avatar.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
```

---

## 17. Avatar Group with Expand Transition

Expand on hover.

```tsx
const AvatarGroupTransitionDemo = () => {
  return (
    <div className='flex -space-x-2 hover:space-x-1'>
      {avatars.map((avatar, index) => (
        <Avatar key={index} className='ring-background ring-2 transition-all duration-300 ease-in-out'>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
```

---

## 18. Avatar Group Tooltip + Transition

Combined tooltip and expand effects.

```tsx
const AvatarGroupTooltipTransitionDemo = () => {
  return (
    <div className='flex -space-x-2 hover:space-x-1'>
      {avatars.map((avatar, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <Avatar className='ring-background ring-2 transition-all duration-300 ease-in-out'>
              <AvatarImage src={avatar.src} alt={avatar.name} />
              <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{avatar.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
```

---

## 19. Avatar Group with Dropdown

Overflow in dropdown menu.

```tsx
import { PlusIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const AvatarGroupDropdownDemo = () => {
  return (
    <div className='flex -space-x-2'>
      {avatars.slice(0, 3).map((avatar, index) => (
        <Avatar key={index} className='ring-background ring-2'>
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='bg-muted has-focus-visible:ring-ring/50 ring-background flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full ring-2'>
            <PlusIcon className='size-4' />
            <span className='sr-only'>Add</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {avatars.slice(3).map((avatar, index) => (
            <DropdownMenuItem key={index}>
              <Avatar>
                <AvatarImage src={avatar.src} alt={avatar.name} />
                <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
              </Avatar>
              <span>{avatar.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

---

## 20. Avatar Group in Pill

Contained in bordered pill.

```tsx
const AvatarGroupOutlineDemo = () => {
  return (
    <div className='bg-background flex items-center rounded-full border p-1 shadow-sm'>
      <div className='flex -space-x-2'>
        {avatars.map((avatar, index) => (
          <Avatar key={index} className='ring-background ring-2'>
            <AvatarImage src={avatar.src} alt={avatar.name} />
            <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className='text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full bg-transparent px-2 text-xs shadow-none hover:bg-transparent'>
        +3
      </span>
    </div>
  )
}
```

---

## 21. Popularity Indicator

Social proof with avatar group.

```tsx
const AvatarGroupPopularityIndicatorDemo = () => {
  return (
    <div className='bg-background flex flex-wrap items-center justify-center rounded-full border p-1 shadow-sm'>
      <div className='flex -space-x-1'>
        {avatars.map((avatar, index) => (
          <Avatar key={index} className='ring-background size-6 ring-2'>
            <AvatarImage src={avatar.src} alt={avatar.name} />
            <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <p className='text-muted-foreground px-2 text-xs'>
        Loved by <strong className='text-foreground font-medium'>10K+</strong> developers.
      </p>
    </div>
  )
}
```
