# Alert Components

30 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Basic | Icon + title | Simple notification |
| 2 | Avatar | User avatar + description | User-related messages |
| 3 | Closable | X button | Dismissible notification |
| 4 | With link | Button link | Action required |
| 5 | Attached icon | Icon in separate box | File/virus warnings |
| 6 | Focused icon | Icon in avatar | Emphasized warnings |
| 7 | File upload | Progress bar + actions | Upload status |
| 8 | Multiple actions | Primary bg + buttons | Update prompts |
| 9 | Task | Avatar + progress | Task/project status |
| 10 | Gradient | Gradient background | Email verification |
| 11 | Indicator success | Left border green | Success with indicator |
| 12 | Indicator destructive | Left border red | Error with indicator |
| 13 | With action | Single button | Quick action |
| 14 | Destructive | Red variant | Error message |
| 15 | Pure destructive | Red border | Payment error |
| 16 | Without icon | Text only | Minimal alert |
| 17 | Description | Icon + title + desc | Detailed info |
| 18-20 | Outline colors | Info/Success/Warning | Colored borders |
| 21-25 | Soft colors | Light backgrounds | Subtle notifications |
| 26-30 | Solid colors | Full backgrounds | Strong emphasis |

---

## 1. Basic

Simple alert with icon and title.

```tsx
import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertDemo = () => {
  return (
    <Alert>
      <CircleAlertIcon />
      <AlertTitle>New message!</AlertTitle>
    </Alert>
  )
}
```

---

## 2. With Avatar

User avatar with title and description.

```tsx
import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AlertWithAvatarDemo = () => {
  return (
    <Alert className='flex items-center justify-between'>
      <Avatar className='rounded-sm'>
        <AvatarImage src='https://example.com/avatar.png' alt='User' className='rounded-sm' />
        <AvatarFallback className='text-xs'>HR</AvatarFallback>
      </Avatar>
      <div className='flex-1 flex-col justify-center gap-1'>
        <AlertTitle className='flex-1'>Sara has replied on the uploaded image.</AlertTitle>
        <AlertDescription>12 unread messages. Tap to see.</AlertDescription>
      </div>
      <CircleAlertIcon />
    </Alert>
  )
}
```

---

## 3. Closable

Dismissible alert with X button.

```tsx
'use client'
import { useState } from 'react'
import { CircleAlertIcon, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const AlertClosableDemo = () => {
  const [isActive, setIsActive] = useState(true)
  if (!isActive) return null
  return (
    <Alert className='flex justify-between'>
      <CircleAlertIcon />
      <div className='flex-1 flex-col justify-center gap-1'>
        <AlertTitle>New message!</AlertTitle>
        <AlertDescription>12 unread messages. Tap to see.</AlertDescription>
      </div>
      <button className='cursor-pointer' onClick={() => setIsActive(false)}>
        <XIcon className='size-5' />
        <span className='sr-only'>Close</span>
      </button>
    </Alert>
  )
}
```

---

## 4. With Link Button

Alert with action link button.

```tsx
import { ArrowRightIcon, CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const AlertWithLinkDemo = () => {
  return (
    <Alert className='flex items-center justify-between border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 [&>svg]:translate-y-0'>
      <CircleAlertIcon />
      <AlertTitle className='flex-1'>New message!</AlertTitle>
      <Button
        variant='outline'
        className='h-7 cursor-pointer rounded-md border-sky-600 px-2 text-sky-600! hover:bg-sky-600/10 focus-visible:border-sky-600 focus-visible:ring-sky-600/20 dark:border-sky-400 dark:text-sky-400! dark:hover:bg-sky-400/10 dark:focus-visible:border-sky-400 dark:focus-visible:ring-sky-400/40'
        asChild
      >
        <a href='#'>
          Link
          <ArrowRightIcon />
        </a>
      </Button>
    </Alert>
  )
}
```

---

## 5. Attached Icon

Icon in separate colored box.

```tsx
import { FileWarningIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertAttachedIconDemo = () => {
  return (
    <Alert className='flex items-stretch p-0'>
      <div className='bg-destructive/10 text-destructive flex items-center rounded-l-lg border-r p-2'>
        <FileWarningIcon className='size-4' />
      </div>
      <AlertTitle className='p-3'>This file contains virus!</AlertTitle>
    </Alert>
  )
}
```

---

## 6. Focused Icon

Icon inside avatar container.

```tsx
import { FileWarningIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const AlertFocusedIconDemo = () => {
  return (
    <Alert className='flex items-center gap-3'>
      <Avatar className='rounded-md'>
        <AvatarFallback className='bg-destructive dark:bg-destructive/60 rounded-md text-white'>
          <FileWarningIcon className='size-4' />
        </AvatarFallback>
      </Avatar>
      <AlertTitle>This file contains virus!</AlertTitle>
    </Alert>
  )
}
```

---

## 7. File Upload Progress

Upload status with progress bar and actions.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { UploadIcon, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const AlertFileUploadDemo = () => {
  const [isActive, setIsActive] = useState(true)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress(50), 100)
    return () => clearTimeout(timer)
  }, [])
  
  if (!isActive) return null
  return (
    <Alert className='flex justify-between'>
      <UploadIcon />
      <div className='flex flex-1 flex-col gap-4'>
        <div className='flex-1 flex-col justify-center gap-1'>
          <AlertTitle>Uploading your 'Img-234.png'</AlertTitle>
          <AlertDescription>Please wait while we upload your image.</AlertDescription>
        </div>
        <Progress value={progress} className='bg-sky-600/20 *:bg-sky-600 dark:bg-sky-400/20 dark:*:bg-sky-400' />
        <div className='flex items-center gap-4'>
          <Button variant='ghost' className='h-7 cursor-pointer rounded-md px-2'>Cancel</Button>
          <Button variant='ghost' disabled className='h-7 cursor-pointer rounded-md px-2 text-sky-600 hover:bg-sky-600/10 hover:text-sky-600 dark:text-sky-400 dark:hover:bg-sky-400/10 dark:hover:text-sky-400'>
            Upload another
          </Button>
        </div>
      </div>
      <button className='size-5 cursor-pointer' onClick={() => setIsActive(false)}>
        <XIcon className='size-5' />
        <span className='sr-only'>Close</span>
      </button>
    </Alert>
  )
}
```

---

## 8. Multiple Actions (Update Prompt)

Primary background with multiple action buttons.

```tsx
'use client'
import { useState } from 'react'
import { CircleAlertIcon, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const AlertMultipleActionDemo = () => {
  const [isActive, setIsActive] = useState(true)
  if (!isActive) return null
  return (
    <Alert className='bg-primary text-primary-foreground flex justify-between border-none'>
      <CircleAlertIcon />
      <div className='flex flex-1 flex-col gap-4'>
        <div className='flex-1 flex-col justify-center gap-1'>
          <AlertTitle>A new update is available</AlertTitle>
          <AlertDescription className='text-primary-foreground/80'>
            Includes the new dashboard view. Pages and exports will now load faster.
          </AlertDescription>
        </div>
        <div className='flex items-center gap-4'>
          <Button className='bg-secondary/10 focus-visible:bg-secondary/20 hover:bg-secondary/20 h-7 cursor-pointer rounded-md px-2'>
            Skip this update
          </Button>
          <Button variant='secondary' className='h-7 cursor-pointer rounded-md px-2'>
            Install now
          </Button>
        </div>
      </div>
      <button className='size-5 cursor-pointer' onClick={() => setIsActive(false)}>
        <XIcon className='size-5' />
        <span className='sr-only'>Close</span>
      </button>
    </Alert>
  )
}
```

---

## 9. Task Progress

Avatar with task progress bar.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

const AlertTaskDemo = () => {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setProgress(50), 100)
    return () => clearTimeout(timer)
  }, [])
  return (
    <Alert className='flex gap-3'>
      <Avatar className='rounded-sm'>
        <AvatarImage src='https://example.com/avatar.png' alt='User' className='rounded-sm' />
        <AvatarFallback className='text-xs'>HR</AvatarFallback>
      </Avatar>
      <div className='flex flex-1 flex-col gap-2'>
        <div className='flex-1 flex-col justify-center gap-1'>
          <AlertTitle>@Rocky</AlertTitle>
          <AlertDescription>This project's task is remaining, deadline is near.</AlertDescription>
        </div>
        <Progress value={progress} className='bg-amber-600/20 *:bg-amber-600 dark:bg-amber-400/20 dark:*:bg-amber-400' />
      </div>
    </Alert>
  )
}
```

---

## 10. Gradient Background

Gradient from accent color.

```tsx
'use client'
import { useState } from 'react'
import { CircleAlertIcon, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const AlertGradientDemo = () => {
  const [isActive, setIsActive] = useState(true)
  if (!isActive) return null
  return (
    <Alert className='border-accent-foreground/20 from-accent text-accent-foreground flex justify-between bg-gradient-to-b to-transparent to-60%'>
      <CircleAlertIcon />
      <div className='flex flex-1 flex-col gap-1'>
        <AlertTitle>Verify your email to activate your account</AlertTitle>
        <AlertDescription className='text-accent-foreground/60'>
          We've sent a confirmation link to your inbox. Check your email to complete the sign-up.
        </AlertDescription>
      </div>
      <button className='cursor-pointer' onClick={() => setIsActive(false)}>
        <XIcon className='size-5' />
        <span className='sr-only'>Close</span>
      </button>
    </Alert>
  )
}
```

---

## 11. Left Indicator - Success

Green left border indicator.

```tsx
import { UserCheckIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertIndicatorSuccessDemo = () => {
  return (
    <Alert className='rounded-md border-l-6 border-green-600 bg-green-600/10 text-green-600 dark:border-green-400 dark:bg-green-400/10 dark:text-green-400'>
      <UserCheckIcon />
      <AlertTitle>Your request to join the team is approved.</AlertTitle>
    </Alert>
  )
}
```

---

## 12. Left Indicator - Destructive

Red left border indicator.

```tsx
import { UserRoundXIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertIndicatorDestructiveDemo = () => {
  return (
    <Alert className='border-destructive bg-destructive/10 text-destructive rounded-none border-0 border-l-6'>
      <UserRoundXIcon />
      <AlertTitle>Your request to join the team is denied.</AlertTitle>
    </Alert>
  )
}
```

---

## 13. With Action Button

Single action button on the right.

```tsx
import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const AlertWithActionDemo = () => {
  return (
    <Alert className='flex items-center justify-between [&>svg]:translate-y-0'>
      <CircleAlertIcon />
      <AlertTitle className='flex-1'>New message!</AlertTitle>
      <Button variant='outline' className='h-7 cursor-pointer rounded-md px-2'>Open</Button>
    </Alert>
  )
}
```

---

## 14-15. Destructive Variants

```tsx
// 14. Destructive (default variant)
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertDestructiveDemo = () => {
  return (
    <Alert variant='destructive'>
      <TriangleAlertIcon />
      <AlertTitle>Something went wrong!</AlertTitle>
    </Alert>
  )
}

// 15. Pure Destructive (with border)
const AlertPureDestructiveDemo = () => {
  return (
    <Alert variant='destructive' className='border-destructive'>
      <TriangleAlertIcon />
      <AlertTitle>Unable to process your payment.</AlertTitle>
    </Alert>
  )
}
```

---

## 16-17. Basic Variants

```tsx
// 16. Without Icon
import { Alert, AlertTitle } from '@/components/ui/alert'

const AlertWithoutIconDemo = () => {
  return (
    <Alert>
      <AlertTitle>New message!</AlertTitle>
    </Alert>
  )
}

// 17. With Description
import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

const AlertDescriptionDemo = () => {
  return (
    <Alert>
      <CircleAlertIcon />
      <AlertTitle>Creating your account</AlertTitle>
      <AlertDescription>Fill in your details to get started.</AlertDescription>
    </Alert>
  )
}
```

---

## 18-20. Outline Colors

Colored borders with matching text.

```tsx
import { CircleAlertIcon, CheckCheckIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// 18. Info (Sky)
const AlertOutlineInfoDemo = () => (
  <Alert className='border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'>
    <CircleAlertIcon />
    <AlertTitle>Verify your email to activate your account</AlertTitle>
    <AlertDescription className='text-sky-600/80 dark:text-sky-400/80'>
      We've sent a confirmation link to your inbox.
    </AlertDescription>
  </Alert>
)

// 19. Success (Green)
const AlertOutlineSuccessDemo = () => (
  <Alert className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'>
    <CheckCheckIcon />
    <AlertTitle>Account created successfully</AlertTitle>
    <AlertDescription className='text-green-600/80 dark:text-green-400/80'>
      You are all set! You can now log in.
    </AlertDescription>
  </Alert>
)

// 20. Warning (Amber)
const AlertOutlineWarningDemo = () => (
  <Alert className='border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'>
    <CircleAlertIcon />
    <AlertTitle>Your password is too weak</AlertTitle>
    <AlertDescription className='text-amber-600/80 dark:text-amber-400/80'>
      Try using a mix of uppercase letters, numbers, and symbols.
    </AlertDescription>
  </Alert>
)
```

---

## 21-25. Soft Colors

Light background with matching text, no border.

```tsx
import { CircleAlertIcon, CheckCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// 21. Soft Primary
const AlertSoftDemo = () => (
  <Alert className='bg-primary/10 border-none'>
    <CircleAlertIcon />
    <AlertTitle>File should be PDF, DOCX, JPG, or PNG.</AlertTitle>
    <AlertDescription>If the file type is not one of these, we can't process your files.</AlertDescription>
  </Alert>
)

// 22. Soft Info (Sky)
const AlertSoftInfoDemo = () => (
  <Alert className='border-none bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400'>
    <CircleAlertIcon />
    <AlertTitle>Only certain file types are allowed</AlertTitle>
    <AlertDescription className='text-sky-600/80 dark:text-sky-400/80'>
      You can upload PDF, DOCX, JPG, or PNG files up to 20MB.
    </AlertDescription>
  </Alert>
)

// 23. Soft Success (Green)
const AlertSoftSuccessDemo = () => (
  <Alert className='border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400'>
    <CheckCheckIcon />
    <AlertTitle>File uploaded successfully</AlertTitle>
    <AlertDescription className='text-green-600/80 dark:text-green-400/80'>
      Your document has been saved.
    </AlertDescription>
  </Alert>
)

// 24. Soft Warning (Amber)
const AlertSoftWarningDemo = () => (
  <Alert className='border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'>
    <CircleAlertIcon />
    <AlertTitle>This file might be too large</AlertTitle>
    <AlertDescription className='text-amber-600/80 dark:text-amber-400/80'>
      Consider compressing it first.
    </AlertDescription>
  </Alert>
)

// 25. Soft Destructive
const AlertSoftDestructiveDemo = () => (
  <Alert className='bg-destructive/10 text-destructive border-none'>
    <TriangleAlertIcon />
    <AlertTitle>Upload failed</AlertTitle>
    <AlertDescription className='text-destructive/80'>
      Please try again or use a different file format.
    </AlertDescription>
  </Alert>
)
```

---

## 26-30. Solid Colors

Full background color with white text.

```tsx
import { CircleAlertIcon, CheckCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// 26. Solid Primary
const AlertSolidDemo = () => (
  <Alert className='bg-primary text-primary-foreground border-none'>
    <CircleAlertIcon />
    <AlertTitle>Editing your profile</AlertTitle>
    <AlertDescription className='text-primary-foreground/80'>
      Changes won't be saved until you click "Update."
    </AlertDescription>
  </Alert>
)

// 27. Solid Success (Green)
const AlertSolidSuccessDemo = () => (
  <Alert className='border-none bg-green-600 text-white dark:bg-green-400'>
    <CheckCheckIcon />
    <AlertTitle>Profile updated</AlertTitle>
    <AlertDescription className='text-white/80'>Your changes have been saved successfully.</AlertDescription>
  </Alert>
)

// 28. Solid Warning (Amber)
const AlertSolidWarningDemo = () => (
  <Alert className='border-none bg-amber-600 text-white dark:bg-amber-400'>
    <CircleAlertIcon />
    <AlertTitle>Some details are missing</AlertTitle>
    <AlertDescription className='text-white/80'>Complete your profile for the best experience.</AlertDescription>
  </Alert>
)

// 29. Solid Info (Sky)
const AlertSolidInfoDemo = () => (
  <Alert className='border-none bg-sky-600 text-white dark:bg-sky-400'>
    <CircleAlertIcon />
    <AlertTitle>Your profile is visible</AlertTitle>
    <AlertDescription className='text-white/80'>Anyone can view your basic information.</AlertDescription>
  </Alert>
)

// 30. Solid Destructive
const AlertSolidDestructiveDemo = () => (
  <Alert className='bg-destructive dark:bg-destructive/60 border-none text-white'>
    <TriangleAlertIcon />
    <AlertTitle>Couldn't save changes</AlertTitle>
    <AlertDescription className='text-white/80'>Please try again or reload the page.</AlertDescription>
  </Alert>
)
```
