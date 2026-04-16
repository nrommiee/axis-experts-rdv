# Collapsible Components

9 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Basic toggle | Simple expand/collapse |
| 2 | Tree | File/folder structure | File explorers |
| 3 | List | Show more items | Long lists |
| 4 | Profile | User cards expand | User directories |
| 5 | Filter | Multiple sections | E-commerce filters |
| 6 | Show More | Text toggle | FAQ, descriptions |
| 7 | Card | With image | Content cards |
| 8 | Dropdown Menu | Nested menu items | Navigation menus |
| 9 | Form | Multi-section form | Checkout, wizards |

---

## 1. Default

Basic collapsible with toggle button.

```tsx
import { ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const CollapsibleDemo = () => {
  return (
    <Collapsible className='flex w-full max-w-[350px] flex-col gap-2'>
      <div className='flex items-center justify-between gap-4 px-4'>
        <div className='text-sm font-semibold'>@peduarte starred 3 repositories</div>
        <CollapsibleTrigger asChild>
          <Button variant='ghost' size='icon-sm'>
            <ChevronsUpDownIcon />
            <span className='sr-only'>Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className='rounded-md border px-4 py-2 font-mono text-sm'>@radix-ui/primitives</div>
      <CollapsibleContent className='flex flex-col gap-2'>
        <div className='rounded-md border px-4 py-2 font-mono text-sm'>@radix-ui/colors</div>
        <div className='rounded-md border px-4 py-2 font-mono text-sm'>@stitches/react</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default CollapsibleDemo
```

---

## 2. Tree

File tree structure with nested folders.

```tsx
import { ChevronRightIcon, FileIcon, FolderIcon, FolderOpenIcon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type FileTreeItem = {
  name: string
} & (
  | {
      type: 'file'
      children?: never
    }
  | {
      type: 'folder'
      children: FileTreeItem[]
    }
)

const fileTree: FileTreeItem[] = [
  {
    name: 'components',
    type: 'folder',
    children: [
      {
        name: 'ui',
        type: 'folder',
        children: [
          { name: 'button.tsx', type: 'file' },
          { name: 'input.tsx', type: 'file' },
          { name: 'sidebar.tsx', type: 'file' }
        ]
      },
      { name: 'app-sidebar.tsx', type: 'file' }
    ]
  },
  {
    name: 'hooks',
    type: 'folder',
    children: [{ name: 'use-mobile.ts', type: 'file' }]
  },
  {
    name: 'lib',
    type: 'folder',
    children: [{ name: 'utils.ts', type: 'file' }]
  },
  {
    name: 'components.json',
    type: 'file'
  }
]

const FileTree = ({ item, level }: { level: number; item: FileTreeItem }) => {
  if (item.type === 'file') {
    return (
      <div
        className='focus-visible:ring-ring/50 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-[3px]'
        style={{ paddingLeft: `${level === 0 ? 1.75 : 3.25}rem` }}
      >
        <FileIcon className='size-4 shrink-0' />
        <span className='text-muted-foreground text-sm'>{item.name}</span>
      </div>
    )
  }

  return (
    <Collapsible className='flex flex-col gap-1.5' style={{ paddingLeft: `${level === 0 ? 0 : 1.5}rem` }}>
      <CollapsibleTrigger className='focus-visible:ring-ring/50 flex items-center gap-2 rounded-md p-1 outline-none focus-visible:ring-[3px]'>
        <ChevronRightIcon className='size-4 shrink-0 transition-transform [[data-state="open"]>&]:rotate-90' />
        <FolderIcon className='size-4 shrink-0 [[data-state=open]>&]:hidden' />
        <FolderOpenIcon className='size-4 shrink-0 [[data-state=closed]>&]:hidden' />
        <span className='text-sm'>{item.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className='flex flex-col gap-1.5'>
        {item.children.map(item => (
          <FileTree key={item.name} item={item} level={level + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const CollapsibleTreeDemo = () => {
  return (
    <div className='flex w-full max-w-48 flex-col gap-2'>
      {fileTree.map(item => (
        <FileTree key={item.name} item={item} level={0} />
      ))}
    </div>
  )
}

export default CollapsibleTreeDemo
```

---

## 3. List

Show more/less for list items.

```tsx
import { ChevronUpIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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

const CollapsibleListDemo = () => {
  return (
    <Collapsible className='flex w-full max-w-[350px] flex-col items-start gap-4'>
      <div className='font-medium'>Today&apos;s task completion</div>
      <ul className='flex w-full flex-col gap-2'>
        {tasks.slice(0, 2).map(task => (
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
        <CollapsibleContent className='flex flex-col gap-2'>
          {tasks.slice(2).map(task => (
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
        </CollapsibleContent>
      </ul>
      <CollapsibleTrigger asChild>
        <Button variant='outline' size='sm'>
          <span className='[[data-state=open]>&]:hidden'>Show more</span>
          <span className='[[data-state=closed]>&]:hidden'>Show less</span>
          <ChevronUpIcon className='[[data-state=closed]>&]:rotate-180' />
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  )
}

export default CollapsibleListDemo
```

---

## 4. Profile

Expandable user profile cards.

```tsx
import { ChevronRightIcon, PanelsTopLeftIcon, PlusIcon, UserIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const users = [
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'HL',
    name: 'Howard Lloyd',
    bio: 'Senior Product Manager with 8+ years of experience in SaaS product development and team leadership.',
    projects: 5,
    followers: 120
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'OS',
    name: 'Olivia Sparks',
    bio: 'Full-stack Software Engineer specializing in React, Node.js, and cloud architecture solutions.',
    projects: 3,
    followers: 95,
    followed: true
  },
  {
    image: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards',
    bio: 'Creative UI/UX Designer with expertise in user research, wireframing, and accessible interface design.',
    projects: 4,
    followers: 80
  }
]

const CollapsibleProfileDemo = () => {
  return (
    <ul className='flex w-full max-w-[350px] flex-col gap-4'>
      {users.map(user => (
        <Collapsible key={user.name} asChild>
          <li className='flex flex-col gap-2'>
            <CollapsibleTrigger className='flex w-full items-center justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <Avatar>
                  <AvatarImage src={user.image} alt={user.fallback} />
                  <AvatarFallback>{user.fallback}</AvatarFallback>
                </Avatar>
                <span className='font-medium'>{user.name}</span>
              </div>
              <ChevronRightIcon className='size-4 transition-transform [[data-state=open]_&]:rotate-90' />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className='flex flex-col gap-2'>
                <p className='text-muted-foreground text-sm'>{user.bio}</p>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-4'>
                    <span className='flex items-center gap-2'>
                      <UserIcon className='size-4' />
                      <span className='text-sm'>{user.followers}</span>
                    </span>
                    <span className='flex items-center gap-2'>
                      <PanelsTopLeftIcon className='size-4' />
                      <span className='text-sm'>{user.projects}</span>
                    </span>
                  </div>
                  {user.followed ? (
                    <Button variant='outline' className='h-7 rounded-full px-3 py-1 text-xs'>
                      Following
                    </Button>
                  ) : (
                    <Button className='h-7 rounded-full px-3 py-1 text-xs'>
                      Follow
                      <PlusIcon />
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </li>
        </Collapsible>
      ))}
    </ul>
  )
}

export default CollapsibleProfileDemo
```

---

## 5. Filter

E-commerce style filter sections.

```tsx
import { ChevronDownIcon, StarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const CollapsibleFilterDemo = () => {
  return (
    <div className='w-full max-w-[350px] space-y-3'>
      <Collapsible className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-4 px-4'>
          <div className='text-sm font-semibold'>Price Range</div>
          <CollapsibleTrigger asChild className='group'>
            <Button variant='ghost' size='icon-sm'>
              <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
              <span className='sr-only'>Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-4 px-4'>
            <Label htmlFor='min-price' className='shrink-0 text-sm font-medium'>
              Min Price
            </Label>
            <Input id='min-price' type='number' placeholder='0' className='max-w-58' />
          </div>
          <div className='flex items-center justify-between gap-4 px-4'>
            <Label htmlFor='max-price' className='shrink-0 text-sm font-medium'>
              Max Price
            </Label>
            <Input id='max-price' type='number' placeholder='1000' className='max-w-58' />
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Separator />
      <Collapsible className='flex w-full max-w-[350px] flex-col gap-2'>
        <div className='flex items-center justify-between gap-4 px-4'>
          <div className='text-sm font-semibold'>Customer Ratings</div>
          <CollapsibleTrigger asChild className='group'>
            <Button variant='ghost' size='icon-sm'>
              <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
              <span className='sr-only'>Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 px-4'>
            <Checkbox id='rating-4' />
            <Label htmlFor='rating-4' className='flex shrink-0 items-center gap-1 text-sm font-medium'>
              <span className='flex items-center gap-1'>
                4
                <StarIcon className='size-4 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400' />
              </span>
              & Up
            </Label>
          </div>
          <div className='flex items-center gap-2 px-4'>
            <Checkbox id='rating-3' />
            <Label htmlFor='rating-3' className='flex shrink-0 items-center gap-1 text-sm font-medium'>
              <span className='flex items-center gap-1'>
                3
                <StarIcon className='size-4 fill-amber-500 stroke-amber-500 dark:fill-amber-400 dark:stroke-amber-400' />
              </span>
              & Up
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Separator />
      <Collapsible className='flex w-full max-w-[350px] flex-col gap-2'>
        <div className='flex items-center justify-between gap-4 px-4'>
          <div className='text-sm font-semibold'>Brand</div>
          <CollapsibleTrigger asChild className='group'>
            <Button variant='ghost' size='icon-sm'>
              <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
              <span className='sr-only'>Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 px-4'>
            <Checkbox id='brand-apple' />
            <Label htmlFor='brand-apple' className='shrink-0 text-sm font-medium'>
              Apple
            </Label>
          </div>
          <div className='flex items-center gap-2 px-4'>
            <Checkbox id='brand-samsung' />
            <Label htmlFor='brand-samsung' className='shrink-0 text-sm font-medium'>
              Samsung
            </Label>
          </div>
          <div className='flex items-center gap-2 px-4'>
            <Checkbox id='brand-google' />
            <Label htmlFor='brand-google' className='shrink-0 text-sm font-medium'>
              Google
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default CollapsibleFilterDemo
```

---

## 6. Show More

Simple text toggle for FAQ style content.

```tsx
'use client'

import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const CollapsibleShowMoreDemo = () => {
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(true)
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false)

  return (
    <div className='w-full space-y-4'>
      <div className='space-y-2'>
        <p className='font-medium'>How can I track my order?</p>
        <Collapsible open={isTrackOrderOpen} onOpenChange={setIsTrackOrderOpen} className='space-y-2'>
          <CollapsibleContent>
            <p className='text-sm'>
              To track your order, simply log in to your account and navigate to the order history section. You&apos;ll
              find detailed information about your order status and tracking number there.
            </p>
          </CollapsibleContent>
          <CollapsibleTrigger>
            <span className='text-muted-foreground text-sm underline'>
              {isTrackOrderOpen ? 'Hide answer' : 'Show answer'}
            </span>
          </CollapsibleTrigger>
        </Collapsible>
      </div>
      <div className='space-y-2'>
        <p className='font-medium'>Can I cancel my order?</p>
        <Collapsible open={isCancelOrderOpen} onOpenChange={setIsCancelOrderOpen} className='space-y-2'>
          <CollapsibleContent>
            <p className='text-sm'>
              Scheduled delivery orders can be cancelled 72 hours prior to your selected delivery date for full refund.
            </p>
          </CollapsibleContent>
          <CollapsibleTrigger>
            <span className='text-muted-foreground text-sm underline'>
              {isCancelOrderOpen ? 'Hide answer' : 'Show answer'}
            </span>
          </CollapsibleTrigger>
        </Collapsible>
      </div>
    </div>
  )
}

export default CollapsibleShowMoreDemo
```

---

## 7. Card

Collapsible card with image content.

```tsx
import { ChevronUpIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const CollapsibleCardDemo = () => {
  return (
    <Card className='w-full max-w-md pb-0'>
      <Collapsible>
        <div className='flex items-center justify-between px-6 pb-6'>
          <CardTitle>How do I track my order?</CardTitle>
          <CardAction>
            <CollapsibleTrigger asChild>
              <Button variant='outline' size='sm'>
                <span className='[[data-state=open]>&]:hidden'>Show</span>
                <span className='[[data-state=closed]>&]:hidden'>Hide</span>
                <ChevronUpIcon className='[[data-state=closed]>&]:rotate-180' />
              </Button>
            </CollapsibleTrigger>
          </CardAction>
        </div>
        <CollapsibleContent>
          <CardContent className='space-y-2 px-0'>
            <p className='px-6'>You&apos;ll receive tracking information via email once your order ships.</p>
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/components/accordion/image-1.jpg?width=446&format=auto'
              alt='Banner'
              className='aspect-video h-70 rounded-b-xl object-cover'
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default CollapsibleCardDemo
```

---

## 8. Dropdown Menu

Collapsible sections inside dropdown menu.

```tsx
'use client'

import { ChevronRightIcon, CircleSmallIcon, LogOutIcon, SettingsIcon, UserIcon, UsersIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const CollapsibleDropdownMenuDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Dropdown with collapsible</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuItem>
          <UserIcon />
          <span>Profile</span>
        </DropdownMenuItem>
        <Collapsible asChild>
          <DropdownMenuGroup>
            <CollapsibleTrigger asChild>
              <DropdownMenuItem onSelect={event => event.preventDefault()} className='justify-between'>
                <div className='flex items-center gap-2'>
                  <SettingsIcon />
                  <span>Settings</span>
                </div>
                <ChevronRightIcon className='shrink-0 transition-transform [[data-state="open"]>&]:rotate-90' />
              </DropdownMenuItem>
            </CollapsibleTrigger>
            <CollapsibleContent className='pl-4'>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Billing & plans</span>
              </DropdownMenuItem>
            </CollapsibleContent>
          </DropdownMenuGroup>
        </Collapsible>
        <Collapsible asChild>
          <DropdownMenuGroup>
            <CollapsibleTrigger asChild>
              <DropdownMenuItem onSelect={event => event.preventDefault()} className='justify-between'>
                <div className='flex items-center gap-2'>
                  <UsersIcon />
                  <span>Users</span>
                </div>
                <ChevronRightIcon className='shrink-0 transition-transform [[data-state="open"]>&]:rotate-90' />
              </DropdownMenuItem>
            </CollapsibleTrigger>
            <CollapsibleContent className='pl-4'>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Teams</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Projects</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CircleSmallIcon />
                <span>Connections</span>
              </DropdownMenuItem>
            </CollapsibleContent>
          </DropdownMenuGroup>
        </Collapsible>
        <DropdownMenuItem>
          <LogOutIcon />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CollapsibleDropdownMenuDemo
```

---

## 9. Form

Multi-section checkout form with collapsible sections.

```tsx
'use client'

import { useId } from 'react'

import { ChevronDownIcon, CreditCardIcon } from 'lucide-react'

import { usePaymentInputs } from 'react-payment-inputs'
import images, { type CardImages } from 'react-payment-inputs/images'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

const CollapsibleFormDemo = () => {
  const id = useId()
  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps, getCardImageProps } = usePaymentInputs()

  const items = [
    { value: '1', label: 'Standard 3-5 Days', description: 'Friday, 15 June - Tuesday, 19 June', price: 'Free' },
    { value: '2', label: 'Express', description: 'Friday, 15 June - Sunday, 17 June', price: '$5.00' },
    { value: '3', label: 'Overnight', description: 'Tomorrow', price: '$10.00' }
  ]

  return (
    <div className='w-full space-y-3'>
      <div className='w-full max-w-md space-y-3 rounded-md border py-4'>
        {/* Delivery Address Section */}
        <Collapsible className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-4 px-4'>
            <div className='text-sm font-semibold'>Delivery Address</div>
            <CollapsibleTrigger asChild className='group'>
              <Button variant='ghost' size='icon-sm'>
                <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
                <span className='sr-only'>Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className='flex flex-col gap-3 px-4 pt-3'>
            <Input placeholder='Full Name' />
            <Textarea placeholder='Address' />
            <Input type='number' placeholder='Pin Code' />
            <Input placeholder='City' />
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        {/* Delivery Options Section */}
        <Collapsible className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-4 px-4'>
            <div className='text-sm font-semibold'>Delivery Options</div>
            <CollapsibleTrigger asChild className='group'>
              <Button variant='ghost' size='icon-sm'>
                <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
                <span className='sr-only'>Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className='flex flex-col gap-2 px-4'>
            <RadioGroup className='w-full gap-0 -space-y-px rounded-md pt-3 shadow-xs' defaultValue='2'>
              {items.map(item => (
                <div
                  key={item.value}
                  className='border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col gap-4 border p-4 outline-none first:rounded-t-md last:rounded-b-md has-data-[state=checked]:z-10'
                >
                  <div className='flex items-center justify-between gap-1.5'>
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value={item.value} />
                      <div className='space-y-1'>
                        <Label>{item.label}</Label>
                        <p className='text-muted-foreground text-sm'>{item.description}</p>
                      </div>
                    </div>
                    <div className='text-muted-foreground text-xs'>{item.price}</div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        {/* Payment Section */}
        <Collapsible className='flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-4 px-4'>
            <div className='text-sm font-semibold'>Payment</div>
            <CollapsibleTrigger asChild className='group'>
              <Button variant='ghost' size='icon-sm'>
                <ChevronDownIcon className='text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
                <span className='sr-only'>Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className='flex flex-col gap-2 px-4 pt-2'>
            <Label>Card details</Label>
            <Input placeholder='Card number' />
            <div className='flex gap-2'>
              <Input placeholder='MM/YY' />
              <Input placeholder='CVC' />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

export default CollapsibleFormDemo
```

**Note:** Full version uses `react-payment-inputs` for card validation.
