# Button Group Components

12 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Use Case |
|---|-------|----------|
| 1 | Download with counter | Download button with stats |
| 2 | Like with counter | Toggle like with count |
| 3 | Icon toolbar with tooltips | Design tools, editor actions |
| 4 | Rounded media controls | Audio/video player controls |
| 5 | Social links | Social media icon links |
| 6 | Zoom controls | Zoom in/out with percentage |
| 7 | Number stepper | Pixel/value increment |
| 8 | Preview with external link | Live preview + open in new tab |
| 9 | Actions (Edit/Duplicate/Delete) | CRUD operations |
| 10 | Flip horizontal/vertical | Image manipulation |
| 11 | Dropdown split button | GitHub-style merge options |
| 12 | Ghost navigation | Settings/Dashboard/Analytics |

---

## 1. Download with Counter

Button with download action and download count display.

```tsx
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupDownloadDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button variant='outline' className='rounded-none rounded-l-md shadow-none focus-visible:z-10'>
        <DownloadIcon />
        Download
      </Button>
      <span className='bg-background dark:border-input dark:bg-input/30 flex items-center rounded-r-md border px-3 text-sm font-medium'>
        15k
      </span>
    </div>
  )
}

export default ButtonGroupDownloadDemo
```

---

## 2. Like with Counter

Toggle like button with dynamic count.

```tsx
'use client'

import { useState } from 'react'
import { HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ButtonGroupLikeDemo = () => {
  const [isLiked, setIsLiked] = useState(true)

  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button
        variant='outline'
        className='rounded-none rounded-l-md shadow-none focus-visible:z-10'
        onClick={() => setIsLiked(!isLiked)}
      >
        <HeartIcon className={cn({ 'fill-destructive stroke-destructive': isLiked })} />
        Like
      </Button>
      <span className='bg-background dark:border-input dark:bg-input/30 flex items-center rounded-r-md border px-3 text-sm font-medium'>
        {isLiked ? 46 : 45}
      </span>
    </div>
  )
}

export default ButtonGroupLikeDemo
```

---

## 3. Icon Toolbar with Tooltips

Icon button group with tooltips for design tools.

```tsx
import { CopyIcon, CropIcon, EllipsisVerticalIcon, MousePointerIcon, SquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const ButtonGroupTooltipDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none rounded-l-md shadow-none focus-visible:z-10' variant='outline'>
            <MousePointerIcon />
            <span className='sr-only'>Select</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Select</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none shadow-none focus-visible:z-10' variant='outline'>
            <SquareIcon />
            <span className='sr-only'>Shapes</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Shapes</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none shadow-none focus-visible:z-10' variant='outline'>
            <CropIcon />
            <span className='sr-only'>Crop</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Crop</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none shadow-none focus-visible:z-10' variant='outline'>
            <CopyIcon />
            <span className='sr-only'>Duplicate</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Duplicate</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none rounded-r-md shadow-none focus-visible:z-10' variant='outline'>
            <EllipsisVerticalIcon />
            <span className='sr-only'>More</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>More</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default ButtonGroupTooltipDemo
```

---

## 4. Rounded Media Controls

Pill-shaped media player controls.

```tsx
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const ButtonGroupRoundedDemo = () => {
  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-full shadow-xs'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none rounded-l-full focus-visible:z-10'>
            <SkipBackIcon />
            <span className='sr-only'>Skip Back</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Skip Back</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none focus-visible:z-10'>
            <PlayIcon />
            <span className='sr-only'>Play</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Play</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none focus-visible:z-10'>
            <PauseIcon />
            <span className='sr-only'>Pause</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Pause</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className='rounded-none rounded-r-full focus-visible:z-10'>
            <SkipForwardIcon />
            <span className='sr-only'>Skip Forward</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='px-2 py-1 text-xs'>Skip Forward</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default ButtonGroupRoundedDemo
```

---

## 5. Social Links

Social media icon buttons with brand colors on hover.

```tsx
import { DribbbleIcon, FacebookIcon, InstagramIcon, TwitchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupSocialDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button
        variant='outline'
        className='rounded-none rounded-l-md shadow-none hover:!bg-[#9146ff]/10 focus-visible:z-10'
        asChild
      >
        <a href='#' target='_blank' rel='noopener noreferrer'>
          <TwitchIcon className='stroke-[#9146ff]' />
          <span className='sr-only'>Twitch</span>
        </a>
      </Button>
      <Button variant='outline' className='rounded-none shadow-none hover:!bg-[#EA4C89]/10 focus-visible:z-10' asChild>
        <a href='#' target='_blank' rel='noopener noreferrer'>
          <DribbbleIcon className='stroke-[#EA4C89]' />
          <span className='sr-only'>Dribbble</span>
        </a>
      </Button>
      <Button variant='outline' className='rounded-none shadow-none hover:!bg-[#fb169a]/10 focus-visible:z-10' asChild>
        <a href='#' target='_blank' rel='noopener noreferrer'>
          <InstagramIcon className='stroke-[#fb169a]' />
          <span className='sr-only'>Instagram</span>
        </a>
      </Button>
      <Button
        variant='outline'
        className='rounded-none rounded-r-md shadow-none hover:!bg-[#0866ff]/10 focus-visible:z-10'
        asChild
      >
        <a href='#' target='_blank' rel='noopener noreferrer'>
          <FacebookIcon className='stroke-[#0866ff]' />
          <span className='sr-only'>Facebook</span>
        </a>
      </Button>
    </div>
  )
}

export default ButtonGroupSocialDemo
```

---

## 6. Zoom Controls

Zoom in/out buttons with percentage display.

```tsx
'use client'

import { useState } from 'react'
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupZoomDemo = () => {
  const [zoom, setZoom] = useState(95)

  const handleZoomIn = () => {
    if (zoom < 100) {
      setZoom(zoom + 5)
    }
  }

  const handleZoomOut = () => {
    if (zoom > 0) {
      setZoom(zoom - 5)
    }
  }

  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none rounded-l-md shadow-none focus-visible:z-10'
        onClick={handleZoomOut}
        disabled={zoom === 0}
      >
        <ZoomOutIcon />
        <span className='sr-only'>Zoom out</span>
      </Button>
      <span className='bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium'>
        {zoom}%
      </span>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none rounded-r-md shadow-none focus-visible:z-10'
        onClick={handleZoomIn}
        disabled={zoom === 100}
      >
        <ZoomInIcon />
        <span className='sr-only'>Zoom in</span>
      </Button>
    </div>
  )
}

export default ButtonGroupZoomDemo
```

---

## 7. Number Stepper

Increment/decrement number value with pixel unit.

```tsx
'use client'

import { useState } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupNumberDemo = () => {
  const [value, setValue] = useState(216)

  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-md shadow-xs'>
      <Button
        size='icon'
        className='rounded-none rounded-l-full focus-visible:z-10'
        onClick={() => {
          setValue(value - 1)
        }}
      >
        <MinusIcon />
        <span className='sr-only'>Minus</span>
      </Button>
      <span className='bg-primary text-primary-foreground inline-flex items-center px-3 py-2 text-sm font-medium'>
        {value}px
      </span>
      <Button
        size='icon'
        className='rounded-none rounded-r-full focus-visible:z-10'
        onClick={() => {
          setValue(value + 1)
        }}
      >
        <PlusIcon />
        <span className='sr-only'>Plus</span>
      </Button>
    </div>
  )
}

export default ButtonGroupNumberDemo
```

---

## 8. Preview with External Link

Live preview button with external link icon.

```tsx
import { ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupPreviewDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button variant='outline' className='rounded-none rounded-l-md shadow-none focus-visible:z-10' asChild>
        <a href='#'>Live preview</a>
      </Button>
      <Button
        variant='outline'
        size='icon'
        className='rounded-none rounded-r-md shadow-none focus-visible:z-10'
        asChild
      >
        <a href='#' target='_blank' rel='noopener noreferrer'>
          <ExternalLinkIcon />
          <span className='sr-only'>External link</span>
        </a>
      </Button>
    </div>
  )
}

export default ButtonGroupPreviewDemo
```

---

## 9. Actions (Edit/Duplicate/Delete)

Common CRUD action buttons grouped together.

```tsx
import { CopyIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupActionsDemo = () => {
  return (
    <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
      <Button variant='outline' className='rounded-none rounded-l-md shadow-none focus-visible:z-10'>
        <SquarePenIcon />
        Edit
      </Button>
      <Button variant='outline' className='rounded-none shadow-none focus-visible:z-10'>
        <CopyIcon />
        Duplicate
      </Button>
      <Button variant='outline' className='rounded-none rounded-r-md shadow-none focus-visible:z-10'>
        <Trash2Icon />
        Delete
      </Button>
    </div>
  )
}

export default ButtonGroupActionsDemo
```

---

## 10. Flip Horizontal/Vertical

Image manipulation flip buttons.

```tsx
import { FlipHorizontalIcon, FlipVerticalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupDemo = () => {
  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-md shadow-xs'>
      <Button size='icon' className='rounded-none rounded-l-md focus-visible:z-10'>
        <FlipHorizontalIcon />
        <span className='sr-only'>Flip Horizontal</span>
      </Button>
      <Button size='icon' className='rounded-none rounded-r-md focus-visible:z-10'>
        <FlipVerticalIcon />
        <span className='sr-only'>Flip Vertical</span>
      </Button>
    </div>
  )
}

export default ButtonGroupDemo
```

---

## 11. Dropdown Split Button

GitHub-style split button with dropdown options.

```tsx
'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const options = [
  {
    label: 'Merge pull request',
    description: 'All commits from this branch will be added to the base branch via a commit version.'
  },
  {
    label: 'Squash and merge',
    description: 'The 6 commits from this branch will be combined into one commit in the base branch.'
  },
  {
    label: 'Rebase and merge',
    description: 'The 6 commits from this branch will be rebased and added to the base branch.'
  }
]

const ButtonGroupDropdownDemo = () => {
  const [selectedIndex, setSelectedIndex] = useState('0')

  return (
    <div className='divide-primary-foreground/30 inline-flex w-fit divide-x rounded-md shadow-xs'>
      <Button className='rounded-none rounded-l-md focus-visible:z-10'>{options[Number(selectedIndex)].label}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='icon' className='rounded-none rounded-r-md focus-visible:z-10'>
            <ChevronDownIcon />
            <span className='sr-only'>Select option</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='bottom' sideOffset={4} align='end' className='max-w-64 md:max-w-xs!'>
          <DropdownMenuRadioGroup value={selectedIndex} onValueChange={setSelectedIndex}>
            {options.map((option, index) => (
              <DropdownMenuRadioItem key={option.label} value={String(index)} className='items-start [&>span]:pt-1.5'>
                <div className='flex flex-col gap-1'>
                  <span className='text-sm font-medium'>{option.label}</span>
                  <span className='text-muted-foreground text-xs'>{option.description}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ButtonGroupDropdownDemo
```

---

## 12. Ghost Navigation

Ghost variant button group for navigation.

```tsx
import { BoxIcon, ChartBarBigIcon, SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ButtonGroupGhostDemo = () => {
  return (
    <div className='inline-flex w-fit rounded-md rtl:space-x-reverse'>
      <Button variant='ghost' className='rounded-none rounded-l-md focus-visible:z-10'>
        <SettingsIcon />
        Settings
      </Button>
      <Button variant='ghost' className='rounded-none focus-visible:z-10'>
        <BoxIcon />
        Dashboard
      </Button>
      <Button variant='ghost' className='rounded-none rounded-r-md focus-visible:z-10'>
        <ChartBarBigIcon />
        Analytics
      </Button>
    </div>
  )
}

export default ButtonGroupGhostDemo
```
