# Combobox Components

12 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Basic searchable | Simple selection |
| 2 | Option Group | Grouped items | Categorized options |
| 3 | Disabled Options | Some items disabled | Conditional selection |
| 4 | With Icons | Icons per option | Visual distinction |
| 5 | Custom Check | Custom check icon | Branded style |
| 6 | Add Button | Search + add new | Extensible lists |
| 7 | Timezone | All timezones | Location settings |
| 8 | User | Avatar + details | User selection |
| 9 | Country Flag | Flags + search | Country picker |
| 10 | Multiple | Multi-select badges | Tag selection |
| 11 | Multiple Expandable | Show more/less | Many selections |
| 12 | Count Badge | Selection count | Bulk selection |

---

## 1. Default

Basic searchable combobox.

```tsx
'use client'

import { useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const frameworks = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' }
]

const ComboboxDemo = () => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full max-w-xs justify-between'
          aria-label='Framework combobox'
        >
          {value ? frameworks.find(framework => framework.value === value)?.label : 'Select framework...'}
          <ChevronsUpDownIcon className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='p-0'>
        <Command>
          <CommandInput placeholder='Search framework...' className='h-9' />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map(framework => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={currentValue => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {framework.label}
                  <CheckIcon className={cn('ml-auto', value === framework.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ComboboxDemo
```

---

## 2. Option Group

Combobox with grouped options.

```tsx
'use client'

import { Fragment, useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const items = [
  {
    continent: 'Fruits',
    items: [{ value: 'Apples' }, { value: 'Bananas' }, { value: 'Cherries' }]
  },
  {
    continent: 'Vegetables',
    items: [{ value: 'Carrots' }, { value: 'Broccoli' }, { value: 'Spinach' }]
  },
  {
    continent: 'Beverages',
    items: [{ value: 'Tea' }, { value: 'Coffee' }, { value: 'Juice' }]
  }
]

const ComboboxOptionGroupDemo = () => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox option group</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='bg-background hover:bg-background border-input w-full justify-between px-3 font-normal'
          >
            {value ? (
              <span className='truncate'>{value}</span>
            ) : (
              <span className='text-muted-foreground'>Select item</span>
            )}
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search item...' />
            <CommandList>
              <CommandEmpty>No item found.</CommandEmpty>
              {items.map(group => (
                <Fragment key={group.continent}>
                  <CommandGroup heading={group.continent}>
                    {group.items.map(item => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={currentValue => {
                          setValue(currentValue)
                          setOpen(false)
                        }}
                      >
                        {item.value}
                        {value === item.value && <CheckIcon size={16} className='ml-auto' />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxOptionGroupDemo
```

---

## 3. Disabled Options

Combobox with some options disabled.

```tsx
'use client'

import { Fragment, useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const items = [
  {
    category: 'Fruits',
    items: [{ value: 'Apples' }, { value: 'Bananas' }, { value: 'Cherries' }]
  },
  {
    category: 'Vegetables',
    items: [{ value: 'Carrots' }, { value: 'Broccoli', disabled: true }, { value: 'Spinach' }]
  },
  {
    category: 'Beverages',
    items: [{ value: 'Tea' }, { value: 'Coffee', disabled: true }, { value: 'Juice' }]
  }
]

const ComboboxOptionDisabledDemo = () => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox disabled option</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='bg-background hover:bg-background border-input w-full justify-between px-3 font-normal'
          >
            {value ? (
              <span className='truncate'>{value}</span>
            ) : (
              <span className='text-muted-foreground'>Select item</span>
            )}
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search item...' />
            <CommandList>
              <CommandEmpty>No item found.</CommandEmpty>
              {items.map(group => (
                <Fragment key={group.category}>
                  <CommandGroup heading={group.category}>
                    {group.items.map(item => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={currentValue => {
                          setValue(currentValue)
                          setOpen(false)
                        }}
                        className={cn(item.disabled && 'cursor-not-allowed opacity-50')}
                        disabled={item.disabled}
                      >
                        {item.value}
                        {value === item.value && <CheckIcon size={16} className='ml-auto' />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxOptionDisabledDemo
```

---

## 4. With Icons

Combobox with icons for each option.

```tsx
'use client'

import { useId, useState } from 'react'

import {
  ChevronsUpDownIcon,
  DollarSignIcon,
  FactoryIcon,
  FilmIcon,
  HospitalIcon,
  MonitorIcon,
  SchoolIcon,
  ZapIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const industries = [
  { value: 'information technology', label: 'Information Technology', icon: MonitorIcon },
  { value: 'healthcare', label: 'Healthcare', icon: HospitalIcon },
  { value: 'finance', label: 'Finance', icon: DollarSignIcon },
  { value: 'education', label: 'Education', icon: SchoolIcon },
  { value: 'entertainment', label: 'Entertainment', icon: FilmIcon },
  { value: 'manufacturing', label: 'Manufacturing', icon: FactoryIcon },
  { value: 'energy', label: 'Energy', icon: ZapIcon }
]

const ComboboxOptionWithIconDemo = () => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox option with icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='bg-background hover:bg-background border-input w-full justify-between px-3 font-normal'
          >
            {value ? (
              <span className='flex min-w-0 items-center gap-2'>
                {(() => {
                  const selectedItem = industries.find(industry => industry.value === value)
                  if (selectedItem) {
                    const Icon = selectedItem.icon
                    return <Icon className='text-muted-foreground' />
                  }
                  return null
                })()}
                <span className='truncate'>{industries.find(industry => industry.value === value)?.label}</span>
              </span>
            ) : (
              <span className='text-muted-foreground'>Select industry category</span>
            )}
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search industries...' />
            <CommandList>
              <CommandEmpty>No industry found.</CommandEmpty>
              <CommandGroup>
                {industries.map(industry => (
                  <CommandItem
                    key={industry.value}
                    value={industry.value}
                    onSelect={currentValue => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center gap-2'>
                      <industry.icon className='text-muted-foreground size-4' />
                      {industry.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxOptionWithIconDemo
```

---

## 5. Custom Check Icon

Combobox with custom styled check icon.

```tsx
'use client'

import { useId, useState } from 'react'

import { CircleCheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const frameworks = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' }
]

const ComboboxCustomCheckIconDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox with custom check icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full max-w-xs justify-between'
          >
            {value ? (
              frameworks.find(framework => framework.value === value)?.label
            ) : (
              <span className='text-muted-foreground'>Select framework</span>
            )}
            <ChevronsUpDownIcon className='opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' className='h-9' />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map(framework => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={currentValue => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    {framework.label}
                    <CircleCheckIcon
                      className={cn(
                        'ml-auto fill-blue-500 stroke-white',
                        value === framework.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxCustomCheckIconDemo
```

---

## 6. With Add Button

Combobox with search and add new item button.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const universities = [
  { value: 'harvard', label: 'Harvard University' },
  { value: 'cambridge', label: 'University of Cambridge' },
  { value: 'stanford', label: 'Stanford University' },
  { value: 'texas', label: 'University of Texas' }
]

const ComboboxWithSearchAndButtonDemo = () => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>('harvard')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Combobox with search and add button</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='bg-background hover:bg-background border-input w-full justify-between px-3 font-normal'
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value ? (
                universities.find(university => university.value === value)?.label
              ) : (
                <span className='text-muted-foreground'>Select university</span>
              )}
            </span>
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Find university' />
            <CommandList>
              <CommandEmpty>No university found.</CommandEmpty>
              <CommandGroup>
                {universities.map(university => (
                  <CommandItem
                    key={university.value}
                    value={university.value}
                    onSelect={currentValue => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    {university.label}
                    {value === university.value && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <Button variant='ghost' className='w-full justify-start font-normal'>
                  <PlusIcon className='-ms-2 opacity-60' />
                  New university
                </Button>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxWithSearchAndButtonDemo
```

---

## 7. Timezone

Combobox with all timezones.

```tsx
'use client'

import { useId, useMemo, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

const ComboboxTimezoneDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<string>('Indian/Cocos')

  const timezones = Intl.supportedValuesOf('timeZone')

  const formattedTimezones = useMemo(() => {
    return timezones
      .map(timezone => {
        const formatter = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'shortOffset'
        })
        const parts = formatter.formatToParts(new Date())
        const offset = parts.find(part => part.type === 'timeZoneName')?.value || ''
        const formattedOffset = offset === 'GMT' ? 'GMT+0' : offset

        return {
          value: timezone,
          label: `(${formattedOffset}) ${timezone.replace(/_/g, ' ')}`,
          numericOffset: parseInt(formattedOffset.replace('GMT', '').replace('+', '') || '0')
        }
      })
      .sort((a, b) => a.numericOffset - b.numericOffset)
  }, [timezones])

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Timezone combobox</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between'>
            <span className={cn('truncate')}>
              {value ? (
                formattedTimezones.find(timezone => timezone.value === value)?.label
              ) : (
                <span className='text-muted-foreground'>Select timezone</span>
              )}
            </span>
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
          <Command>
            <CommandInput placeholder='Search timezone' />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {formattedTimezones.map(({ value: itemValue, label }) => (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    onSelect={currentValue => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    <span className='truncate'>{label}</span>
                    {value === itemValue && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxTimezoneDemo
```

---

## 8. User

Combobox with user avatars and details.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const users = [
  { name: 'Phillip George', email: 'phillip12@gmail.com', avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png' },
  { name: 'Jaylon Donin', email: 'jaylo-don@yahoo.com', avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png' },
  { name: 'Tiana Curtis', email: 'tiana_curtis@gmail.com', avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png' },
  { name: 'Zaire Vetrovs', email: 'zaire.vetrovs@outlook.com', avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-4.png' }
]

const ComboboxUserDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const selectedUser = users.find(user => user.name === value)

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>User combobox</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between'>
            {selectedUser ? (
              <span className='flex gap-2'>
                <Avatar className='size-6'>
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <span className='font-medium'>{selectedUser.name}</span>
              </span>
            ) : (
              <span className='text-muted-foreground'>Select user</span>
            )}
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0'>
          <Command>
            <CommandInput placeholder='Search user...' />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map(user => (
                  <CommandItem
                    key={user.name}
                    value={user.name}
                    onSelect={currentValue => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    <span className='flex items-center gap-2'>
                      <Avatar className='size-7'>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className='flex flex-col'>
                        <span className='font-medium'>{user.name}</span>
                        <span className='text-muted-foreground text-sm'>{user.email}</span>
                      </span>
                    </span>
                    {value === user.name && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxUserDemo
```

---

## 9. Country Flag

Combobox with country flags.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const countries = [
  { value: '1', label: 'India', flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/india.png' },
  { value: '2', label: 'China', flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/china.png' },
  { value: '3', label: 'Monaco', flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/monaco.png' },
  { value: '4', label: 'Serbia', flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/serbia.png' },
  { value: '5', label: 'Romania', flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/romania.png' }
]

const ComboboxCountryFlagDemo = () => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Options with flag and search</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='bg-background hover:bg-background border-input w-full justify-between px-3 font-normal'
          >
            {value ? (
              <span className='flex min-w-0 items-center gap-2'>
                <img src={countries.find(item => item.label === value)?.flag} alt={value} className='h-4 w-5' />
                <span className='truncate'>{value}</span>
              </span>
            ) : (
              <span className='text-muted-foreground'>Select country</span>
            )}
            <ChevronDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search country...' />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {countries.map(country => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={currentValue => {
                    setValue(currentValue)
                    setOpen(false)
                  }}
                >
                  <img src={country.flag} alt={`${country.label} flag`} className='h-4 w-5' />
                  {country.label}
                  {value === country.value && <CheckIcon size={16} className='ml-auto' />}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxCountryFlagDemo
```

---

## 10. Multiple

Multi-select combobox with badges.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Nextjs' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'VueJS' },
  { value: 'django', label: 'Django' },
  { value: 'astro', label: 'Astro' }
]

const ComboboxMultipleDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(['react'])

  const toggleSelection = (value: string) => {
    setSelectedValues(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  const removeSelection = (value: string) => {
    setSelectedValues(prev => prev.filter(v => v !== value))
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Multiple combobox</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
          >
            <div className='flex flex-wrap items-center gap-1 pr-2.5'>
              {selectedValues.length > 0 ? (
                selectedValues.map(val => {
                  const framework = frameworks.find(c => c.value === val)
                  return framework ? (
                    <Badge key={val} variant='outline' className='rounded-sm'>
                      {framework.label}
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-4'
                        onClick={e => {
                          e.stopPropagation()
                          removeSelection(val)
                        }}
                        asChild
                      >
                        <span>
                          <XIcon className='size-3' />
                        </span>
                      </Button>
                    </Badge>
                  ) : null
                })
              ) : (
                <span className='text-muted-foreground'>Select framework</span>
              )}
            </div>
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map(framework => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={() => toggleSelection(framework.value)}
                  >
                    <span className='truncate'>{framework.label}</span>
                    {selectedValues.includes(framework.value) && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxMultipleDemo
```

---

## 11. Multiple Expandable

Multi-select with show more/less toggle.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Nextjs' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'VueJS' },
  { value: 'django', label: 'Django' },
  { value: 'astro', label: 'Astro' },
  { value: 'remix', label: 'Remix' },
  { value: 'svelte', label: 'Svelte' }
]

const ComboboxMultipleExpandableDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(['react', 'qwik', 'solidjs', 'angular', 'astro'])

  const toggleSelection = (value: string) => {
    setSelectedValues(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  const removeSelection = (value: string) => {
    setSelectedValues(prev => prev.filter(v => v !== value))
  }

  const maxShownItems = 2
  const visibleItems = expanded ? selectedValues : selectedValues.slice(0, maxShownItems)
  const hiddenCount = selectedValues.length - visibleItems.length

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Multiple combobox expandable</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
          >
            <div className='flex flex-wrap items-center gap-1 pr-2.5'>
              {selectedValues.length > 0 ? (
                <>
                  {visibleItems.map(val => {
                    const framework = frameworks.find(c => c.value === val)
                    return framework ? (
                      <Badge key={val} variant='outline' className='rounded-sm'>
                        {framework.label}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-4'
                          onClick={e => {
                            e.stopPropagation()
                            removeSelection(val)
                          }}
                          asChild
                        >
                          <span>
                            <XIcon className='size-3' />
                          </span>
                        </Button>
                      </Badge>
                    ) : null
                  })}
                  {hiddenCount > 0 || expanded ? (
                    <Badge
                      variant='outline'
                      onClick={e => {
                        e.stopPropagation()
                        setExpanded(prev => !prev)
                      }}
                      className='rounded-sm'
                    >
                      {expanded ? 'Show Less' : `+${hiddenCount} more`}
                    </Badge>
                  ) : null}
                </>
              ) : (
                <span className='text-muted-foreground'>Select framework</span>
              )}
            </div>
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map(framework => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={() => toggleSelection(framework.value)}
                  >
                    <span className='truncate'>{framework.label}</span>
                    {selectedValues.includes(framework.value) && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxMultipleExpandableDemo
```

---

## 12. Count Badge

Multi-select showing count badge.

```tsx
'use client'

import { useId, useState } from 'react'

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Nextjs' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'VueJS' },
  { value: 'django', label: 'Django' },
  { value: 'astro', label: 'Astro' }
]

const ComboboxMultipleCountBadgeDemo = () => {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(['react', 'nextjs', 'angular'])

  const toggleSelection = (value: string) => {
    setSelectedValues(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))
  }

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Multiple Count badge</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
          >
            {selectedValues.length > 0 ? (
              <span>
                <Badge variant='outline' className='rounded-sm'>
                  {selectedValues.length}
                </Badge>{' '}
                frameworks selected
              </span>
            ) : (
              <span className='text-muted-foreground'>Select framework</span>
            )}
            <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
          <Command>
            <CommandInput placeholder='Search framework...' />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map(framework => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={() => toggleSelection(framework.value)}
                  >
                    <span className='truncate'>{framework.label}</span>
                    {selectedValues.includes(framework.value) && <CheckIcon size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ComboboxMultipleCountBadgeDemo
```
