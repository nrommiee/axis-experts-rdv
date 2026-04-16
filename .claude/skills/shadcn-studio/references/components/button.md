# Button Components

38 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Use Case |
|---|-------|----------|
| 1 | Default | Basic button |
| 2 | Disabled | Form validation, unavailable actions |
| 3 | Rounded full + Icon | Prominent actions with star icon |
| 4 | Icon hover animation | CTA with directional hint (arrow right) |
| 5 | Icon left/right | Undo/Redo, actions with icons |
| 6 | Cancel/Save pair | Form actions |
| 7 | Large | High emphasis actions |
| 8 | Small | Compact UI, tables |
| 9 | Extra small | Dense layouts |
| 10 | Delete destructive gradient | Dangerous actions with gradient |
| 11 | Gradient primary | Premium CTA |
| 12 | Gradient upgrade (amber) | Upsell, premium features |
| 13 | Duplicate (sky outline) | Copy/duplicate actions |
| 14 | Download (dashed outline) | File downloads |
| 15 | Discard (destructive outline) | Delete with outline style |
| 16 | Ghost with icon hover | Settings navigation |
| 17 | Loading spinner | Async operations |
| 18 | Animated link underline | Text links with animation |
| 19 | Publish (rounded pill) | Social/publishing actions |
| 20 | Copy URL | Clipboard with input display |
| 21 | Messages with badge | Notifications count |
| 22 | Caution (amber soft) | Warning actions |
| 23 | Save (sky soft) | Save actions |
| 24 | Permissions (reject/approve) | Authorization flows |
| 25 | Notifications badge | Bell with counter |
| 26 | Promise/async state | Loading → Success/Error |
| 27 | Avatar button | User profiles |
| 28 | Copy with state change | Clipboard feedback |
| 29 | Social icons only | OAuth icon buttons |
| 30 | Social full width | OAuth with labels |
| 31 | Icon button outline | Bookmark, simple actions |
| 32 | Icon button tooltip | With hover tooltip |
| 33 | Toggle menu icon | Hamburger ↔ X |
| 34 | Theme toggle | Sun ↔ Moon |
| 35 | Icon button badge | Mail with notification |
| 36 | Icon gradient destructive | Security alerts |
| 37 | Icon soft green | Success/check actions |
| 38 | Icon notification dot | Bell with animated dot |

---

## 1. Default

Basic button with default styling.

```tsx
import { Button } from '@/components/ui/button'

const ButtonDemo = () => {
  return <Button>Button</Button>
}

export default ButtonDemo
```

---

## 2. Disabled

Button in disabled state for unavailable actions.

```tsx
import { Button } from '@/components/ui/button'

const ButtonDisabledDemo = () => {
  return <Button disabled>Verify Email</Button>
}

export default ButtonDisabledDemo
```

---

## 3. Rounded Full with Icon

Pill-shaped button with star icon.

```tsx
import { StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonRoundedDemo = () => {
  return (
    <Button className='rounded-full'>
      <StarIcon />
      Star
    </Button>
  )
}

export default ButtonRoundedDemo
```

---

## 4. Icon Hover Animation

Button with arrow that moves on hover.

```tsx
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonIconHoverDemo = () => {
  return (
    <Button className='group'>
      Get In Touch
      <ArrowRightIcon className='transition-transform duration-200 group-hover:translate-x-0.5' />
    </Button>
  )
}

export default ButtonIconHoverDemo
```

---

## 5. Icon Left/Right

Undo/Redo buttons with icons on opposite sides.

```tsx
import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonIconDemo = () => {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <Button variant='outline'>
        <Undo2Icon />
        Undo
      </Button>
      <Button variant='outline'>
        Redo
        <Redo2Icon />
      </Button>
    </div>
  )
}

export default ButtonIconDemo
```

---

## 6. Cancel/Save Actions

Button pair for form actions.

```tsx
import { Button } from '@/components/ui/button'

const ButtonActionsDemo = () => {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <Button variant='secondary'>Cancel</Button>
      <Button>Save Changes</Button>
    </div>
  )
}

export default ButtonActionsDemo
```

---

## 7. Large

Large size button for high emphasis.

```tsx
import { Button } from '@/components/ui/button'

const ButtonLargeDemo = () => {
  return <Button size='lg'>Large</Button>
}

export default ButtonLargeDemo
```

---

## 8. Small

Small size button for compact UI.

```tsx
import { Button } from '@/components/ui/button'

const ButtonSmallDemo = () => {
  return <Button size='sm'>Small</Button>
}

export default ButtonSmallDemo
```

---

## 9. Extra Small

Extra small button for dense layouts.

```tsx
import { Button } from '@/components/ui/button'

const ButtonExtraSmallDemo = () => {
  return <Button className='h-7 px-2 py-1 text-xs'>Extra Small</Button>
}

export default ButtonExtraSmallDemo
```

---

## 10. Delete Destructive Gradient

Destructive button with gradient for dangerous actions.

```tsx
import { TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonDeleteDemo = () => {
  return (
    <Button className='from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center]'>
      <TrashIcon />
      Delete
    </Button>
  )
}

export default ButtonDeleteDemo
```

---

## 11. Gradient Primary

Primary button with gradient effect.

```tsx
import { Button } from '@/components/ui/button'

const ButtonGradientDemo = () => {
  return (
    <Button className='from-primary via-primary/60 to-primary bg-transparent bg-gradient-to-r [background-size:200%_auto] hover:bg-transparent hover:bg-[99%_center]'>
      Get Started
    </Button>
  )
}

export default ButtonGradientDemo
```

---

## 12. Gradient Upgrade (Amber)

Amber gradient for upsell/premium features.

```tsx
import { ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonUpgradeDemo = () => {
  return (
    <Button className='bg-transparent bg-gradient-to-r from-amber-600 via-amber-600/60 to-amber-600 [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center]'>
      Upgrade <ZapIcon />
    </Button>
  )
}

export default ButtonUpgradeDemo
```

---

## 13. Duplicate (Sky Outline)

Sky-colored outline button for copy/duplicate actions.

```tsx
import { CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonDuplicateDemo = () => {
  return (
    <Button
      variant='outline'
      className='border-sky-600 text-sky-600! hover:bg-sky-600/10 focus-visible:border-sky-600 focus-visible:ring-sky-600/20 dark:border-sky-400 dark:text-sky-400! dark:hover:bg-sky-400/10 dark:focus-visible:border-sky-400 dark:focus-visible:ring-sky-400/40'
    >
      <CopyIcon />
      Duplicate
    </Button>
  )
}

export default ButtonDuplicateDemo
```

---

## 14. Download (Dashed Outline)

Dashed border button for file downloads.

```tsx
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonDownloadDemo = () => {
  return (
    <Button variant='outline' className='border-primary border-dashed shadow-none'>
      <DownloadIcon />
      Download
    </Button>
  )
}

export default ButtonDownloadDemo
```

---

## 15. Discard (Destructive Outline)

Destructive outline button for delete actions.

```tsx
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonDiscardDemo = () => {
  return (
    <Button
      variant='outline'
      className='hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40'
    >
      <Trash2Icon />
      Discard
    </Button>
  )
}

export default ButtonDiscardDemo
```

---

## 16. Ghost with Icon Hover

Ghost button with arrow animation for navigation.

```tsx
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGhostDemo = () => {
  return (
    <Button variant='ghost' className='group'>
      <ArrowLeftIcon className='transition-transform duration-200 group-hover:-translate-x-0.5' />
      Go to settings
    </Button>
  )
}

export default ButtonGhostDemo
```

---

## 17. Loading Spinner

Button with loading state and spinner.

```tsx
import { LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonLoadingDemo = () => {
  return (
    <Button disabled>
      <LoaderCircleIcon className='animate-spin' />
      Loading
    </Button>
  )
}

export default ButtonLoadingDemo
```

---

## 18. Animated Link Underline

Link button with animated underline effect.

```tsx
import { Button } from '@/components/ui/button'

const ButtonAnimatedLinkDemo = () => {
  return (
    <Button
      variant='link'
      className='after:bg-primary relative !no-underline after:absolute after:bottom-2 after:h-px after:w-2/3 after:origin-bottom-left after:scale-x-100 after:transition-transform after:duration-300 hover:after:origin-bottom-right hover:after:scale-x-0'
      asChild
    >
      <a href='#'>Contact Us</a>
    </Button>
  )
}

export default ButtonAnimatedLinkDemo
```

---

## 19. Publish (Rounded Pill)

Pill button with icon badge for publishing actions.

```tsx
import { ShareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonPublishDemo = () => {
  return (
    <Button variant='outline' className='h-12 rounded-full px-2.5'>
      <span className='bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full'>
        <ShareIcon />
      </span>
      Publish
    </Button>
  )
}

export default ButtonPublishDemo
```

---

## 20. Copy URL

Button with URL display and copy action.

```tsx
import { CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonCopyDemo = () => {
  return (
    <div className='flex h-11.5 items-center overflow-hidden rounded-full border px-1'>
      <p className='text-muted-foreground max-w-56 truncate overflow-hidden px-2.5 text-sm'>
        https://shadcnstudio.com/docs/components/button
      </p>
      <Button
        size='icon'
        className='rounded-full bg-sky-600 text-white hover:bg-sky-600/90 focus-visible:ring-sky-600/20 dark:bg-sky-400/60 dark:focus-visible:ring-sky-400/40'
      >
        <CopyIcon />
        <span className='sr-only'>Copy</span>
      </Button>
    </div>
  )
}

export default ButtonCopyDemo
```

---

## 21. Messages with Badge

Button with notification badge showing count.

```tsx
import { MailCheckIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ButtonMessagesBadgeDemo = () => {
  return (
    <Button variant='outline'>
      <MailCheckIcon />
      Messages
      <Badge variant='destructive' className='px-1.5 py-px'>
        99+
      </Badge>
    </Button>
  )
}

export default ButtonMessagesBadgeDemo
```

---

## 22. Caution (Amber Soft)

Soft amber button for warning actions.

```tsx
import { AlertTriangleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonCautionDemo = () => {
  return (
    <Button className='bg-amber-600/10 text-amber-600 hover:bg-amber-600/20 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/20 dark:focus-visible:ring-amber-400/40'>
      <AlertTriangleIcon />
      Caution
    </Button>
  )
}

export default ButtonCautionDemo
```

---

## 23. Save (Sky Soft)

Soft sky button for save actions.

```tsx
import { SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonSaveDemo = () => {
  return (
    <Button className='bg-sky-600/10 text-sky-600 hover:bg-sky-600/20 focus-visible:ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:hover:bg-sky-400/20 dark:focus-visible:ring-sky-400/40'>
      <SaveIcon />
      Save
    </Button>
  )
}

export default ButtonSaveDemo
```

---

## 24. Permissions (Reject/Approve)

Button pair for authorization flows.

```tsx
import { ShieldCheckIcon, ShieldXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonPermissionsDemo = () => {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <Button className='bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40'>
        Reject
        <ShieldXIcon />
      </Button>
      <Button className='bg-green-600/10 text-green-600 hover:bg-green-600/20 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20 dark:focus-visible:ring-green-400/40'>
        Approve
        <ShieldCheckIcon />
      </Button>
    </div>
  )
}

export default ButtonPermissionsDemo
```

---

## 25. Notifications Badge

Button with positioned notification counter.

```tsx
import { BellIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ButtonNotificationsBadgeDemo = () => {
  return (
    <Button variant='outline' className='relative'>
      <BellIcon />
      Notifications
      <Badge variant='destructive' className='absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums'>
        8
      </Badge>
    </Button>
  )
}

export default ButtonNotificationsBadgeDemo
```

---

## 26. Promise/Async State

Button with loading, success, and error states.

```tsx
'use client'

import { useState } from 'react'
import { LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ButtonPromiseDemo = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<undefined | string>(undefined)

  const handleClick = async () => {
    setIsLoading(true)
    setStatus(undefined)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus(Math.random() > 0.5 ? 'Submitted!' : 'Rejected!')
    } catch (error) {
      setStatus('Rejected!')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant='link'
      onClick={handleClick}
      disabled={isLoading}
      className={cn('cursor-pointer hover:no-underline', {
        'text-green-600 dark:text-green-400': status === 'Submitted!',
        'text-destructive': status === 'Rejected!'
      })}
    >
      {isLoading ? (
        <>
          <LoaderCircleIcon className='animate-spin' />
          Loading
        </>
      ) : status ? (
        status
      ) : (
        'Click me'
      )}
    </Button>
  )
}

export default ButtonPromiseDemo
```

---

## 27. Avatar Button

Button with user avatar for profiles.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const ButtonAvatarDemo = () => {
  return (
    <Button className='rounded-full pl-2'>
      <Avatar className='size-6'>
        <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
        <AvatarFallback className='text-foreground text-xs'>HR</AvatarFallback>
      </Avatar>
      @hallierichards
    </Button>
  )
}

export default ButtonAvatarDemo
```

---

## 28. Copy with State Change

Button that shows copied feedback.

```tsx
'use client'

import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ButtonCopyStateDemo = () => {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('Thank you for using Shadcn Studio!')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Button variant='outline' className='relative disabled:opacity-100' onClick={handleCopy} disabled={copied}>
      <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
        <CheckIcon className='stroke-green-600 dark:stroke-green-400' />
      </span>
      <span className={cn('absolute left-4 transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
        <CopyIcon />
      </span>
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}

export default ButtonCopyStateDemo
```

---

## 29. Social Icons Only

Icon-only buttons for social OAuth.

```tsx
import { Button } from '@/components/ui/button'

const ButtonSocialIconsDemo = () => {
  return (
    <div className='flex flex-wrap items-center justify-center gap-4'>
      <Button variant='outline' size='icon'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto'
          alt='Google Icon'
          className='size-5'
        />
      </Button>
      <Button variant='outline' size='icon'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/twitter-icon.png?width=20&height=20&format=auto'
          alt='X Icon'
          className='size-5 dark:invert'
        />
      </Button>
      <Button variant='outline' size='icon'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/facebook-icon.png?width=20&height=20&format=auto'
          alt='Facebook Icon'
          className='size-5'
        />
      </Button>
      <Button variant='outline' size='icon'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png?width=20&height=20&format=auto'
          alt='GitHub Icon'
          className='size-5 dark:invert'
        />
      </Button>
    </div>
  )
}

export default ButtonSocialIconsDemo
```

---

## 30. Social Full Width

Full-width social OAuth buttons with labels.

```tsx
import { Button } from '@/components/ui/button'

const ButtonSocialDemo = () => {
  return (
    <div className='flex w-full max-w-56 flex-col justify-center gap-4'>
      <Button variant='outline' className='!border-[#e84133] !text-[#e84133]'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto'
          alt='Google Icon'
          className='size-5'
        />
        <span className='flex flex-1 justify-center'>Continue with Google</span>
      </Button>
      <Button variant='outline' className='border-black text-black dark:border-white dark:text-white'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/twitter-icon.png?width=20&height=20&format=auto'
          alt='X Icon'
          className='size-5 dark:invert'
        />
        <span className='flex flex-1 justify-center'>Continue with X</span>
      </Button>
      <Button variant='outline' className='!border-[#0866fe] !text-[#0866fe]'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/facebook-icon.png?width=20&height=20&format=auto'
          alt='Facebook Icon'
          className='size-5'
        />
        <span className='flex flex-1 justify-center'>Continue with Facebook</span>
      </Button>
      <Button variant='outline' className='border-black text-black dark:border-white dark:text-white'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png?width=20&height=20&format=auto'
          alt='GitHub Icon'
          className='size-5 dark:invert'
        />
        <span className='flex flex-1 justify-center'>Continue with GitHub</span>
      </Button>
    </div>
  )
}

export default ButtonSocialDemo
```

---

## 31. Icon Button Outline

Simple icon button with outline variant.

```tsx
import { BookmarkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const IconButtonDemo = () => {
  return (
    <Button variant='outline' size='icon'>
      <BookmarkIcon />
      <span className='sr-only'>Bookmark</span>
    </Button>
  )
}

export default IconButtonDemo
```

---

## 32. Icon Button Tooltip

Icon button with tooltip on hover.

```tsx
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const IconButtonTooltipDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='icon' className='rounded-full'>
          <PlusIcon />
          <span className='sr-only'>Add new item</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className='px-2 py-1 text-xs'>Add new item</TooltipContent>
    </Tooltip>
  )
}

export default IconButtonTooltipDemo
```

---

## 33. Toggle Menu Icon

Hamburger menu toggle with state.

```tsx
'use client'

import { useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const IconButtonToggleDemo = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Button variant='ghost' size='icon' onClick={() => setIsOpen(!isOpen)} aria-label='Toggle menu'>
      {isOpen ? <XIcon /> : <MenuIcon />}
    </Button>
  )
}

export default IconButtonToggleDemo
```

---

## 34. Theme Toggle

Dark/light mode toggle button.

```tsx
'use client'

import { useState } from 'react'
import { SunIcon, MoonIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const IconButtonModeDemo = () => {
  const [isDark, setIsDark] = useState(false)

  return (
    <Button
      variant='outline'
      size='icon'
      onClick={() => setIsDark(!isDark)}
      aria-label='Toggle dark mode'
      className={cn(
        isDark
          ? 'border-sky-600 text-sky-600! hover:bg-sky-600/10 focus-visible:border-sky-600 focus-visible:ring-sky-600/20 dark:border-sky-400 dark:text-sky-400! dark:hover:bg-sky-400/10 dark:focus-visible:border-sky-400 dark:focus-visible:ring-sky-400/40'
          : 'border-amber-600 text-amber-600! hover:bg-amber-600/10 focus-visible:border-amber-600 focus-visible:ring-amber-600/20 dark:border-amber-400 dark:text-amber-400! dark:hover:bg-amber-400/10 dark:focus-visible:border-amber-400 dark:focus-visible:ring-amber-400/40'
      )}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}

export default IconButtonModeDemo
```

---

## 35. Icon Button Badge

Icon button with notification badge.

```tsx
import { MailCheckIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const IconButtonBadgeDemo = () => {
  return (
    <Button variant='outline' size='icon' className='relative'>
      <MailCheckIcon />
      <span className='sr-only'>Messages</span>
      <Badge variant='destructive' className='absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 tabular-nums'>
        8
      </Badge>
    </Button>
  )
}

export default IconButtonBadgeDemo
```

---

## 36. Icon Gradient Destructive

Icon button with destructive gradient.

```tsx
import { ShieldAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const IconButtonGradientDemo = () => {
  return (
    <Button
      size='icon'
      className='from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center]'
    >
      <ShieldAlertIcon />
      <span className='sr-only'>Security</span>
    </Button>
  )
}

export default IconButtonGradientDemo
```

---

## 37. Icon Soft Green

Soft green icon button for success actions.

```tsx
import { CheckCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const IconButtonSoftDemo = () => {
  return (
    <Button
      size='icon'
      className='bg-green-600/10 text-green-600 hover:bg-green-600/20 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20 dark:focus-visible:ring-green-400/40'
    >
      <CheckCheckIcon />
      <span className='sr-only'>Check</span>
    </Button>
  )
}

export default IconButtonSoftDemo
```

---

## 38. Icon Notification Dot

Bell icon with animated notification dot.

```tsx
import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const IconButtonNotificationDotDemo = () => {
  return (
    <Button variant='outline' size='icon' className='relative'>
      <BellIcon />
      <span className='absolute -top-0.5 -right-0.5 size-2 animate-bounce rounded-full bg-sky-600 dark:bg-sky-400' />
      <span className='sr-only'>Notifications</span>
    </Button>
  )
}

export default IconButtonNotificationDotDemo
```
