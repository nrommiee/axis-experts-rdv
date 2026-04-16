# Select Components

36 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1-9 | Native | Chevron icon | Simple HTML select |
| 10 | Default | Grouped options | Basic shadcn select |
| 11 | Placeholder | Empty state | Form initial state |
| 12 | With Icon | Left icon | Categorized selection |
| 13 | Helper Text | Description below | Additional context |
| 14 | Invalid | Error state | Form validation |
| 15 | Sizes | sm/md/lg | Different contexts |
| 16 | Colored Ring | Custom focus color | Brand theming |
| 17 | Background Color | Colored trigger | Emphasis |
| 18 | Ghost | No border | Minimal UI |
| 19 | Disabled | Inactive state | Conditional forms |
| 20 | Disabled Option | Some options disabled | Conditional choices |
| 21 | Required | Asterisk label | Required fields |
| 22 | Option Groups | Grouped items | Categorized data |
| 23 | Separator | Dividers between groups | Clear separation |
| 24 | Overlapping Label | Floating label | Material design style |
| 25 | Inset Label | Label inside trigger | Compact forms |
| 35 | Listbox Single | React Aria | Single selection list |
| 36 | Listbox Groups | React Aria | Multi-select with groups |

---

## 1. Native Select

Basic HTML select with custom styling and chevron icon.

```tsx
import type { ComponentProps } from 'react'

import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const SelectNative = ({ className, children, ...props }: ComponentProps<'select'>) => {
  return (
    <div className='relative flex'>
      <select
        data-slot='select-native'
        className={cn(
          'peer border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 has-[option[disabled]:checked]:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-full cursor-pointer appearance-none items-center rounded-md border text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          props.multiple ? '[&_option:checked]:bg-accent py-1 *:px-3 *:py-1' : 'h-9 pr-8 pl-3',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {!props.multiple && (
        <span className='text-muted-foreground/80 peer-aria-invalid:text-destructive/80 pointer-events-none absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center peer-disabled:opacity-50'>
          <ChevronDownIcon size={16} aria-hidden='true' />
        </span>
      )}
    </div>
  )
}

export { SelectNative }
```

---

## 10. Default Select

Standard shadcn/ui select with grouped options.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Default select</Label>
      <Select defaultValue='apple'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
            <SelectItem value='grapes'>Grapes</SelectItem>
            <SelectItem value='pineapple'>Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectDemo
```

---

## 11. With Placeholder

Select showing placeholder when no value selected.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectPlaceholderDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with placeholder</Label>
      <Select>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
            <SelectItem value='grapes'>Grapes</SelectItem>
            <SelectItem value='pineapple'>Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectPlaceholderDemo
```

---

## 12. With Icon

Select with icon inside the trigger.

```tsx
import { useId } from 'react'

import { FilmIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectWithIconDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with icon</Label>
      <Select defaultValue='god of wars'>
        <SelectTrigger id={id} className='relative w-full pl-9'>
          <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 group-has-[select[disabled]]:opacity-50'>
            <FilmIcon size={16} aria-hidden='true' />
          </div>
          <SelectValue placeholder='Select time' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='god of wars'>God of Wars</SelectItem>
          <SelectItem value='ghost rider'>Ghost Rider</SelectItem>
          <SelectItem value='the cloth'>The Cloth</SelectItem>
          <SelectItem value='the possession'>The Possession</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithIconDemo
```

---

## 13. With Helper Text

Select with descriptive helper text below.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectWithHelperTextDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with helper text</Label>
      <Select defaultValue='3'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select framework' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>Florida</SelectItem>
          <SelectItem value='2'>New York</SelectItem>
          <SelectItem value='3'>California</SelectItem>
          <SelectItem value='4'>Texas</SelectItem>
        </SelectContent>
      </Select>
      <p className='text-muted-foreground mt-2 text-xs' role='region' aria-live='polite'>
        Could you share which city you&apos;re based in?
      </p>
    </div>
  )
}

export default SelectWithHelperTextDemo
```

---

## 14. Invalid State

Select with error styling and message.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectInvalidState = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with error</Label>
      <Select defaultValue='1'>
        <SelectTrigger id={id} aria-invalid className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>Tesla</SelectItem>
          <SelectItem value='2'>BMW</SelectItem>
          <SelectItem value='3'>Audi</SelectItem>
          <SelectItem value='4'>Mercedes-Benz</SelectItem>
        </SelectContent>
      </Select>
      <p className='text-destructive mt-2 text-xs' role='alert' aria-live='polite'>
        Selected option is invalid
      </p>
    </div>
  )
}

export default SelectInvalidState
```

---

## 15. Sizes

Select in small, default, and large sizes.

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectSizesDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Select>
        <SelectTrigger size='sm' className='w-full'>
          <SelectValue placeholder='Small select' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Default select' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className='!h-10 w-full'>
          <SelectValue placeholder='Large select' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectSizesDemo
```

---

## 16. Colored Border & Ring

Select with custom indigo focus styling.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectWithColorBorderAndRingDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with colored border and ring</Label>
      <Select defaultValue='1'>
        <SelectTrigger
          id={id}
          className='w-full focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:focus-visible:ring-indigo-500/40'
        >
          <SelectValue placeholder='Select framework' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>Electronics</SelectItem>
          <SelectItem value='2'>Clothing</SelectItem>
          <SelectItem value='3'>Home Appliances</SelectItem>
          <SelectItem value='4'>Books</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithColorBorderAndRingDemo
```

---

## 17. Background Color

Select with colored background (sky theme).

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectBackgroundColorDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with background color</Label>
      <Select defaultValue='hindi'>
        <SelectTrigger className='w-full border-sky-600 bg-sky-600/10 text-sky-600 shadow-none focus-visible:border-sky-600 focus-visible:ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:hover:bg-sky-400/10 dark:focus-visible:ring-sky-400/40 [&_svg]:!text-sky-600 dark:[&_svg]:!text-sky-400'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className='[&_div:focus]:bg-sky-600/20 [&_div:focus]:text-sky-600 dark:[&_div:focus]:bg-sky-400/20 dark:[&_div:focus]:text-sky-400'>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value='hindi' className='focus:[&_svg]:!text-sky-600 dark:focus:[&_svg]:!text-sky-400'>
              Hindi
            </SelectItem>
            <SelectItem value='english' className='focus:[&_svg]:!text-sky-600 dark:focus:[&_svg]:!text-sky-400'>
              English
            </SelectItem>
            <SelectItem value='spanish' className='focus:[&_svg]:!text-sky-600 dark:focus:[&_svg]:!text-sky-400'>
              Spanish
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectBackgroundColorDemo
```

---

## 18. Ghost

Borderless select with hover effect.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectGhostDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Ghost Select</Label>
      <Select defaultValue='apple'>
        <SelectTrigger className='hover:bg-accent w-full border-none shadow-none dark:bg-transparent'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectGhostDemo
```

---

## 19. Disabled

Fully disabled select.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectDisabledDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Disabled select</Label>
      <Select defaultValue='apple' disabled>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectDisabledDemo
```

---

## 20. Disabled Options

Select with some options disabled.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectDisabledOptionDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Disabled options select</Label>
      <Select defaultValue='apple'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana' disabled>
              Banana
            </SelectItem>
            <SelectItem value='blueberry'>Blueberry</SelectItem>
            <SelectItem value='grapes' disabled>
              Grapes
            </SelectItem>
            <SelectItem value='pineapple'>Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectDisabledOptionDemo
```

---

## 21. Required

Required select with asterisk indicator.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectRequiredDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id} className='gap-1'>
        Required select <span className='text-destructive'>*</span>
      </Label>
      <Select defaultValue='2' required>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select framework' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>United States</SelectItem>
          <SelectItem value='2'>Japan</SelectItem>
          <SelectItem value='3'>Australia</SelectItem>
          <SelectItem value='4'>Brazil</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectRequiredDemo
```

---

## 22. Option Groups

Select with multiple grouped sections.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectWithOptionsGroupsDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with options groups</Label>
      <Select defaultValue='7'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select framework' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            <SelectItem value='1'>United States</SelectItem>
            <SelectItem value='2'>Canada</SelectItem>
            <SelectItem value='3'>Mexico</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value='4'>United Kingdom</SelectItem>
            <SelectItem value='5'>Germany</SelectItem>
            <SelectItem value='6'>France</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value='7'>India</SelectItem>
            <SelectItem value='8'>Japan</SelectItem>
            <SelectItem value='9'>China</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithOptionsGroupsDemo
```

---

## 23. With Separator

Groups separated by dividers.

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const SelectWithSeparatorDemo = () => {
  const id = useId()

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor={id}>Select with separator</Label>
      <Select defaultValue='7'>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder='Select framework' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            <SelectItem value='1'>United States</SelectItem>
            <SelectItem value='2'>Canada</SelectItem>
            <SelectItem value='3'>Mexico</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value='4'>United Kingdom</SelectItem>
            <SelectItem value='5'>Germany</SelectItem>
            <SelectItem value='6'>France</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value='7'>India</SelectItem>
            <SelectItem value='8'>Japan</SelectItem>
            <SelectItem value='9'>China</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithSeparatorDemo
```

---

## 24. Overlapping Label

Material design style floating label.

```tsx
import { useId } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SelectWithOverlappingLabelDemo = () => {
  const id = useId()

  return (
    <div className='group relative w-full max-w-xs'>
      <label
        htmlFor={id}
        className='bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50'
      >
        Select with overlapping label
      </label>
      <Select>
        <SelectTrigger id={id} className='dark:!bg-background w-full'>
          <SelectValue placeholder='Select city' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>New York</SelectItem>
          <SelectItem value='2'>London</SelectItem>
          <SelectItem value='3'>Tokyo</SelectItem>
          <SelectItem value='4'>Paris</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithOverlappingLabelDemo
```

---

## 35. Listbox Single Selection

React Aria ListBox for single selection.

```tsx
'use client'

import { ListBox, ListBoxItem } from 'react-aria-components'

import { Label } from '@/components/ui/label'

const listitems = [
  { id: 'usd', label: 'USD (United States Dollar)' },
  { id: 'eur', label: 'EUR (Euro)' },
  { id: 'gbp', label: 'GBP (British Pound)', isDisabled: true },
  { id: 'jpy', label: 'JPY (Japanese Yen)' }
]

const ListboxSingleOptionDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label>Listbox with single option selectable</Label>
      <div className='border-input overflow-hidden rounded-md border'>
        <ListBox
          className='bg-background space-y-1 p-1 text-sm shadow-xs transition-[color,box-shadow]'
          aria-label='Select framework'
          selectionMode='single'
          defaultSelectedKeys={['svelte']}
        >
          {listitems.map(item => (
            <ListBoxItem
              key={item.id}
              className='data-[disabled]:text-muted-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground flex items-center justify-between rounded-sm px-2 py-1.5'
              textValue={item.label}
              isDisabled={item.isDisabled}
            >
              {item.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </div>
      <p className='text-muted-foreground text-xs' role='region' aria-live='polite'>
        Built using{' '}
        <a
          href='https://react-spectrum.adobe.com/react-aria/ListBox.html'
          className='hover:text-primary underline'
          target='_blank'
        >
          React Aria
        </a>
      </p>
    </div>
  )
}

export default ListboxSingleOptionDemo
```

---

## 36. Listbox with Groups

React Aria ListBox with sections and multiple selection.

```tsx
'use client'

import { Header, ListBox, ListBoxItem, ListBoxSection, Separator } from 'react-aria-components'

import { Label } from '@/components/ui/label'

const ListBoxWithOptionGroupsDemo = () => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label>Listbox with option groups</Label>
      <div className='border-input overflow-hidden rounded-md border'>
        <ListBox
          className='bg-background max-h-65 min-h-20 space-y-2 overflow-auto p-1 text-sm shadow-xs transition-[color,box-shadow]'
          aria-label='Select some foods'
          selectionMode='multiple'
          defaultSelectedKeys={['english', 'tuna']}
        >
          <ListBoxSection className='space-y-1'>
            <Header className='text-muted-foreground px-2 py-1.5 text-xs font-medium'>European Languages</Header>
            <ListBoxItem
              id='english'
              className='data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]'
            >
              English
            </ListBoxItem>
            <ListBoxItem
              id='french'
              className='data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]'
            >
              French
            </ListBoxItem>
            <ListBoxItem
              id='spanish'
              className='data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]'
            >
              Spanish
            </ListBoxItem>
          </ListBoxSection>
          <Separator className='bg-border -mx-1 my-2 h-px' />
          <ListBoxSection className='space-y-1'>
            <Header className='text-muted-foreground px-2 py-1.5 text-xs font-medium'>Asian Languages</Header>
            <ListBoxItem
              id='hindi'
              className='data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]'
            >
              Hindi
            </ListBoxItem>
            <ListBoxItem
              id='japanese'
              className='data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]'
            >
              Japanese
            </ListBoxItem>
          </ListBoxSection>
        </ListBox>
      </div>
      <p className='text-muted-foreground text-xs' role='region' aria-live='polite'>
        Built using{' '}
        <a
          href='https://react-spectrum.adobe.com/react-aria/ListBox.html'
          className='hover:text-primary underline'
          target='_blank'
        >
          React Aria
        </a>
      </p>
    </div>
  )
}

export default ListBoxWithOptionGroupsDemo
```
