# Animated Checkbox Components

3 variants from ShadcnStudio. Select based on use case.

**Requires:** `motion/react` (Framer Motion)

## Quick Reference

| # | Style | Features | Use Case |
|---|-------|----------|----------|
| 1 | Animated | Scale + path animation | Enhanced feedback |
| 2 | Todo | Strikethrough animation | Animated task lists |
| 3 | Confetti | Particle explosion | Celebrations, gamification |

---

## 1. Animated

Checkbox with scale and checkmark path animation.

**Demo:**
```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/motion-checkbox'
import { Label } from '@/components/ui/label'

const CheckboxAnimatedDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} defaultChecked />
      <Label htmlFor={id}>Animated checkbox</Label>
    </div>
  )
}

export default CheckboxAnimatedDemo
```

**Component (`components/ui/motion-checkbox.tsx`):**
```tsx
'use client'

import * as React from 'react'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { motion, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/utils'

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & HTMLMotionProps<'button'>

function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  const [isChecked, setIsChecked] = React.useState(props?.checked ?? props?.defaultChecked ?? false)

  React.useEffect(() => {
    if (props?.checked !== undefined) setIsChecked(props.checked)
  }, [props?.checked])

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      setIsChecked(checked)
      onCheckedChange?.(checked)
    },
    [onCheckedChange]
  )

  return (
    <CheckboxPrimitive.Root {...props} onCheckedChange={handleCheckedChange} asChild>
      <motion.button
        data-slot='checkbox'
        className={cn(
          'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-colors duration-500 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount asChild>
          <motion.svg
            data-slot='checkbox-indicator'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='3.5'
            stroke='currentColor'
            className='size-3.5'
            initial='unchecked'
            animate={isChecked ? 'checked' : 'unchecked'}
          >
            <motion.path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M4.5 12.75l6 6 9-13.5'
              variants={{
                checked: {
                  pathLength: 1,
                  opacity: 1,
                  transition: {
                    duration: 0.2,
                    delay: 0.2
                  }
                },
                unchecked: {
                  pathLength: 0,
                  opacity: 0,
                  transition: {
                    duration: 0.2
                  }
                }
              }}
            />
          </motion.svg>
        </CheckboxPrimitive.Indicator>
      </motion.button>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
```

---

## 2. Todo with Animation

Animated todo item with strikethrough effect.

**Demo:**
```tsx
import { useId } from 'react'

import { Checkbox } from '@/components/ui/motion-checkbox'
import { Label } from '@/components/ui/label'

const CheckboxAnimatedTodoListDemo = () => {
  const id = useId()

  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        id={id}
        defaultChecked
        className='rounded-full focus-visible:border-blue-500 focus-visible:ring-blue-500/20 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500! dark:text-white dark:focus-visible:ring-blue-500/40'
      />
      <Label
        htmlFor={id}
        className='after:bg-primary peer-data-[state=checked]:text-primary relative after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:origin-bottom after:scale-x-0 after:transition-transform after:duration-500 after:ease-in-out peer-data-[state=checked]:after:origin-bottom peer-data-[state=checked]:after:scale-x-100'
      >
        Animated todo list item
      </Label>
    </div>
  )
}

export default CheckboxAnimatedTodoListDemo
```

**Component:** Uses the same `motion-checkbox.tsx` from variant #1.

---

## 3. Confetti

Checkbox with confetti particle explosion on check.

```tsx
'use client'

import { useId, useState } from 'react'

import { motion, AnimatePresence, easeOut } from 'motion/react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const particleAnimation = (index: number) => {
  const angle = Math.random() * Math.PI * 2
  const distance = 30 + Math.random() * 20

  return {
    initial: { x: '50%', y: '50%', scale: 0, opacity: 0 },
    animate: {
      x: `calc(50% + ${Math.cos(angle) * distance}px)`,
      y: `calc(50% + ${Math.sin(angle) * distance}px)`,
      scale: [0, 1, 0],
      opacity: [0, 1, 0]
    },
    transition: { duration: 0.4, delay: index * 0.05, ease: easeOut }
  }
}

const ConfettiPiece = ({ index }: { index: number }) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
  const color = colors[index % colors.length]

  return (
    <motion.div
      className='absolute size-1 rounded-full'
      style={{ backgroundColor: color }}
      {...particleAnimation(index)}
    />
  )
}

const CheckboxConfettiDemo = () => {
  const [showConfetti, setShowConfetti] = useState(false)
  const id = useId()

  const handleCheckedChange = (checked: boolean) => {
    if (checked) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 800)
    }
  }

  return (
    <div className='relative flex items-center gap-2'>
      <Checkbox id={id} onCheckedChange={handleCheckedChange} />
      <Label htmlFor={id}>Check to see magic</Label>
      <AnimatePresence>
        {showConfetti && (
          <div className='pointer-events-none absolute inset-0'>
            {[...Array(12)].map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CheckboxConfettiDemo
```
