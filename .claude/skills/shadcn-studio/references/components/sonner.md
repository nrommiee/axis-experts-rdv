# Sonner (Toast) Components

20 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Type | Use Case |
|---|-------|------|----------|
| 1 | Default | Basic | Simple notifications |
| 2 | Description | Info | Events with details |
| 3 | Icon | Custom | Delivery, status updates |
| 4 | Avatar | User | Profile notifications |
| 5 | Closable | Dismissible | Long-lived toasts |
| 6 | Action | Interactive | Undo, confirm actions |
| 7 | Promise | Async | Loading states |
| 8 | Position | Layout | 6 positions available |
| 9-12 | Soft | Colored bg | Info/Success/Warning/Error |
| 13-16 | Outline | Bordered | Info/Success/Warning/Error |
| 17-20 | Solid | Filled | Info/Success/Warning/Error |

---

## 1. Default

Basic toast notification.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerDemo = () => {
  return (
    <Button variant='outline' onClick={() => toast('Action completed successfully!')}>
      Default Toast
    </Button>
  )
}

export default SonnerDemo
```

---

## 2. With Description

Toast with title and description.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerWithDescriptionDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast('Event is created', {
          description: 'Friday, August 15, 2025 at 9:00 AM'
        })
      }
    >
      Toast with description
    </Button>
  )
}

export default SonnerWithDescriptionDemo
```

---

## 3. With Icon

Toast with custom icon.

```tsx
'use client'

import { TruckIcon } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerWithIconDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast(
          <div className='flex items-center gap-2'>
            <TruckIcon className='size-5.5 shrink-0' />
            Your order has been successfully placed, and your parcel is on its way.
          </div>
        )
      }
    >
      Toast with icon
    </Button>
  )
}

export default SonnerWithIconDemo
```

---

## 4. With Avatar

Toast with user avatar.

```tsx
'use client'

import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const SonnerWithAvatarDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast(
          <div className='flex items-center gap-2'>
            <Avatar>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
              <AvatarFallback className='text-xs'>HR</AvatarFallback>
            </Avatar>
            Hey Henry Richer, your profile is now up to date!
          </div>
        )
      }
    >
      Toast with avatar
    </Button>
  )
}

export default SonnerWithAvatarDemo
```

---

## 5. Closable

Toast with close button.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const ClosableSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast('Action completed successfully!', {
          closeButton: true
        })
      }
    >
      Closable Toast
    </Button>
  )
}

export default ClosableSonnerDemo
```

---

## 6. With Action

Toast with action button.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerWithActionDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast('Action completed successfully!', {
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo')
          }
        })
      }
    >
      Toast with action
    </Button>
  )
}

export default SonnerWithActionDemo
```

---

## 7. With Promise

Toast for async operations with loading/success/error states.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerWithPromiseDemo = () => {
  const promise = () =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (Math.random() < 0.5) {
          resolve('foo')
        } else {
          reject('fox')
        }
      }, 2000)
    )

  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.promise(promise, {
          loading: 'Loading...',
          success: 'Toast has been added successfully!',
          error: 'Oops, there was an error adding the toast.'
        })
      }
    >
      Toast with promise
    </Button>
  )
}

export default SonnerWithPromiseDemo
```

---

## 8. Positions

Toast positioning options: 6 positions available.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerPositionDemo = () => {
  return (
    <div className='grid grid-cols-2 gap-2'>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'top-left' })}
      >
        Top Left
      </Button>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'top-center' })}
      >
        Top Center
      </Button>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'top-right' })}
      >
        Top Right
      </Button>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'bottom-left' })}
      >
        Bottom Left
      </Button>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'bottom-center' })}
      >
        Bottom Center
      </Button>
      <Button
        variant='outline'
        onClick={() => toast('Action completed successfully!', { position: 'bottom-right' })}
      >
        Bottom Right
      </Button>
    </div>
  )
}

export default SonnerPositionDemo
```

---

## 9. Soft Info

Info toast with soft background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SoftInfoSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.info('This is for your information, please note.', {
          style: {
            '--normal-bg':
              'color-mix(in oklab, light-dark(var(--color-sky-600), var(--color-sky-400)) 10%, var(--background))',
            '--normal-text': 'light-dark(var(--color-sky-600), var(--color-sky-400))',
            '--normal-border': 'light-dark(var(--color-sky-600), var(--color-sky-400))'
          } as React.CSSProperties
        })
      }
    >
      Soft Info Toast
    </Button>
  )
}

export default SoftInfoSonnerDemo
```

---

## 10. Soft Success

Success toast with soft background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SoftSuccessSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.success('Action completed successfully!', {
          style: {
            '--normal-bg':
              'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
          } as React.CSSProperties
        })
      }
    >
      Soft Success Toast
    </Button>
  )
}

export default SoftSuccessSonnerDemo
```

---

## 11. Soft Warning

Warning toast with soft background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SoftWarningSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.warning('Warning: Please check the entered data.', {
          style: {
            '--normal-bg':
              'color-mix(in oklab, light-dark(var(--color-amber-600), var(--color-amber-400)) 10%, var(--background))',
            '--normal-text': 'light-dark(var(--color-amber-600), var(--color-amber-400))',
            '--normal-border': 'light-dark(var(--color-amber-600), var(--color-amber-400))'
          } as React.CSSProperties
        })
      }
    >
      Soft Warning Toast
    </Button>
  )
}

export default SoftWarningSonnerDemo
```

---

## 12. Soft Destructive

Error toast with soft background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SoftDestructiveSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.error('Oops, there was an error processing your request.', {
          style: {
            '--normal-bg': 'color-mix(in oklab, var(--destructive) 10%, var(--background))',
            '--normal-text': 'var(--destructive)',
            '--normal-border': 'var(--destructive)'
          } as React.CSSProperties
        })
      }
    >
      Soft Destructive Toast
    </Button>
  )
}

export default SoftDestructiveSonnerDemo
```

---

## 13. Outline Info

Info toast with outline style.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const OutlineInfoSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.info('This is for your information, please note.', {
          style: {
            '--normal-bg': 'var(--background)',
            '--normal-text': 'light-dark(var(--color-sky-600), var(--color-sky-400))',
            '--normal-border': 'light-dark(var(--color-sky-600), var(--color-sky-400))'
          } as React.CSSProperties
        })
      }
    >
      Outline Info Toast
    </Button>
  )
}

export default OutlineInfoSonnerDemo
```

---

## 14. Outline Success

Success toast with outline style.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const OutlineSuccessSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.success('Action completed successfully!', {
          style: {
            '--normal-bg': 'var(--background)',
            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
          } as React.CSSProperties
        })
      }
    >
      Outline Success Toast
    </Button>
  )
}

export default OutlineSuccessSonnerDemo
```

---

## 15. Outline Warning

Warning toast with outline style.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const OutlineWarningSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.warning('Warning: Please check the entered data.', {
          style: {
            '--normal-bg': 'var(--background)',
            '--normal-text': 'light-dark(var(--color-amber-600), var(--color-amber-400))',
            '--normal-border': 'light-dark(var(--color-amber-600), var(--color-amber-400))'
          } as React.CSSProperties
        })
      }
    >
      Outline Warning Toast
    </Button>
  )
}

export default OutlineWarningSonnerDemo
```

---

## 16. Outline Destructive

Error toast with outline style.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const OutlineDestructiveSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.error('Oops, there was an error processing your request.', {
          style: {
            '--normal-bg': 'var(--background)',
            '--normal-text': 'var(--destructive)',
            '--normal-border': 'var(--destructive)'
          } as React.CSSProperties
        })
      }
    >
      Outline Destructive Toast
    </Button>
  )
}

export default OutlineDestructiveSonnerDemo
```

---

## 17. Solid Info

Info toast with solid background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SolidInfoSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.info('This is for your information, please note.', {
          style: {
            '--normal-bg': 'light-dark(var(--color-sky-600), var(--color-sky-400))',
            '--normal-text': 'var(--color-white)',
            '--normal-border': 'light-dark(var(--color-sky-600), var(--color-sky-400))'
          } as React.CSSProperties
        })
      }
    >
      Solid Info Toast
    </Button>
  )
}

export default SolidInfoSonnerDemo
```

---

## 18. Solid Success

Success toast with solid background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SolidSuccessSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.success('Action completed successfully!', {
          style: {
            '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
            '--normal-text': 'var(--color-white)',
            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
          } as React.CSSProperties
        })
      }
    >
      Solid Success Toast
    </Button>
  )
}

export default SolidSuccessSonnerDemo
```

---

## 19. Solid Warning

Warning toast with solid background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SolidWarningSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.warning('Warning: Please check the entered data.', {
          style: {
            '--normal-bg': 'light-dark(var(--color-amber-600), var(--color-amber-400))',
            '--normal-text': 'var(--color-white)',
            '--normal-border': 'light-dark(var(--color-amber-600), var(--color-amber-400))'
          } as React.CSSProperties
        })
      }
    >
      Solid Warning Toast
    </Button>
  )
}

export default SolidWarningSonnerDemo
```

---

## 20. Solid Destructive

Error toast with solid background.

```tsx
'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SolidDestructiveSonnerDemo = () => {
  return (
    <Button
      variant='outline'
      onClick={() =>
        toast.error('Oops, there was an error processing your request.', {
          style: {
            '--normal-bg':
              'light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))',
            '--normal-text': 'var(--color-white)',
            '--normal-border': 'transparent'
          } as React.CSSProperties
        })
      }
    >
      Solid Destructive Toast
    </Button>
  )
}

export default SolidDestructiveSonnerDemo
```
