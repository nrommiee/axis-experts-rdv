# Checkbox Components

16 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Default | Basic checkbox + label | Forms, agreements |
| 2 | Indeterminate | Three states | Parent/child selections |
| 3 | Dashed | Dashed border | Visual distinction |
| 4 | Todo | Strikethrough on check | Task lists |
| 5 | Sizes | Multiple sizes | Design flexibility |
| 6 | Badge | Checkbox in badge | Tag selection |
| 7 | Description | With helper text | Complex options |
| 8 | Horizontal Group | Row layout | Filter options |
| 9 | Vertical Group | Column + icons | Feature lists |
| 10 | Colors | Custom colors | Semantic meaning |
| 11 | Custom Icons | Heart/Star/Circle | Social interactions |
| 12 | Filled Icons | Colored circles | Status indicators |
| 13 | Card | Checkbox in card | Settings panels |
| 14 | List Group | Bordered list | Skill selection |
| 15 | Tree | Parent/child hierarchy | Nested options |
| 16 | Form | With buttons | Form submissions |

---

## 1. Default

Basic checkbox with label.

```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} />
      <Label htmlFor={id}>Accept terms and conditions</Label>
    </div>
  )
}

export default CheckboxDemo
```

---

## 2. Indeterminate

Checkbox with indeterminate (partial) state.

```tsx
'use client'

import { useId, useState, type ComponentProps } from 'react'

import { CheckIcon, MinusIcon } from 'lucide-react'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

import { Label } from '@/components/ui/label'

const Checkbox = (props: ComponentProps<typeof CheckboxPrimitive.Root>) => {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className='peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive group size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='flex items-center justify-center text-current transition-none'
      >
        <MinusIcon className='hidden size-2.5 group-data-[state=indeterminate]:block' />
        <CheckIcon className='hidden size-3.5 group-data-[state=checked]:block' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

const CheckboxIndeterminateDemo = () => {
  const [checked, setChecked] = useState<CheckboxPrimitive.CheckedState>('indeterminate')

  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor={id}>Indeterminate checkbox</Label>
    </div>
  )
}

export default CheckboxIndeterminateDemo
```

---

## 3. Dashed

Checkbox with dashed border style.

```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxDashedDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} className='border-primary border-dashed' />
      <Label htmlFor={id}>Accept terms and conditions</Label>
    </div>
  )
}

export default CheckboxDashedDemo
```

---

## 4. Todo List

Checkbox with strikethrough label on check.

```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxTodoListDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} defaultChecked />
      <Label htmlFor={id} className='peer-data-[state=checked]:line-through'>
        Simple todo list item
      </Label>
    </div>
  )
}

export default CheckboxTodoListDemo
```

---

## 5. Sizes

Multiple checkbox sizes.

```tsx
import { Checkbox } from '@/components/ui/checkbox'

const CheckboxSizesDemo = () => {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox defaultChecked aria-label='Size default' />
      <Checkbox className='size-5' defaultChecked aria-label='Size small' />
      <Checkbox className='size-6' defaultChecked aria-label='Size large' />
    </div>
  )
}

export default CheckboxSizesDemo
```

---

## 6. Badge

Checkbox inside badge for tag selection.

```tsx
'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const snacks = ['Burger', 'Pizza', 'Drinks']

const CheckboxBadgeDemo = () => {
  const [selected, setSelected] = useState<string[]>(['Burger', 'Pizza'])

  return (
    <div className='flex items-center gap-2'>
      {snacks.map(label => (
        <Badge key={label} variant='secondary' className='relative gap-2 rounded-sm px-3 py-1.5'>
          <Checkbox
            id={label}
            checked={selected.includes(label)}
            onCheckedChange={checked =>
              setSelected(checked ? [...selected, label] : selected.filter(item => item !== label))
            }
            className='data-[state=unchecked]:hidden'
          />
          <label htmlFor={label} className='cursor-pointer select-none after:absolute after:inset-0'>
            {label}
          </label>
        </Badge>
      ))}
    </div>
  )
}

export default CheckboxBadgeDemo
```

---

## 7. Description

Checkbox with description text.

```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxDescriptionDemo = () => {
  const id = useId()

  return (
    <div className='flex items-start gap-2'>
      <Checkbox id={id} defaultChecked />
      <div className='grid gap-2'>
        <Label htmlFor={id} className='leading-4'>
          Accept terms and conditions
        </Label>
        <p className='text-muted-foreground text-xs'>
          By clicking this checkbox, you agree to the terms and conditions.
        </p>
      </div>
    </div>
  )
}

export default CheckboxDescriptionDemo
```

---

## 8. Horizontal Group

Checkboxes in horizontal layout.

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const technologies = ['React', 'Next.js', 'Remix']

const CheckboxHorizontalGroupDemo = () => {
  return (
    <div className='space-y-4'>
      <Label className='font-semibold'>Technologies</Label>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        {technologies.map(label => (
          <div key={label} className='flex items-center gap-2'>
            <Checkbox id={label} />
            <Label htmlFor={label}>{label}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckboxHorizontalGroupDemo
```

---

## 9. Vertical Group

Checkboxes in vertical layout with icons.

```tsx
import { AppleIcon, CherryIcon, GrapeIcon } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const fruits = [
  { label: 'Apple', icon: AppleIcon },
  { label: 'Cherry', icon: CherryIcon },
  { label: 'Grape', icon: GrapeIcon }
]

const CheckboxVerticalGroupDemo = () => {
  return (
    <div className='space-y-4'>
      <Label className='font-semibold'>Favorite Fruits</Label>
      <div className='flex flex-col gap-4'>
        {fruits.map(({ label, icon: Icon }) => (
          <div key={label} className='flex items-center gap-2'>
            <Checkbox id={label} />
            <Label htmlFor={label}>
              <Icon className='size-4' aria-hidden='true' />
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckboxVerticalGroupDemo
```

---

## 10. Colors

Checkboxes with custom colors.

```tsx
import { Checkbox } from '@/components/ui/checkbox'

const CheckboxColorsDemo = () => {
  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        className='data-[state=checked]:bg-destructive! data-[state=checked]:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:text-white'
        aria-label='Color destructive'
        defaultChecked
      />
      <Checkbox
        className='focus-visible:ring-sky-600/20 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 dark:text-white dark:focus-visible:ring-sky-400/40 dark:data-[state=checked]:border-sky-400 dark:data-[state=checked]:bg-sky-400'
        aria-label='Color info'
        defaultChecked
      />
      <Checkbox
        className='focus-visible:ring-green-600/20 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 dark:text-white dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:border-green-400 dark:data-[state=checked]:bg-green-400'
        aria-label='Color success'
        defaultChecked
      />
    </div>
  )
}

export default CheckboxColorsDemo
```

---

## 11. Custom Icons

Checkboxes with heart, star, and circle icons.

```tsx
import { HeartIcon, CircleIcon, StarIcon } from 'lucide-react'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

const CheckboxCustomIconsDemo = () => {
  return (
    <div className='flex items-center gap-2'>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='group focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3'
        aria-label='Heart icon'
      >
        <span className='group-data-[state=checked]:hidden'>
          <HeartIcon className='stroke-1' />
        </span>
        <span className='group-data-[state=unchecked]:hidden'>
          <HeartIcon className='fill-destructive stroke-destructive stroke-1' />
        </span>
      </CheckboxPrimitive.Root>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='group focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3'
        aria-label='Star icon'
      >
        <span className='group-data-[state=checked]:hidden'>
          <StarIcon className='stroke-1' />
        </span>
        <span className='group-data-[state=unchecked]:hidden'>
          <StarIcon className='fill-amber-500 stroke-amber-500 stroke-1 dark:fill-amber-400 dark:stroke-amber-400' />
        </span>
      </CheckboxPrimitive.Root>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='group focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3'
        aria-label='Circle icon'
      >
        <span className='group-data-[state=checked]:hidden'>
          <CircleIcon className='stroke-1' />
        </span>
        <span className='group-data-[state=unchecked]:hidden'>
          <CircleIcon className='fill-green-600 stroke-green-600 stroke-1 dark:fill-green-400 dark:stroke-green-400' />
        </span>
      </CheckboxPrimitive.Root>
    </div>
  )
}

export default CheckboxCustomIconsDemo
```

---

## 12. Filled Icons

Colored circle checkboxes with check icons.

```tsx
import { CircleCheckIcon } from 'lucide-react'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

const CheckboxFilledIconDemo = () => {
  return (
    <div className='flex items-center gap-2'>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='peer bg-destructive data-[state=checked]:text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 size-7 shrink-0 rounded-full shadow-xs transition-shadow outline-none focus-visible:ring-[3px]'
        aria-label='Color destructive'
      >
        <CheckboxPrimitive.Indicator
          data-slot='checkbox-indicator'
          className='flex items-center justify-center text-current transition-none'
        >
          <CircleCheckIcon className='size-5.5 fill-white stroke-current' />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='peer size-7 shrink-0 rounded-full bg-sky-600 shadow-xs transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-sky-600/20 data-[state=checked]:text-sky-600 dark:bg-sky-400 dark:focus-visible:ring-sky-400/40 dark:data-[state=checked]:text-sky-400'
        aria-label='Color info'
      >
        <CheckboxPrimitive.Indicator
          data-slot='checkbox-indicator'
          className='flex items-center justify-center text-current transition-none'
        >
          <CircleCheckIcon className='size-5.5 fill-white stroke-current' />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        defaultChecked
        className='peer size-7 shrink-0 rounded-full bg-green-600 shadow-xs transition-shadow outline-none focus-visible:ring-[3px] focus-visible:ring-green-600/20 data-[state=checked]:text-green-600 dark:bg-green-400 dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:text-green-400'
        aria-label='Color success'
      >
        <CheckboxPrimitive.Indicator
          data-slot='checkbox-indicator'
          className='flex items-center justify-center text-current transition-none'
        >
          <CircleCheckIcon className='size-5.5 fill-white stroke-current' />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </div>
  )
}

export default CheckboxFilledIconDemo
```

---

## 13. Card

Checkbox inside styled card.

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxCardDemo = () => {
  return (
    <div className='space-y-2'>
      <Label className='hover:bg-accent/50 flex items-start gap-2 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950'>
        <Checkbox
          defaultChecked
          className='data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700'
        />
        <div className='grid gap-1.5 font-normal'>
          <p className='text-sm leading-none font-medium'>Auto Start</p>
          <p className='text-muted-foreground text-sm'>Starting with your OS.</p>
        </div>
      </Label>
      <Label className='hover:bg-accent/50 flex items-start gap-2 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950'>
        <Checkbox className='data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700' />
        <div className='grid gap-1.5 font-normal'>
          <p className='text-sm leading-none font-medium'>Auto update</p>
          <p className='text-muted-foreground text-sm'>Download and install new version</p>
        </div>
      </Label>
    </div>
  )
}

export default CheckboxCardDemo
```

---

## 14. List Group

Checkboxes in bordered list.

```tsx
import { ChartPieIcon, CodeIcon, PaletteIcon } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const skills = [
  { label: 'Web Development', icon: CodeIcon },
  { label: 'Data Analysis', icon: ChartPieIcon },
  { label: 'Graphic Design', icon: PaletteIcon }
]

const CheckboxListGroupDemo = () => {
  return (
    <ul className='flex w-full flex-col divide-y rounded-md border'>
      {skills.map(({ label, icon: Icon }) => (
        <li key={label}>
          <Label htmlFor={label} className='flex items-center justify-between gap-2 px-5 py-3'>
            <span className='flex items-center gap-2'>
              <Icon className='size-4' /> {label}
            </span>
            <Checkbox id={label} />
          </Label>
        </li>
      ))}
    </ul>
  )
}

export default CheckboxListGroupDemo
```

---

## 15. Tree

Parent/child checkbox hierarchy.

```tsx
'use client'

import { useEffect, useState, type ComponentProps } from 'react'

import { CheckIcon, MinusIcon } from 'lucide-react'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

import { Label } from '@/components/ui/label'

const items = ['Child 1', 'Child 2', 'Child 3']

const Checkbox = (props: ComponentProps<typeof CheckboxPrimitive.Root>) => {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className='peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive group size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='flex items-center justify-center text-current transition-none'
      >
        <MinusIcon className='hidden size-2.5 group-data-[state=indeterminate]:block' />
        <CheckIcon className='hidden size-3.5 group-data-[state=checked]:block' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

const CheckboxTreeDemo = () => {
  const [checked, setChecked] = useState<CheckboxPrimitive.CheckedState>('indeterminate')
  const [selected, setSelected] = useState<string[]>(['Child 1', 'Child 2'])

  useEffect(() => {
    if (selected.length === items.length) {
      setChecked(true)
    } else if (selected.length > 0) {
      setChecked('indeterminate')
    } else {
      setChecked(false)
    }
  }, [selected])

  const handleCheckedChange = (checked: CheckboxPrimitive.CheckedState) => {
    setChecked(checked)

    if (checked === true) {
      setSelected([...items])
    } else if (checked === false) {
      setSelected([])
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2'>
        <Checkbox id='parent' checked={checked} onCheckedChange={handleCheckedChange} />
        <Label htmlFor='parent'>Parent</Label>
      </div>
      <div className='flex flex-col gap-2 pl-6'>
        {items.map(label => (
          <div key={label} className='flex items-center gap-2'>
            <Checkbox
              id={label}
              checked={selected.includes(label)}
              onCheckedChange={checked =>
                setSelected(checked ? [...selected, label] : selected.filter(item => item !== label))
              }
            />
            <Label htmlFor={label}>{label}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CheckboxTreeDemo
```

---

## 16. Form

Checkbox with form buttons.

```tsx
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const CheckboxFormDemo = () => {
  const id = useId()

  return (
    <div className='flex items-start gap-2'>
      <Checkbox id={id} defaultChecked />
      <div className='grid gap-2'>
        <Label htmlFor={id} className='gap-1 leading-4'>
          Accept terms and conditions
        </Label>
        <p className='text-muted-foreground text-xs'>
          By clicking this checkbox, you agree to the terms and conditions.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm'>
            Reset
          </Button>
          <Button size='sm'>Submit</Button>
        </div>
      </div>
    </div>
  )
}

export default CheckboxFormDemo
```
