# Animated Radio Group Components

2 variants from ShadcnStudio. Select based on use case.

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Animated Inset | Filled background + shrinking icon | Language selection |
| 2 | Motion Spring | Framer Motion spring animation | Interactive forms |

---

## Animated Radio Group 1 - Animated Inset

```tsx
import { CircleIcon } from 'lucide-react'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { Label } from '@/components/ui/label'

const RadioGroupAnimatedInsetDemo = () => {
  return (
    <RadioGroupPrimitive.Root data-slot='radio-group' defaultValue='english' className='grid gap-3'>
      <div className='flex items-center gap-2'>
        <RadioGroupPrimitive.Item
          value='english'
          id='lang-english'
          data-slot='radio-group-item'
          className='border-input focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground [&_svg]:fill-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary! relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-[3px] [&_svg]:size-4 data-[state=checked]:[&_svg]:size-2'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioGroupPrimitive.Item>
        <Label htmlFor='lang-english'>English</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupPrimitive.Item
          value='spanish'
          id='lang-spanish'
          data-slot='radio-group-item'
          className='border-input focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground [&_svg]:fill-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary! relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-[3px] [&_svg]:size-4 data-[state=checked]:[&_svg]:size-2'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioGroupPrimitive.Item>
        <Label htmlFor='lang-spanish'>Español</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupPrimitive.Item
          value='french'
          id='lang-french'
          data-slot='radio-group-item'
          className='border-input focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground [&_svg]:fill-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary! relative aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border] outline-none focus-visible:ring-[3px] [&_svg]:size-4 data-[state=checked]:[&_svg]:size-2'
        >
          <CircleIcon className='fill-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500' />
        </RadioGroupPrimitive.Item>
        <Label htmlFor='lang-french'>Français</Label>
      </div>
    </RadioGroupPrimitive.Root>
  )
}

export default RadioGroupAnimatedInsetDemo
```

---

## Animated Radio Group 2 - Motion Spring

Uses Framer Motion for spring animations with hover/tap effects.

### Dependencies

```bash
npm install motion
```

### Component

```tsx
'use client'

import * as React from 'react'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { AnimatePresence, motion, type HTMLMotionProps, type Transition } from 'motion/react'
import { CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  HTMLMotionProps<'button'> & {
    transition?: Transition
  }

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot='radio-group' className={cn('grid gap-3', className)} {...props} />
}

function RadioGroupItem({
  className,
  transition = { type: 'spring', stiffness: 200, damping: 16 },
  ...props
}: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item asChild {...props}>
      <motion.button
        data-slot='radio-group-item'
        className={cn(
          'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-5 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <RadioGroupPrimitive.Indicator
          data-slot='radio-group-indicator'
          className='relative flex items-center justify-center'
        >
          <AnimatePresence>
            <motion.div
              key='radio-group-indicator-circle'
              data-slot='radio-group-indicator-circle'
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={transition}
            >
              <CircleIcon className='size-3 fill-current text-current' />
            </motion.div>
          </AnimatePresence>
        </RadioGroupPrimitive.Indicator>
      </motion.button>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
```

### Usage Example

```tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from './animated-radio-group'

const Example = () => {
  return (
    <RadioGroup defaultValue='option-1'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='option-1' id='option-1' />
        <Label htmlFor='option-1'>Option 1</Label>
      </div>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='option-2' id='option-2' />
        <Label htmlFor='option-2'>Option 2</Label>
      </div>
    </RadioGroup>
  )
}
```
