# Animated Popover Components

3 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Slide from Left | QR code, copy coupon | Promotions, discounts |
| 2 | Slide from Bottom | Team sharing, checkboxes | Collaboration, invites |
| 3 | Zoom In | Profile card | User profiles, previews |

---

## Animated Popover 1 - Slide In from Left

```tsx
'use client'

import { useState } from 'react'

import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import { cn } from '@/lib/utils'

const PopoverSlideInLeftDemo = () => {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('SUMMER25OFF')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>Slide-in from left</Button>
      </PopoverTrigger>
      <PopoverContent className='data-[state=open]:slide-in-from-left-20 data-[state=closed]:slide-out-to-left-20 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 w-80 duration-400'>
        <div className='flex flex-col items-center gap-4'>
          <div className='space-y-1 text-center'>
            <div className='text-lg font-semibold'>Summer Sale Discount</div>
            <p className='text-sm'>Scan this code at checkout for 25% off</p>
          </div>
          <div className='aspect-square rounded-xl border p-2'>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/popover/qr-code.png?height=152'
              alt='Discount QR Code'
              className='size-38 rounded-md'
            />
          </div>
          <div className='flex w-full items-center gap-1.5'>
            <Separator className='flex-1' />
            <span className='text-muted-foreground text-xs'>or use coupon code</span>
            <Separator className='flex-1' />
          </div>
          <div className='flex w-full gap-2'>
            <Input
              type='text'
              placeholder='Discount code'
              defaultValue='SUMMER25OFF'
              className='disabled:bg-muted'
              disabled
            />
            <Button variant='outline' size='icon' className='relative' onClick={handleCopy}>
              <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
                <CheckIcon className='stroke-green-600 dark:stroke-green-400' />
              </span>
              <span
                className={cn(
                  'absolute left-2.25 transition-all',
                  copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                )}
              >
                <CopyIcon />
              </span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverSlideInLeftDemo
```

---

## Animated Popover 2 - Slide In from Bottom

```tsx
import { useId } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const members = [
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'HL',
    name: 'Howard Lloyd',
    designation: 'Product Manager'
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'OS',
    name: 'Olivia Sparks',
    designation: 'Software Engineer'
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards',
    designation: 'UI/UX Designer'
  }
]

const PopoverSlideInBottomDemo = () => {
  const id = useId()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>Slide-in from bottom</Button>
      </PopoverTrigger>
      <PopoverContent className='data-[state=open]:slide-in-from-bottom-20 data-[state=closed]:slide-out-to-bottom-20 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 w-80 duration-400'>
        <div className='grid gap-4'>
          <div className='space-y-1'>
            <div className='font-medium'>Share to team members</div>
            <p className='text-muted-foreground text-sm'>
              Give your team members access to this project and start collaborating in real time
            </p>
          </div>
          <div className='w-full space-y-1.5'>
            <Label htmlFor={id} className='text-muted-foreground text-xs font-normal'>
              Email address
            </Label>
            <div className='flex gap-2'>
              <Input id={id} type='email' placeholder='example@xyz.com' className='h-8' />
              <Button type='submit' size='sm'>
                Share invite
              </Button>
            </div>
          </div>
          <div className='space-y-1.5'>
            <Label className='text-muted-foreground text-xs font-normal'>Team members</Label>
            <ul className='grid gap-2'>
              {members.map((member, index) => (
                <li key={index} className='flex items-center gap-3'>
                  <Checkbox id={`member-${index + 1}`} />
                  <Label htmlFor={`member-${index + 1}`} className='flex flex-1 items-center gap-2'>
                    <div className='flex flex-1 items-center gap-2'>
                      <Avatar className='size-6'>
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className='text-xs'>{member.fallback}</AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium'>{member.name}</span>
                    </div>
                    <span className='text-muted-foreground text-xs'>{member.designation}</span>
                  </Label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverSlideInBottomDemo
```

---

## Animated Popover 3 - Zoom In

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const PopoverZoomInDemo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>Zoom in</Button>
      </PopoverTrigger>
      <PopoverContent className='data-[state=open]:!zoom-in-0 data-[state=closed]:!zoom-out-0 origin-center duration-400'>
        <div className='grid gap-4'>
          <div className='flex flex-col items-center gap-2'>
            <Avatar className='size-20'>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Howard Lloyd' />
              <AvatarFallback className='text-xs'>HL</AvatarFallback>
            </Avatar>
            <div className='flex flex-col items-center text-center'>
              <p className='text-lg font-semibold'>Howard Lloyd</p>
              <span className='text-sm'>@iamhoward</span>
            </div>
          </div>
          <div className='from-border/20 via-border to-border/20 mx-auto h-px w-45 bg-gradient-to-r' />
          <p className='text-center text-sm italic'>
            Product Manager @oliviasparks, passionate about building user-centric solutions that solve real problems.
          </p>
          <div className='flex justify-center gap-2 text-sm'>
            <div className='font-medium'>
              512 <span className='text-muted-foreground font-normal'>followers</span>
            </div>
            <div className='font-medium'>
              128 <span className='text-muted-foreground font-normal'>following</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PopoverZoomInDemo
```
