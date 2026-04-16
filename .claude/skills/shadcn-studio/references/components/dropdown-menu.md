# Dropdown Menu Components

Collection de 14 variantes de Dropdown Menu de shadcn-studio.

---

## 1. Basic

```tsx
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Basic</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuDemo
```

---

## 2. User Switcher

```tsx
'use client'

import { useState } from 'react'

import { CheckIcon } from 'lucide-react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const users = [
  {
    id: 1,
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png',
    fallback: 'PG',
    name: 'Phillip George',
    mail: 'phillip12@gmail.com'
  },
  {
    id: 2,
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png',
    fallback: 'JD',
    name: 'Jaylon Donin',
    mail: 'jaylo-don@yahoo.com'
  },
  {
    id: 3,
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'TC',
    name: 'Tiana Curtis',
    mail: 'Tiana_curtis@gmail.com'
  }
]

const DropdownMenuUserSwitcherDemo = () => {
  const [selectUser, setSelectUser] = useState(users[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='bg-secondary flex items-center gap-2 rounded-lg px-3 py-2.5'>
        <Avatar>
          <AvatarImage src={selectUser.src} alt={selectUser.name} />
          <AvatarFallback className='text-xs'>{selectUser.fallback}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col gap-1 text-start leading-none'>
          <span className='max-w-[17ch] truncate text-sm leading-none font-semibold'>{selectUser.name}</span>
          <span className='text-muted-foreground max-w-[20ch] truncate text-xs'>{selectUser.mail}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-66'>
        <DropdownMenuLabel>Task Assignment</DropdownMenuLabel>
        {users.map(user => (
          <DropdownMenuItem key={user.id} onClick={() => setSelectUser(user)}>
            <div className='flex items-center gap-2'>
              <Avatar>
                <AvatarImage src={user.src} alt={user.name} />
                <AvatarFallback className='text-xs'>{user.fallback}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col gap-1 text-start leading-none'>
                <span className='max-w-[17ch] truncate text-sm leading-none font-semibold'>{user.name}</span>
                <span className='text-muted-foreground max-w-[20ch] truncate text-xs'>{user.mail}</span>
              </div>
            </div>
            {selectUser.id === user.id && <CheckIcon className='ml-auto' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuUserSwitcherDemo
```

---

## 3. Menu Item with Avatar (Chat List)

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = [
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png',
    fallback: 'PG',
    name: 'Phillip George',
    message: 'Hii samira, thanks for the...',
    time: '9:00AM',
    newMessages: 1
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png',
    fallback: 'JD',
    name: 'Jaylon Donin',
    message: "I'll send the texts and...",
    time: '10:00PM',
    newMessages: 3
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'TC',
    name: 'Tiana Curtis',
    message: "That's Great!",
    time: '8:30AM',
    newMessages: null
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png',
    fallback: 'ZV',
    name: 'Zaire Vetrovs',
    message: 'https://www.youtub...',
    time: '5:50AM',
    newMessages: 2
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'KP',
    name: 'Kianna Philips',
    message: 'Okay, It was awesome.',
    time: '6.45PM',
    newMessages: null
  }
]

const DropdownMenuItemAvatarDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Menu item with avatar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-91'>
        <DropdownMenuLabel>Chat List</DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem key={index} className='justify-between'>
              <Avatar>
                <AvatarImage src={item.src} alt={item.name} />
                <AvatarFallback className='text-xs'>{item.fallback}</AvatarFallback>
              </Avatar>
              <div className='flex flex-1 flex-col'>
                <span className='text-popover-foreground'>{item.name}</span>
                <span className='text-muted-foreground text-xs'>{item.message}</span>
              </div>
              {item.newMessages ? (
                <div className='flex flex-col items-end gap-1'>
                  <span className='text-muted-foreground text-xs'>{item.time}</span>
                  <Badge className='h-5 min-w-5 bg-green-600 px-1 dark:bg-green-400'>{item.newMessages}</Badge>
                </div>
              ) : (
                <span className='text-muted-foreground text-xs'>{item.time}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuItemAvatarDemo
```

---

## 4. Menu Item with Action (Contact List)

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = [
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'AD',
    name: 'Angel Dorwart',
    mail: 'sbaker@hotmail.com'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-7.png',
    fallback: 'SR',
    name: 'Skylar Rosser',
    mail: 'gbaker@yahoo.com'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-8.png',
    fallback: 'DB',
    name: 'Dulce Botosh',
    mail: 'tlee@gmail.com'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-9.png',
    fallback: 'AS',
    name: 'Ahmad Stanton',
    mail: 'kdavis@hotmail.com'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-10.png',
    fallback: 'RG',
    name: 'Randy Gouse',
    mail: 'ijackson@yahoo.com'
  }
]

const DropdownMenuItemActionDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Menu item with action</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-91'>
        <DropdownMenuLabel>Contact List</DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem key={index} className='justify-between'>
              <Avatar>
                <AvatarImage src={item.src} alt={item.name} />
                <AvatarFallback className='text-xs'>{item.fallback}</AvatarFallback>
              </Avatar>
              <div className='flex flex-1 flex-col'>
                <span className='text-popover-foreground'>{item.name}</span>
                <span className='text-muted-foreground text-xs'>{item.mail}</span>
              </div>
              <Button variant='secondary' className='h-7 cursor-pointer rounded-md px-2'>
                Send
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem>
            <Button className='grow'>Add Contact</Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuItemActionDemo
```

---

## 5. Meetings Schedule

```tsx
'use client'

import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

const avatars = [
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png',
    fallback: 'OS',
    name: 'Olivia Sparks'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-6.png',
    fallback: 'HL',
    name: 'Howard Lloyd'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png',
    fallback: 'HR',
    name: 'Hallie Richards'
  },
  {
    src: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-16.png',
    fallback: 'JW',
    name: 'Jenny Wilson'
  }
]

const DropdownMeetingScheduleDemo = () => {
  const [firstMeeting, setFirstMeeting] = useState(false)
  const [secondMeeting, setSecondMeeting] = useState(true)
  const [thirdMeeting, setThirdMeeting] = useState(false)
  const [forthMeeting, setForthMeeting] = useState(true)
  const [fifthMeeting, setFifthMeeting] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Meetings Schedule</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='sm:w-124'>
        <DropdownMenuLabel>Today&apos;s meetings</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem className='justify-between gap-3.5' onSelect={event => event.preventDefault()}>
            <span className='text-popover-foreground font-medium'>08:30</span>
            <div className='flex flex-1 flex-col'>
              <span className='text-popover-foreground'>Daily Project Review</span>
              <span className='text-muted-foreground text-xs'>Team organization</span>
            </div>
            <Avatar className='max-sm:hidden'>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-11.png' alt='Hallie Richards' />
              <AvatarFallback className='text-xs'>Angel</AvatarFallback>
            </Avatar>
            <div className='flex items-center gap-2'>
              <span className='text-popover-foreground text-sm'>Privacy</span>
              <Switch id='airplane-mode' checked={firstMeeting} onCheckedChange={setFirstMeeting} />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between gap-3.5' onSelect={event => event.preventDefault()}>
            <span className='text-popover-foreground font-medium'>09:00</span>
            <div className='flex flex-1 flex-col'>
              <span className='text-popover-foreground'>Sprint Surge</span>
              <span className='text-muted-foreground text-xs'>Daily Boost for Agile Progress</span>
            </div>
            <div className='flex -space-x-3 max-sm:hidden'>
              {avatars.map((avatar, index) => (
                <Avatar key={index} className='ring-background ring-2'>
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                  <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-popover-foreground text-sm'>Privacy</span>
              <Switch id='airplane-mode' checked={secondMeeting} onCheckedChange={setSecondMeeting} />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between gap-3.5' onSelect={event => event.preventDefault()}>
            <span className='text-popover-foreground font-medium'>11:45</span>
            <div className='flex flex-1 flex-col'>
              <span className='text-popover-foreground'>Project Status Update</span>
              <span className='text-muted-foreground text-xs'>Progress Overview Update</span>
            </div>
            <Avatar className='max-sm:hidden'>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-12.png' alt='Hallie Richards' />
              <AvatarFallback className='text-xs'>Angel</AvatarFallback>
            </Avatar>
            <div className='flex items-center gap-2'>
              <span className='text-popover-foreground text-sm'>Privacy</span>
              <Switch id='airplane-mode' checked={thirdMeeting} onCheckedChange={setThirdMeeting} />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between gap-3.5' onSelect={event => event.preventDefault()}>
            <span className='text-popover-foreground font-medium'>06:30</span>
            <div className='flex flex-1 flex-col'>
              <span className='text-popover-foreground'>Team Performance</span>
              <span className='text-muted-foreground text-xs'>Team Metrics Evaluation</span>
            </div>
            <div className='flex -space-x-3 max-sm:hidden'>
              {avatars.map((avatar, index) => (
                <Avatar key={index} className='ring-background ring-2'>
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                  <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-popover-foreground text-sm'>Privacy</span>
              <Switch id='airplane-mode' checked={forthMeeting} onCheckedChange={setForthMeeting} />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className='justify-between gap-3.5' onSelect={event => event.preventDefault()}>
            <span className='text-popover-foreground font-medium'>10:50</span>
            <div className='flex flex-1 flex-col'>
              <span className='text-popover-foreground'>Stakeholder Feedback</span>
              <span className='text-muted-foreground text-xs'>Feedback from Stakeholders</span>
            </div>
            <Avatar className='max-sm:hidden'>
              <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-14.png' alt='Hallie Richards' />
              <AvatarFallback className='text-xs'>Angel</AvatarFallback>
            </Avatar>
            <div className='flex items-center gap-2'>
              <span className='text-popover-foreground text-sm'>Privacy</span>
              <Switch id='airplane-mode' checked={fifthMeeting} onCheckedChange={setFifthMeeting} />
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMeetingScheduleDemo
```

---

## 6. Edit Menu

```tsx
import { AlignJustifyIcon, Heading1Icon, Heading2Icon, PencilIcon, TextSearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = [
  {
    icon: Heading1Icon,
    property: 'Heading 1',
    description: 'big section or hero heading'
  },
  {
    icon: Heading2Icon,
    property: 'Heading 2',
    description: 'Sub section heading'
  },
  {
    icon: AlignJustifyIcon,
    property: 'Align justify',
    description: 'text will fill all area'
  },
  {
    icon: TextSearchIcon,
    property: 'text search',
    description: 'find any text'
  }
]

const DropdownMenuEditMenuDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full'>
          <PencilIcon />
          <span className='sr-only'>Edit menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Edit text</DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem key={index}>
              <span className='flex items-center justify-center rounded-md border p-2'>
                <item.icon />
              </span>
              <div className='flex flex-col'>
                <span className='text-popover-foreground'>{item.property}</span>
                <span className='text-muted-foreground text-xs'>{item.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuEditMenuDemo
```

---

## 7. User Menu

```tsx
import { UserIcon, SettingsIcon, BellIcon, LogOutIcon, CreditCardIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = [
  {
    icon: UserIcon,
    property: 'Profile'
  },
  {
    icon: SettingsIcon,
    property: 'Settings'
  },
  {
    icon: CreditCardIcon,
    property: 'Billing'
  },
  {
    icon: BellIcon,
    property: 'Notifications'
  },
  {
    icon: LogOutIcon,
    property: 'Sign Out'
  }
]

const DropdownMenuUserMenuDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='secondary' size='icon' className='overflow-hidden rounded-full'>
          <img src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem key={index}>
              <item.icon />
              <span className='text-popover-foreground'>{item.property}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuUserMenuDemo
```

---

## 8. User Profile

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuUserProfileDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>User Profile</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel className='flex items-center gap-2'>
          <Avatar>
            <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png' alt='Phillip George' />
            <AvatarFallback className='text-xs'>PG</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-col'>
            <span className='text-popover-foreground'>Phillip George</span>
            <span className='text-muted-foreground text-xs'>phillip@example.com</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuUserProfileDemo
```

---

## 9. Align Start

```tsx
import { PencilLineIcon, UploadIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuAlignStartDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Align Start</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-34'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PencilLineIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UploadIcon />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive'>
            <Trash2Icon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuAlignStartDemo
```

---

## 10. Align End

```tsx
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuAlignEndDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Align End</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-66'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            New Tab<DropdownMenuShortcut>⌘ + T</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            New Window <DropdownMenuShortcut>⌘ + N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            New Incognito Window <DropdownMenuShortcut>⌘ + ⇧ + N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            History <DropdownMenuShortcut>⌘ + Y</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Downloads <DropdownMenuShortcut>⌥ + ⇧ + L</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuAlignEndDemo
```

---

## 11. Bordered Menu (Task Priority)

```tsx
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpIcon, EqualIcon, ChevronsDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = [
  {
    icon: ChevronsUpIcon,
    color: 'text-destructive',
    priority: 'Highest'
  },
  {
    icon: ChevronUpIcon,
    color: 'text-destructive/60',
    priority: 'High'
  },
  {
    icon: EqualIcon,
    color: 'text-amber-600 dark:text-amber-400',
    priority: 'Medium'
  },
  {
    icon: ChevronDownIcon,
    color: 'text-green-600/60 dark:text-green-400/60',
    priority: 'Low'
  },
  {
    icon: ChevronsDownIcon,
    color: 'text-green-600 dark:text-green-400',
    priority: 'Lowest'
  }
]

const DropdownMenuBorderedMenuDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Bordered Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 shadow-none'>
        <DropdownMenuLabel>Task priority</DropdownMenuLabel>
        <DropdownMenuGroup>
          {listItems.map((item, index) => (
            <DropdownMenuItem key={index}>
              <item.icon className={item.color} />
              {item.priority}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuBorderedMenuDemo
```

---

## 12. Menu Item with Icon

```tsx
import { CircleHelpIcon, DollarSignIcon, ReceiptIcon, SettingsIcon, UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuItemIconDemo = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>Menu item with icon</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>User Profile</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ReceiptIcon />
            Billing Plans
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DollarSignIcon />
            Pricing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CircleHelpIcon />
            FAQ
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuItemIconDemo
```

---

## 13. With Checkbox

```tsx
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuCheckboxDemo = () => {
  const [showStatusBar, setShowStatusBar] = useState(true)
  const [showActivityBar, setShowActivityBar] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>With checkbox</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
          Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showActivityBar} onCheckedChange={setShowActivityBar} disabled>
          API
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
          Invite users
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuCheckboxDemo
```

---

## 14. With Radio

```tsx
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const DropdownMenuRadioGroupDemo = () => {
  const [position, setPosition] = useState('bottom')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline'>With radio</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value='top'>Top</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='bottom'>Bottom</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='right' disabled>
            Right
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownMenuRadioGroupDemo
```
