# Popover Components

12 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Ratings | Star rating with progress bars | Product reviews |
| 2 | Dimensions | Form inputs for width/height | Layer settings |
| 3 | Pricing | Plan details with badge | Pricing info |
| 4 | Volume | Slider with icons | Audio control |
| 5 | About | Info text with CTA button | About sections |
| 6 | Download | Progress bar with pause/cancel | File downloads |
| 7 | Delete File | Warning modal with actions | Destructive confirmations |
| 8 | Feedback | Textarea with send/cancel | User feedback |
| 9 | Filter | Checkboxes + price slider | Product filtering |
| 10 | Search | Debounced search with avatars | User search |
| 11 | Notifications | Notification list with read status | Alerts/notifications |
| 12 | About Himalayas | Info with image | Location/place info |

---

## Popover 1 - Ratings

```tsx
import { StarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

const ratings = {
  1: 0,
  2: 15,
  3: 30,
  4: 30,
  5: 225
}

const PopoverRatingsDemo = () => {
  const totalReviews = Object.values(ratings).reduce((acc, count) => acc + count, 0)
  const totalRating = Object.entries(ratings).reduce((acc, [star, count]) => acc + Number(star) * count, 0)
  const averageRating = Number((totalRating / totalReviews || 0).toFixed(2))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <StarIcon />
          <span className='sr-only'>Ratings & reviews</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-1'>
              <span className='text-xl font-semibold'>{averageRating}</span>
              <StarIcon className='size-5 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400' />
            </div>
            <div className='text-sm font-medium'>Total {totalReviews} reviews</div>
            <p className='text-muted-foreground text-sm'>All reviews are from genuine customers.</p>
          </div>
          <div className='grid'>
            <div className='flex items-center justify-between'>
              <Badge variant='secondary' className='rounded-sm'>
                +6 this week
              </Badge>
              <a href='#' className='text-sm hover:underline'>
                See all
              </a>
            </div>
            <Separator className='my-2' />
            <ul className='space-y-2'>
              {Object.entries(ratings)
                .reverse()
                .map(([star, count]) => (
                  <li key={star} className='flex items-center gap-2'>
                    <span className='shrink-0 text-sm'>{star} star</span>
                    <Progress value={(count / totalReviews) * 100} className='w-full' />
                    <span className='shrink-0 text-sm'>{count.toString()}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverRatingsDemo
```

---

## Popover 2 - Dimensions

```tsx
import { PencilRulerIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverDimensionsDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <PencilRulerIcon />
          <span className='sr-only'>Dimensions</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Dimensions</h4>
            <p className='text-muted-foreground text-sm'>Set the dimensions for the layer.</p>
          </div>
          <div className='grid gap-2'>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='width'>Width</Label>
              <Input id='width' defaultValue='100%' className='col-span-2 h-8' />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='maxWidth'>Max. width</Label>
              <Input id='maxWidth' defaultValue='300px' className='col-span-2 h-8' />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='height'>Height</Label>
              <Input id='height' defaultValue='25px' className='col-span-2 h-8' />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='maxHeight'>Max. height</Label>
              <Input id='maxHeight' defaultValue='none' className='col-span-2 h-8' />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverDimensionsDemo
```

---

## Popover 3 - Pricing

```tsx
import { DollarSignIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverPricingDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <DollarSignIcon />
          <span className='sr-only'>Pricing details</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-2.5'>
          <div className='flex items-center justify-between'>
            <span className='text-lg font-semibold'>Enterprise Plan</span>
            <span className='text-sm font-medium'>$49.99/month</span>
          </div>
          <p className='text-sm'>
            Get unlimited access to all features including AI-powered analytics, custom branding, priority support, and
            advanced team collaboration tools.
          </p>
          <div className='flex items-center gap-2'>
            <Badge variant='destructive' className='rounded-sm px-1.5 py-px text-xs'>
              Limited Offer
            </Badge>
            <span className='text-muted-foreground text-xs'>20% discount on annual plan</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverPricingDemo
```

---

## Popover 4 - Volume

```tsx
'use client'

import { useState } from 'react'

import { Volume2Icon, VolumeXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'

const PopoverVolumeDemo = () => {
  const [value, setValue] = useState([45])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <Volume2Icon />
          <span className='sr-only'>Volume control</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-2'>
            <Label className='leading-5'>Volume</Label>
            <output className='text-sm font-medium tabular-nums'>{value[0]}</output>
          </div>
          <div className='flex items-center gap-2'>
            <VolumeXIcon className='size-4 shrink-0 opacity-60' />
            <Slider value={value} onValueChange={setValue} aria-label='Volume slider' />
            <Volume2Icon className='size-4 shrink-0 opacity-60' />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverVolumeDemo
```

---

## Popover 5 - About

```tsx
import { InfoIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverAboutDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <InfoIcon />
          <span className='sr-only'>About Shadcn Studio</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='space-y-1.5 text-center'>
            <div className='text-lg font-semibold'>About Shadcn Studio</div>
            <p className='text-muted-foreground text-sm'>
              Welcome to Shadcn Studio — your toolkit for building sleek, customizable UI components with ease!
            </p>
          </div>
          <Button size='sm' asChild>
            <a
              href='https://shadcnstudio.com/docs/getting-started/introduction'
              target='_blank'
              rel='noopener noreferrer'
            >
              Learn More
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverAboutDemo
```

---

## Popover 6 - Download

```tsx
'use client'

import { useEffect, useState } from 'react'

import { DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'

import { cn } from '@/lib/utils'

const PopoverDownloadDemo = () => {
  const [isPaused, setIsPaused] = useState(false)
  const [isCanceled, setIsCanceled] = useState(false)
  const [value, setValue] = useState(0)
  const [open, setOpen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (open && !hasStarted && !isCanceled) {
      setHasStarted(true)
    }
  }, [open, hasStarted, isCanceled])

  useEffect(() => {
    if (!hasStarted || isPaused || isCanceled) return

    const timer = setInterval(() => {
      setValue(prev => {
        if (prev < 100) {
          return Math.min(100, prev + Math.floor(Math.random() * 10) + 1)
        } else {
          clearInterval(timer)

          return prev
        }
      })
    }, 500)

    return () => {
      clearInterval(timer)
    }
  }, [open, isPaused, isCanceled, hasStarted])

  const getText = () => {
    if (isCanceled) return 'Download Canceled'
    if (isPaused) return 'Download Paused'
    if (value === 100) return 'Download Complete'

    return 'Downloading File'
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <DownloadIcon />
          <span className='sr-only'>Download File</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='flex items-center gap-2'>
            <div className='relative flex size-6 items-center justify-center'>
              <span
                className={cn('border-primary absolute inset-0 rounded-full border border-dashed', {
                  'animate-spin [animation-duration:3s]': value < 100 && !isPaused && !isCanceled
                })}
              />
              <DownloadIcon className='z-1 size-3' />
            </div>
            <span className='flex-1 text-sm font-medium'>{getText()}</span>
            {!isCanceled && <span className='text-sm font-semibold'>{`${value}%`}</span>}
          </div>
          <Progress value={value} className='w-full' />
          <div className='grid grid-cols-2 gap-2'>
            <Button size='sm' onClick={() => setIsPaused(!isPaused)} disabled={value === 100 || isCanceled}>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => {
                if (value < 100) {
                  setValue(0)
                  setIsCanceled(true)
                  setHasStarted(false)
                }

                setOpen(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverDownloadDemo
```

---

## Popover 7 - Delete File

```tsx
import { FileWarningIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverDeleteFileDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <FileWarningIcon />
          <span className='sr-only'>Delete File</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='flex flex-col items-center gap-4'>
          <div className='flex aspect-square size-12 items-center justify-center rounded-full bg-red-500/10'>
            <FileWarningIcon className='text-destructive size-6' />
          </div>
          <div className='space-y-2 text-center'>
            <div className='font-semibold text-balance'>Are you sure you want to delete this file?</div>
            <p className='text-muted-foreground text-sm'>
              Deleting this file can affect your project and other files connection so keep in mind before making
              decision
            </p>
          </div>
          <div className='grid w-full grid-cols-2 gap-2'>
            <Button variant='secondary' size='sm'>
              Cancel
            </Button>
            <Button variant='destructive' size='sm'>
              Delete File
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverDeleteFileDemo
```

---

## Popover 8 - Feedback

```tsx
import { MessageCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

const PopoverFeedbackDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <MessageCircleIcon />
          <span className='sr-only'>Feedback</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-2'>
          <div className='font-medium'>Feedback</div>
          <Textarea placeholder='Type your message here.' className='max-h-56' />
          <div className='grid w-full grid-cols-2 gap-2'>
            <Button size='sm'>Send</Button>
            <Button variant='secondary' size='sm'>
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverFeedbackDemo
```

---

## Popover 9 - Filter

```tsx
'use client'

import { useState } from 'react'

import { FunnelPlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'

const filters = ['Most liked', 'Highest reviewed', 'Newest', 'Most popular']

const PopoverFilterDemo = () => {
  const [selected, setSelected] = useState(['Most liked', 'Newest'])
  const [price, setPrice] = useState([450])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <FunnelPlusIcon />
          <span className='sr-only'>Filter</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className='grid gap-4'>
          <div className='flex items-center justify-between gap-2'>
            <span className='font-medium'>Filter</span>
            <Button
              variant='secondary'
              className='h-7 rounded-full px-2 py-1 text-xs'
              onClick={() => {
                setSelected(['Most liked', 'Newest'])
                setPrice([450])
              }}
            >
              Reset all
            </Button>
          </div>
          <div className='flex flex-col gap-2'>
            {filters.map((label, index) => (
              <div key={index} className='flex items-center gap-2'>
                <Checkbox
                  id={`filter-${index + 1}`}
                  checked={selected.includes(label)}
                  onCheckedChange={checked =>
                    setSelected(checked ? [...selected, label] : selected.filter(item => item !== label))
                  }
                />
                <Label htmlFor={`filter-${index + 1}`}>{label}</Label>
              </div>
            ))}
          </div>
          <div className='grid gap-3'>
            <Label>Price range</Label>
            <div className='space-y-2'>
              <Slider value={price} onValueChange={setPrice} step={50} max={1000} aria-label='Price range' />
              <span className='text-muted-foreground flex w-full items-center justify-between gap-1 text-xs font-medium'>
                <span>0</span>
                <span>500</span>
                <span>1000</span>
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverFilterDemo
```

---

## Popover 10 - Search

```tsx
'use client'

import { useEffect, useState } from 'react'

import { LoaderCircleIcon, SearchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const users = [
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    name: 'Howard Lloyd',
    fallback: 'HL',
    notifications: 3
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    name: 'Olivia Sparks',
    fallback: 'OS'
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    name: 'Hallie Richards',
    fallback: 'HR',
    notifications: 1
  }
]

const useDebounce = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

const PopoverSearchDemo = () => {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const debouncedSearch = useDebounce(inputValue)
  const [filteredUsers, setFilteredUsers] = useState(users)

  // Handle loading state when input changes
  useEffect(() => {
    if (inputValue) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [inputValue])

  // Apply filtering after debounce and update loading state
  useEffect(() => {
    if (debouncedSearch.trim() === '') {
      setFilteredUsers(users)
      setIsLoading(false)
    } else {
      const searchTerm = debouncedSearch.toLowerCase()

      const filtered = users.filter(user => user.name.toLowerCase().includes(searchTerm))

      setFilteredUsers(filtered)
      setIsLoading(false)
    }
  }, [debouncedSearch])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <SearchIcon />
          <span className='sr-only'>Search users</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='relative'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <SearchIcon className='size-4' />
              <span className='sr-only'>Search</span>
            </div>
            <Input
              type='search'
              placeholder='Search users'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className='peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none'
            />
            {isLoading && (
              <div className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3 peer-disabled:opacity-50'>
                <LoaderCircleIcon className='size-4 animate-spin' />
                <span className='sr-only'>Loading...</span>
              </div>
            )}
          </div>
          <ul className='space-y-2'>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <li key={index} className='flex items-center gap-2'>
                  <Avatar className='size-6'>
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className='text-xs'>{user.fallback}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 text-sm font-medium'>{user.name}</div>
                  {user.notifications && (
                    <span className='text-muted-foreground text-xs'>{`${user.notifications} Notification${user.notifications > 1 ? 's' : ''}`}</span>
                  )}
                </li>
              ))
            ) : (
              <li className='py-2 text-center text-sm'>No users found</li>
            )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverSearchDemo
```

---

## Popover 11 - Notifications

```tsx
'use client'

import { useState } from 'react'

import { BellIcon, CircleIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

const notifications = [
  {
    id: 1,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    message: 'Harry assigned you task of New API implementation',
    fallback: 'HL',
    time: '15 Minutes'
  },
  {
    id: 2,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    message: 'Jerry joined team',
    fallback: 'OS',
    time: '35 Minutes'
  },
  {
    id: 3,
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    message: 'Congratulate ruby for married life',
    fallback: 'HR',
    time: '3 days'
  }
]

const PopoverNotificationsDemo = () => {
  const [readMessages, setReadMessages] = useState([3])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <BellIcon />
          <span className='sr-only'>Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0'>
        <div className='grid'>
          <div className='flex items-center justify-between gap-2 px-4 py-2.5'>
            <span className='font-medium'>Notifications</span>
            <Button
              variant='secondary'
              className='h-7 rounded-full px-2 py-1 text-xs'
              onClick={() => setReadMessages(notifications.map(item => item.id))}
            >
              Mark as all read
            </Button>
          </div>
          <Separator className='' />
          <ul className='grid gap-4 p-2'>
            {notifications.map(item => (
              <li
                key={item.id}
                className='hover:bg-accent flex items-start gap-2 rounded-lg px-2 py-1.5'
                onClick={() => setReadMessages([...readMessages, item.id])}
              >
                <Avatar className='rounded-lg'>
                  <AvatarImage src={item.image} alt={item.fallback} />
                  <AvatarFallback className='rounded-lg text-xs'>{item.fallback}</AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <div className='text-sm font-medium'>{item.message}</div>
                  <p className='text-muted-foreground text-xs'>{`${item.time} ago`}</p>
                </div>
                {!readMessages.includes(item.id) && (
                  <CircleIcon className='fill-primary text-primary size-2 self-center' />
                )}
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverNotificationsDemo
```

---

## Popover 12 - About Himalayas

```tsx
import { ChevronRightIcon, MapPinIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverAboutHimalayasDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon'>
          <MapPinIcon />
          <span className='sr-only'>About Himalayas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-85 p-0'>
        <div className='flex'>
          <div className='space-y-2 p-4'>
            <p className='font-medium'>About Himalayas</p>
            <p className='text-muted-foreground text-xs'>
              The Great Himalayan mountain ranges in the Indian sub-continent region.{' '}
            </p>
            <a
              href='https://en.wikipedia.org/wiki/Himalayas'
              target='_blank'
              rel='noopener noreferrer'
              className='flex w-fit text-xs hover:underline'
            >
              Read more
              <ChevronRightIcon className='size-4' />
            </a>
          </div>
          <img
            src='https://lp-cms-production.imgix.net/2021-01/GettyRF_450207051.jpg?height=136'
            alt='the himalayas'
            className='h-34 w-2/5 rounded-r-md object-cover'
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverAboutHimalayasDemo
```
