# Tooltip & HoverCard Components

15 variants (1-15) from ShadcnStudio. Tooltip and HoverCard components for contextual information display on hover.

## Quick Reference

| # | Style | Dependencies | Use Case |
|---|-------|--------------|----------|
| 1 | Default | CSS only | Basic tooltip |
| 2 | Light | CSS only | Light themed tooltip |
| 3 | No Arrow | CSS only | Tooltip without arrow |
| 4 | Error | CSS only | Destructive/error tooltip |
| 5 | With Icon | lucide-react | Tooltip with icon |
| 6 | Rounded | CSS only | Fully rounded tooltip |
| 7 | Content | CSS only | Rich content tooltip |
| 8 | Avatar | Avatar component | Tooltip with user avatar |
| 9 | Badge | Badge component | Tooltip with badge |
| 10 | Directions | CSS only | All placement positions |
| 11 | HoverCard Media | HoverCard component | Card with image |
| 12 | HoverCard Stats | HoverCard, Avatar | Stats display card |
| 13 | HoverCard Project | HoverCard, Avatar, Progress | Project progress card |
| 14 | HoverCard Alert | HoverCard, lucide-react | Alert/warning card |
| 15 | HoverCard Tasks | HoverCard, Avatar | Task completion list |

---

## 1. Default

Basic tooltip with simple text.

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Default
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a simple tooltip</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipDemo
```

---

## 2. Light

Tooltip with light theme (always light regardless of dark mode).

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipLightDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Light
        </Button>
      </TooltipTrigger>
      <TooltipContent className='bg-neutral-200 text-neutral-950 dark:bg-neutral-50 [&_svg]:bg-neutral-200 [&_svg]:fill-neutral-200 dark:[&_svg]:bg-neutral-50 dark:[&_svg]:fill-neutral-50'>
        <p>This tooltip will be always light</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipLightDemo
```

---

## 3. No Arrow

Tooltip without the pointing arrow.

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipNoArrowDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          No arrow
        </Button>
      </TooltipTrigger>
      <TooltipContent className='[&_svg]:invisible'>
        <p>This tooltip don&apos;t have arrow</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipNoArrowDemo
```

---

## 4. Error

Tooltip with destructive/error styling.

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipErrorDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Error
        </Button>
      </TooltipTrigger>
      <TooltipContent className='bg-destructive [&_svg]:bg-destructive [&_svg]:fill-destructive text-white'>
        <p>This is an error tooltip</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipErrorDemo
```

---

## 5. With Icon

Tooltip containing an icon with text.

### Dependencies

```bash
npm install lucide-react
```

### Usage

```tsx
import { InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipIconDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Icon
        </Button>
      </TooltipTrigger>
      <TooltipContent className='max-w-64 text-pretty'>
        <div className='flex items-center gap-1.5'>
          <InfoIcon className='size-4' />
          <p>This tooltip has an icon</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipIconDemo
```

---

## 6. Rounded

Tooltip with fully rounded corners (pill shape).

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipRoundedDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Rounded
        </Button>
      </TooltipTrigger>
      <TooltipContent className='rounded-full'>
        <p>This tooltip is rounded</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipRoundedDemo
```

---

## 7. Content

Tooltip with rich content (title, description, icon).

### Usage

```tsx
import { InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipContentDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Content
        </Button>
      </TooltipTrigger>
      <TooltipContent className='max-w-64 py-3 text-pretty'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <InfoIcon className='size-4' />
            <p className='text-sm font-medium'>Accessibility First</p>
          </div>
          <p className='text-background/80'>
            Tooltips should supplement the UI, not hide critical information. Ensure all important content is visible
            without requiring tooltip interaction.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipContentDemo
```

---

## 8. Avatar

Tooltip displaying a user avatar with name.

### Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipAvatarDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Avatar
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex items-center gap-1.5'>
          <Avatar className='size-5'>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>HR</AvatarFallback>
          </Avatar>
          <p className='font-medium'>Hallie Richards</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipAvatarDemo
```

---

## 9. Badge

Tooltip with a badge component.

### Usage

```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipBadgeDemo = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='outline' size='sm'>
          Badge
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex items-center gap-2'>
          <p>Team plan: $99/month per user.</p>
          <Badge variant='secondary' className='px-1.5 py-px'>
            Trending
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipBadgeDemo
```

---

## 10. Directions

Tooltips demonstrating all placement positions.

### Usage

```tsx
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipDirectionsDemo = () => {
  return (
    <div className='flex flex-wrap gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='outline' size='sm'>
            Left
          </Button>
        </TooltipTrigger>
        <TooltipContent side='left'>Tooltip on left</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='outline' size='sm'>
            Top
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Tooltip on top</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='outline' size='sm'>
            Bottom
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>Tooltip on bottom</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='outline' size='sm'>
            Right
          </Button>
        </TooltipTrigger>
        <TooltipContent side='right'>Tooltip on right</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default TooltipDirectionsDemo
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Tooltip placement position |

---

## 11. HoverCard Media

HoverCard with image and description.

### Usage

```tsx
import { ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const HoverCardMediaDemo = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant='link'>Hover Card Media</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className='space-y-2'>
          <img
            src='https://lp-cms-production.imgix.net/2021-01/GettyRF_450207051.jpg?width=232'
            alt='Content image'
            className='w-full rounded'
          />
          <div className='space-y-1'>
            <p className='text-sm font-medium'>About Himalayas</p>
            <p className='text-muted-foreground text-xs'>
              The Great Himalayan mountain ranges in the Indian sub-continent region.{' '}
              <a
                href='https://en.wikipedia.org/wiki/Himalayas'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-foreground flex w-fit underline'
              >
                Read more
                <ChevronRightIcon className='size-4' />
              </a>
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverCardMediaDemo
```

---

## 12. HoverCard Stats

HoverCard displaying statistics with avatar.

### Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const HoverCardStatsDemo = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant='link'>Hover Card Stats</Button>
      </HoverCardTrigger>
      <HoverCardContent className='w-fit'>
        <div className='flex items-center gap-1.5'>
          <div className='flex flex-col gap-1'>
            <div className='text-sm font-medium'>Total page views</div>
            <div className='text-xl font-semibold'>89,400</div>
            <div className='text-muted-foreground text-xs'>21% ↗︎ than last month</div>
          </div>
          <Avatar className='size-10'>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
            <AvatarFallback className='text-xs'>HR</AvatarFallback>
          </Avatar>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverCardStatsDemo
```

---

## 13. HoverCard Project

HoverCard showing project progress with team avatars.

### Usage

```tsx
import { CalendarIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Progress } from '@/components/ui/progress'

const avatars = [
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png', fallback: 'OS', name: 'Olivia Sparks' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png', fallback: 'HL', name: 'Howard Lloyd' },
  { src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png', fallback: 'HR', name: 'Hallie Richards' }
]

const HoverCardProjectDemo = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant='link'>Hover Card Project</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-2 text-sm font-semibold'>
            <span>Resume project completion</span>
            <span>25%</span>
          </div>
          <Progress value={25} />
          <p className='text-sm'>Developing platform where ai will generate resume automatically Ai</p>
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <CalendarIcon className='size-4' />
            <span>Started in December 2024</span>
          </div>
          <div className='flex -space-x-2'>
            {avatars.map((avatar, index) => (
              <Avatar key={index} className='ring-background ring-2'>
                <AvatarImage src={avatar.src} alt={avatar.name} />
                <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
              </Avatar>
            ))}
            <Avatar className='ring-background ring-2'>
              <AvatarFallback className='text-xs'>+6</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverCardProjectDemo
```

---

## 14. HoverCard Alert

HoverCard displaying an alert/warning message.

### Usage

```tsx
import { FileQuestionIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const HoverCardAlertDemo = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant='link'>Hover Card Alert</Button>
      </HoverCardTrigger>
      <HoverCardContent className='w-72'>
        <div className='flex flex-col items-center text-center'>
          <span className='bg-destructive/10 mb-2.5 flex size-12 items-center justify-center rounded-full'>
            <FileQuestionIcon className='text-destructive size-6' />
          </span>
          <div className='mb-1 text-lg font-medium'>File is corrupted</div>
          <p className='text-sm'>It might have some virus or something that might be harmful for your device.</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverCardAlertDemo
```

---

## 15. HoverCard Tasks

HoverCard showing task completion list.

### Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const tasks = [
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'HL',
    name: 'Howard Lloyd',
    designation: 'Product Manager',
    percentage: 90
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'OS',
    name: 'Olivia Sparks',
    designation: 'Software Engineer',
    percentage: 60
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards',
    designation: 'UI/UX Designer',
    percentage: 80
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-16.png',
    fallback: 'JW',
    name: 'Jenny Wilson',
    designation: 'Junior Developer',
    percentage: 15
  }
]

const HoverCardTasksDemo = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <Button variant='link'>Hover Card Tasks</Button>
      </HoverCardTrigger>
      <HoverCardContent className='w-72'>
        <div className='space-y-4'>
          <p className='text-lg font-semibold'>Today&apos;s task completion</p>
          <ul className='space-y-2.5'>
            {tasks.map(task => (
              <li key={task.name} className='flex items-start gap-4'>
                <Avatar>
                  <AvatarImage src={task.image} alt={task.name} />
                  <AvatarFallback>{task.fallback}</AvatarFallback>
                </Avatar>
                <div className='flex flex-1 flex-col'>
                  <div className='text-sm font-medium'>{task.name}</div>
                  <p className='text-muted-foreground text-xs'>{task.designation}</p>
                </div>
                <span className='text-muted-foreground text-sm'>{`${task.percentage}%`}</span>
              </li>
            ))}
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default HoverCardTasksDemo
```
