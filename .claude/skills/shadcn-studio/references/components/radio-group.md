# Radio Group Components

13 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Basic | Vertical layout | Simple selection |
| 2 | Horizontal | Inline layout | Space-efficient choices |
| 3 | Colors | Custom colors (destructive, success, info) | Status indicators |
| 4 | Sizes | Default, medium, large | Various layouts |
| 5 | Dashed | Dashed border style | Subtle selection |
| 6 | Solid | Filled background when selected | High contrast |
| 7 | With Description | Label + description text | Detailed options |
| 8 | Chip | Chip/pill style, grid layout | Size/variant selection |
| 9 | List Group | Card list with badges | Pricing plans |
| 10 | Split List Group | Rounded pills, inverted colors | Featured plans |
| 11 | Card Radio | Card with radio visible | Plan selection |
| 12 | Card Border Only | Hidden radio, border highlight | Clean card selection |
| 13 | Card Vertical | Vertical cards with icons | Visual plan comparison |

---

## Radio Group 1 - Basic

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupDemo = () => {
  return (
    <RadioGroup defaultValue='higher-secondary'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='higher-secondary' id='higher-secondary' />
        <Label htmlFor='higher-secondary'>Higher Secondary</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='graduation' id='graduation' />
        <Label htmlFor='graduation'>Graduation</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='post-graduation' id='post-graduation' />
        <Label htmlFor='post-graduation'>Post Graduation</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupDemo
```

---

## Radio Group 2 - Horizontal

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupHorizontalDemo = () => {
  return (
    <RadioGroup defaultValue='beginner' className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='beginner' id='beginner' />
        <Label htmlFor='beginner'>Beginner</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='intermediate' id='intermediate' />
        <Label htmlFor='intermediate'>Intermediate</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='advanced' id='advanced' />
        <Label htmlFor='advanced'>Advanced</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupHorizontalDemo
```

---

## Radio Group 3 - Colors

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupColorsDemo = () => {
  return (
    <RadioGroup defaultValue='destructive' className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='destructive'
          id='color-destructive'
          className='border-destructive text-destructive [&_svg]:fill-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive dark:focus-visible:ring-destructive/40'
        />
        <Label htmlFor='color-destructive'>Destructive</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='success'
          id='color-success'
          className='border-green-600 text-green-600 focus-visible:border-green-600 focus-visible:ring-green-600/20 dark:border-green-400 dark:text-green-400 dark:focus-visible:border-green-400 dark:focus-visible:ring-green-400/40 [&_svg]:fill-green-600 dark:[&_svg]:fill-green-400'
        />
        <Label htmlFor='color-success'>Success</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='info'
          id='color-info'
          className='border-sky-600 text-sky-600 focus-visible:border-sky-600 focus-visible:ring-sky-600/20 dark:border-sky-400 dark:text-sky-400 dark:focus-visible:border-sky-400 dark:focus-visible:ring-sky-400/40 [&_svg]:fill-sky-600 dark:[&_svg]:fill-sky-400'
        />
        <Label htmlFor='color-info'>Info</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupColorsDemo
```

---

## Radio Group 4 - Sizes

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupSizesDemo = () => {
  return (
    <RadioGroup defaultValue='default' className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='default' id='size-default' />
        <Label htmlFor='size-default'>Default</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='medium' id='size-medium' className='size-5 [&_svg]:size-3' />
        <Label htmlFor='size-medium'>Medium</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='large' id='size-large' className='size-6 [&_svg]:size-3.5' />
        <Label htmlFor='size-large'>Large</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupSizesDemo
```

---

## Radio Group 5 - Dashed

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupDashedDemo = () => {
  return (
    <RadioGroup defaultValue='standard'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='standard'
          id='standard'
          className='border-primary focus-visible:border-primary border-dashed'
        />
        <Label htmlFor='standard'>Standard Shipping</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='express'
          id='express'
          className='border-primary focus-visible:border-primary border-dashed'
        />
        <Label htmlFor='express'>Express Delivery</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='overnight'
          id='overnight'
          className='border-primary focus-visible:border-primary border-dashed'
        />
        <Label htmlFor='overnight'>Overnight Shipping</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupDashedDemo
```

---

## Radio Group 6 - Solid

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupSolidDemo = () => {
  return (
    <RadioGroup defaultValue='light'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='light'
          id='theme-light'
          className='text-primary-foreground data-[state=checked]:bg-primary! data-[state=checked]:border-primary data-[state=checked]:[&_svg]:fill-primary-foreground'
        />
        <Label htmlFor='theme-light'>Light Theme</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='dark'
          id='theme-dark'
          className='text-primary-foreground data-[state=checked]:bg-primary! data-[state=checked]:border-primary data-[state=checked]:[&_svg]:fill-primary-foreground'
        />
        <Label htmlFor='theme-dark'>Dark Theme</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem
          value='system'
          id='theme-system'
          className='text-primary-foreground data-[state=checked]:bg-primary! data-[state=checked]:border-primary data-[state=checked]:[&_svg]:fill-primary-foreground'
        />
        <Label htmlFor='theme-system'>System Default</Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupSolidDemo
```

---

## Radio Group 7 - With Description

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupDescriptionDemo = () => {
  return (
    <RadioGroup defaultValue='basic'>
      <div className='flex gap-2'>
        <RadioGroupItem value='basic' id='plan-basic' />
        <div className='grid flex-1 space-y-2'>
          <Label htmlFor='plan-basic'>Basic Plan</Label>
          <p className='text-muted-foreground text-xs'>Perfect for individuals just getting started</p>
        </div>
      </div>
      <div className='flex gap-2'>
        <RadioGroupItem value='pro' id='plan-pro' />
        <div className='grid flex-1 space-y-2'>
          <Label htmlFor='plan-pro'>Pro Plan</Label>
          <p className='text-muted-foreground text-xs'>Advanced features for power users and small teams</p>
        </div>
      </div>
      <div className='flex gap-2'>
        <RadioGroupItem value='enterprise' id='plan-enterprise' />
        <div className='grid flex-1 space-y-2'>
          <Label htmlFor='plan-enterprise'>Enterprise Plan</Label>
          <p className='text-muted-foreground text-xs'>Custom solutions for large organizations</p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupDescriptionDemo
```

---

## Radio Group 8 - Chip

```tsx
import { useId } from 'react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupChipDemo = () => {
  const id = useId()

  const items = [
    { value: '1', label: 'Size: 6 (UK)' },
    { value: '2', label: 'Size: 7 (UK)', disabled: true },
    { value: '3', label: 'Size: 8 (UK)' },
    { value: '4', label: 'Size: 9 (UK)' },
    { value: '5', label: 'Size: 10 (UK)' }
  ]

  return (
    <fieldset className='w-full max-w-96 space-y-4'>
      <legend className='text-foreground text-sm leading-none font-medium'>Select Shoe Size: </legend>
      <RadioGroup className='grid grid-cols-3 gap-2' defaultValue='1'>
        {items.map(item => (
          <label
            key={`${id}-${item.value}`}
            className='border-input has-data-[state=checked]:border-primary/80 has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex flex-col items-center gap-3 rounded-md border px-2 py-3 text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50'
          >
            <RadioGroupItem
              id={`${id}-${item.value}`}
              value={item.value}
              className='sr-only after:absolute after:inset-0'
              aria-label={`size-radio-${item.value}`}
              disabled={item.disabled}
            />
            <p className='text-foreground text-sm leading-none font-medium'>{item.label}</p>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

export default RadioGroupChipDemo
```

---

## Radio Group 9 - List Group

```tsx
import { useId } from 'react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupListGroupDemo = () => {
  const id = useId()

  const items = [
    { value: '1', label: 'Pro', price: '$39/mo' },
    { value: '2', label: 'Team', price: '$69/mo' },
    { value: '3', label: 'Enterprise', price: 'Custom' }
  ]

  return (
    <RadioGroup className='w-full max-w-96 gap-0 -space-y-px rounded-md shadow-xs' defaultValue='2'>
      {items.map(item => (
        <div
          key={`${id}-${item.value}`}
          className='border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col gap-4 border p-4 outline-none first:rounded-t-md last:rounded-b-md has-data-[state=checked]:z-10'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                id={`${id}-${item.value}`}
                value={item.value}
                className='after:absolute after:inset-0'
                aria-label={`plan-radio-${item.value}`}
                aria-describedby={`${`${id}-${item.value}`}-price`}
              />
              <Label className='inline-flex items-center' htmlFor={`${id}-${item.value}`}>
                {item.label}
                {item.value === '2' && <Badge className='rounded-sm px-1.5 py-px text-xs'>Best Seller</Badge>}
              </Label>
            </div>
            <div id={`${`${id}-${item.value}`}-price`} className='text-muted-foreground text-xs leading-[inherit]'>
              {item.price}
            </div>
          </div>
        </div>
      ))}
    </RadioGroup>
  )
}

export default RadioGroupListGroupDemo
```

---

## Radio Group 10 - Split List Group

```tsx
import { useId } from 'react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupSplitListGroupDemo = () => {
  const id = useId()

  const items = [
    { value: '1', label: 'Pro', price: '$39/mo' },
    { value: '2', label: 'Team', price: '$69/mo' },
    { value: '3', label: 'Enterprise', price: 'Custom' }
  ]

  return (
    <RadioGroup className='w-full max-w-96 gap-0 space-y-2 rounded-md *:rounded-full' defaultValue='2'>
      {items.map(item => (
        <div
          key={`${id}-${item.value}`}
          className='border-input has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground relative flex flex-col gap-4 border p-4 outline-none has-data-[state=checked]:z-10'
        >
          <div className='group flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <RadioGroupItem
                id={`${id}-${item.value}`}
                value={item.value}
                aria-label={`plan-radio-${item.value}`}
                className='text-primary bg-accent data-[state=checked]:bg-primary-foreground! data-[state=checked]:border-primary-foreground data-[state=checked]:[&_svg]:fill-primary after:absolute after:inset-0'
                aria-describedby={`${`${id}-${item.value}`}-price`}
              />
              <Label className='inline-flex items-center' htmlFor={`${id}-${item.value}`}>
                {item.label}
                {item.value === '2' && (
                  <Badge
                    variant='outline'
                    className='rounded-sm border-green-500 bg-green-500/10 px-1.5 py-px text-xs text-green-500'
                  >
                    Best Seller
                  </Badge>
                )}
              </Label>
            </div>
            <div
              id={`${`${id}-${item.value}`}-price`}
              className='group-has-checked:text-primary-foreground text-xs leading-[inherit]'
            >
              {item.price}
            </div>
          </div>
        </div>
      ))}
    </RadioGroup>
  )
}

export default RadioGroupSplitListGroupDemo
```

---

## Radio Group 11 - Card Radio

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupCardRadioDemo = () => {
  const id = useId()

  return (
    <RadioGroup className='w-full max-w-96 gap-2' defaultValue='1'>
      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-center gap-2 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='1'
          id={`${id}-1`}
          aria-label='plan-radio-basic'
          aria-describedby={`${id}-1-description`}
          className='size-5 after:absolute after:inset-0 [&_svg]:size-3'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={`${id}-1`} className='justify-between'>
            Basic <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>Free</span>
          </Label>
          <p id={`${id}-1-description`} className='text-muted-foreground text-xs'>
            Get 1 project with 1 teams members.
          </p>
        </div>
      </div>

      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-center gap-2 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='2'
          id={`${id}-2`}
          aria-describedby={`${id}-2-description`}
          className='size-5 after:absolute after:inset-0 [&_svg]:size-3'
        />
        <div className='grid grow gap-2'>
          <Label htmlFor={`${id}-2`} className='justify-between'>
            Premium <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>$5.00</span>
          </Label>
          <p id={`${id}-2-description`} className='text-muted-foreground text-xs'>
            Get 5 projects with 5 team members.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardRadioDemo
```

---

## Radio Group 12 - Card Border Only

```tsx
import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupCardRadioWithBorderDemo = () => {
  const id = useId()

  return (
    <RadioGroup className='w-full max-w-96 gap-2' defaultValue='1'>
      <div className='border-input has-data-[state=checked]:border-primary/50 has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative w-full rounded-md border p-3 shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px]'>
        <RadioGroupItem
          value='1'
          id={`${id}-1`}
          className='sr-only'
          aria-label='plan-radio-basic'
          aria-describedby={`${id}-1-description`}
        />

        <Label htmlFor={`${id}-1`} className='text-foreground flex flex-col items-start after:absolute after:inset-0'>
          <div className='flex w-full items-center justify-between'>
            <span>Basic</span>
            <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>Free</span>
          </div>
          <p id={`${id}-1-description`} className='text-muted-foreground text-xs'>
            Get 1 project with 1 teams members.
          </p>
        </Label>
      </div>

      <div className='border-input has-data-[state=checked]:border-primary/50 has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative w-full rounded-md border p-3 shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px]'>
        <RadioGroupItem
          value='2'
          id={`${id}-2`}
          className='sr-only'
          aria-label='plan-radio-premium'
          aria-describedby={`${id}-2-description`}
        />

        <Label htmlFor={`${id}-2`} className='text-foreground flex flex-col items-start after:absolute after:inset-0'>
          <div className='flex w-full items-center justify-between'>
            <span>Premium</span>
            <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>$5.00</span>
          </div>
          <p id={`${id}-2-description`} className='text-muted-foreground text-xs'>
            Get 5 projects with 5 team members.
          </p>
        </Label>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardRadioWithBorderDemo
```

---

## Radio Group 13 - Card Vertical

```tsx
import { useId } from 'react'

import { UserIcon, CrownIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RadioGroupCardVerticalRadioDemo = () => {
  const id = useId()

  return (
    <RadioGroup className='w-full max-w-96 justify-items-center sm:grid-cols-2' defaultValue='1'>
      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full max-w-50 flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='1'
          id={`${id}-1`}
          className='order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3'
          aria-describedby={`${id}-1-description`}
          aria-label='plan-radio-basic'
        />
        <div className='grid grow justify-items-center gap-2'>
          <UserIcon />
          <Label htmlFor={`${id}-1`} className='justify-center'>
            Basic
          </Label>
          <p id={`${id}-1-description`} className='text-muted-foreground text-center text-xs'>
            Get 1 project with 1 teams members.
          </p>
        </div>
      </div>
      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full max-w-50 flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
        <RadioGroupItem
          value='2'
          id={`${id}-2`}
          className='order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3'
          aria-describedby={`${id}-2-description`}
          aria-label='plan-radio-premium'
        />
        <div className='grid grow justify-items-center gap-2'>
          <CrownIcon />
          <Label htmlFor={`${id}-2`} className='justify-center'>
            Premium
          </Label>
          <p id={`${id}-2-description`} className='text-muted-foreground text-center text-xs'>
            Get 5 projects with 5 team members.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

export default RadioGroupCardVerticalRadioDemo
```
